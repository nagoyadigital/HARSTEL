/**
 * Shaken Notification Checker
 * Runs on app load / login to auto-generate notifications
 * for vehicles with expiring or expired Shaken
 */
import { base44 } from '@/api/base44Client';
import { getShakenStatus } from './shaken-utils';
import { format } from 'date-fns';

const LAST_CHECK_KEY = 'harstel_shaken_last_check';
const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Check all vehicles and generate shaken notifications
 * Returns summary of findings for the priority popup
 */
export async function checkShakenNotifications() {
  const vehicles = await base44.entities.Vehicle.list();
  const now = new Date();

  const expired = [];
  const critical30 = [];
  const warning60 = [];
  const warning90 = [];

  vehicles.forEach(v => {
    if (!v.shakeng_expiry) return;
    const { daysRemaining, status } = getShakenStatus(v.shakeng_expiry);
    if (daysRemaining === null) return;

    const entry = {
      id: v.id,
      plate_number: v.plate_number,
      brand: v.brand,
      model: v.model,
      customer_name: v.customer_name,
      customer_id: v.customer_id,
      expiry: v.shakeng_expiry,
      daysRemaining,
    };

    if (daysRemaining < 0) expired.push(entry);
    else if (daysRemaining <= 30) critical30.push(entry);
    else if (daysRemaining <= 60) warning60.push(entry);
    else if (daysRemaining <= 90) warning90.push(entry);
  });

  return { expired, critical30, warning60, warning90 };
}

/**
 * Generate notification records in the database
 * Only generates if not already generated today
 */
export async function generateShakenNotifications() {
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  const now = Date.now();

  // Skip if checked recently
  if (lastCheck && (now - Number(lastCheck)) < CHECK_INTERVAL) {
    return null;
  }

  const results = await checkShakenNotifications();
  const { expired, critical30, warning60, warning90 } = results;
  const totalAlerts = expired.length + critical30.length + warning60.length + warning90.length;

  if (totalAlerts === 0) {
    localStorage.setItem(LAST_CHECK_KEY, String(now));
    return results;
  }

  // Load existing notifications to avoid duplicates
  let existingNotifs = [];
  try {
    existingNotifs = await base44.entities.Notification.list('-created_date', 100);
  } catch { /* empty */ }

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayNotifs = existingNotifs.filter(n =>
    n.type === 'shakeng' && n.date === today
  );

  // Only generate if we haven't generated today
  if (todayNotifs.length === 0) {
    const notifications = [];

    // Generate per-vehicle notifications for critical ones
    for (const v of expired) {
      notifications.push({
        type: 'shakeng',
        title: `Shaken EXPIRED — ${v.plate_number}`,
        message: `${v.brand} ${v.model} (${v.customer_name}) — Shaken sudah expired ${Math.abs(v.daysRemaining)} hari lalu. Segera hubungi pelanggan.`,
        date: today,
        read: false,
        vehicle_id: v.id,
        priority: 'critical',
      });
    }

    for (const v of critical30) {
      notifications.push({
        type: 'shakeng',
        title: `Shaken H-${v.daysRemaining} — ${v.plate_number}`,
        message: `${v.brand} ${v.model} (${v.customer_name}) — Shaken akan habis dalam ${v.daysRemaining} hari (${format(new Date(v.expiry), 'dd MMM yyyy')}).`,
        date: today,
        read: false,
        vehicle_id: v.id,
        priority: 'high',
      });
    }

    // For 60-90 day ones, generate summary notification
    if (warning60.length + warning90.length > 0) {
      notifications.push({
        type: 'shakeng',
        title: `${warning60.length + warning90.length} kendaraan Shaken akan habis`,
        message: `${warning60.length} kendaraan dalam 60 hari, ${warning90.length} kendaraan dalam 90 hari. Jadwalkan reminder untuk pelanggan.`,
        date: today,
        read: false,
        priority: 'medium',
      });
    }

    // Create notifications in DB
    for (const notif of notifications) {
      try {
        await base44.entities.Notification.create(notif);
      } catch { /* silent */ }
    }
  }

  localStorage.setItem(LAST_CHECK_KEY, String(now));
  return results;
}

/**
 * Force re-check (ignores interval)
 */
export async function forceCheckShaken() {
  localStorage.removeItem(LAST_CHECK_KEY);
  return generateShakenNotifications();
}
