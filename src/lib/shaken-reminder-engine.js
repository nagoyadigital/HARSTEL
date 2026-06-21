/**
 * Shaken Reminder Engine
 * Handles automatic and manual reminder sending, templates, and history
 */
import { base44 } from '@/api/base44Client';
import { getShakenStatus } from './shaken-utils';
import { format, differenceInDays } from 'date-fns';

const REMINDER_CHECK_KEY = 'harstel_reminder_last_run';
const TEMPLATES_KEY = 'harstel_reminder_templates';

// Default reminder schedule days
export const REMINDER_SCHEDULE_OPTIONS = [90, 60, 30, 14, 7, 1];

// Default message templates
const DEFAULT_TEMPLATES = {
  whatsapp: `Yth. {nama_pelanggan},\n\nKami dari HARSTEL Workshop menginformasikan bahwa Shaken (車検) kendaraan Anda:\n\n🚗 {merk} {model}\n📋 Plat: {plat_nomor}\n📅 Kadaluarsa: {tanggal_kadaluarsa}\n⏰ Sisa: {sisa_hari} hari\n\nMohon segera jadwalkan perpanjangan Shaken agar kendaraan tetap legal di jalan.\n\nHubungi kami untuk reservasi:\n📞 HARSTEL Workshop\n\nTerima kasih.`,
  email: `Yth. {nama_pelanggan},\n\nDengan hormat,\n\nKami menginformasikan bahwa masa berlaku Shaken (車検) kendaraan Anda akan segera berakhir:\n\nKendaraan: {merk} {model}\nNomor Plat: {plat_nomor}\nTanggal Kadaluarsa: {tanggal_kadaluarsa}\nSisa Waktu: {sisa_hari} hari\n\nMohon segera melakukan perpanjangan Shaken untuk menghindari denda dan masalah hukum.\n\nSilakan hubungi kami untuk penjadwalan:\nHARSTEL Workshop\n\nHormat kami,\nTim HARSTEL Workshop`,
  sms: `[HARSTEL] Yth. {nama_pelanggan}, Shaken kendaraan {plat_nomor} ({merk} {model}) akan habis pada {tanggal_kadaluarsa} (sisa {sisa_hari} hari). Segera hubungi kami untuk perpanjangan. - HARSTEL Workshop`,
};

/**
 * Get reminder templates (from localStorage or defaults)
 */
export function getTemplates() {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* use defaults */ }
  return DEFAULT_TEMPLATES;
}

/**
 * Save reminder templates
 */
export function saveTemplates(templates) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

/**
 * Replace template variables with actual values
 */
export function renderTemplate(template, data) {
  return template
    .replace(/{nama_pelanggan}/g, data.customer_name || '-')
    .replace(/{plat_nomor}/g, data.plate_number || '-')
    .replace(/{merk}/g, data.brand || '-')
    .replace(/{model}/g, data.model || '-')
    .replace(/{tanggal_kadaluarsa}/g, data.expiry_formatted || '-')
    .replace(/{sisa_hari}/g, String(data.days_remaining ?? '-'));
}

/**
 * Send a manual reminder (simulated for desktop app)
 * In production, this would integrate with WhatsApp API, SMTP, SMS gateway
 */
export async function sendReminder({ vehicle, customer, method, template, sentBy }) {
  const { daysRemaining } = getShakenStatus(vehicle.shakeng_expiry);
  
  const templateData = {
    customer_name: customer?.name || vehicle.customer_name || '-',
    plate_number: vehicle.plate_number,
    brand: vehicle.brand,
    model: vehicle.model,
    expiry_formatted: vehicle.shakeng_expiry ? format(new Date(vehicle.shakeng_expiry), 'dd MMMM yyyy') : '-',
    days_remaining: daysRemaining,
  };

  const message = renderTemplate(template || getTemplates()[method] || '', templateData);

  // Simulate sending (in production, call actual API)
  const success = await simulateSend(method, message, customer);

  // Record in history
  const historyEntry = {
    vehicle_id: vehicle.id,
    vehicle_plate: vehicle.plate_number,
    vehicle_info: `${vehicle.brand} ${vehicle.model}`,
    customer_id: vehicle.customer_id || customer?.id,
    customer_name: customer?.name || vehicle.customer_name,
    method,
    message,
    status: success ? 'sent' : 'failed',
    sent_by: sentBy || 'Admin',
    sent_at: new Date().toISOString(),
    trigger: 'manual',
    schedule_day: null,
  };

  try {
    await base44.entities.ReminderHistory.create(historyEntry);
  } catch { /* silent */ }

  return { success, message, historyEntry };
}

/**
 * Simulate sending a message (desktop app placeholder)
 * Returns true for success simulation
 */
async function simulateSend(method, message, customer) {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 800));

  // In a real desktop app (.exe), this would:
  // - WhatsApp: Open WhatsApp Desktop/Web with pre-filled message
  // - Email: Send via SMTP or open default email client
  // - SMS: Call SMS gateway API
  
  // For now, simulate 95% success rate
  return Math.random() > 0.05;
}

/**
 * Run automatic daily reminder check
 * Checks all Shaken records and sends reminders based on schedule
 */
export async function runDailyReminderCheck() {
  const lastRun = localStorage.getItem(REMINDER_CHECK_KEY);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Only run once per day
  if (lastRun === today) return { skipped: true, reason: 'Already ran today' };

  const vehicles = await base44.entities.Vehicle.list();
  const now = new Date();
  const sentReminders = [];

  // Get existing reminder history to avoid duplicates
  let history = [];
  try {
    history = await base44.entities.ReminderHistory.list('-sent_at', 500);
  } catch { /* empty */ }

  for (const vehicle of vehicles) {
    if (!vehicle.shakeng_expiry) continue;

    const { daysRemaining } = getShakenStatus(vehicle.shakeng_expiry);
    if (daysRemaining === null || daysRemaining < 0) continue;

    // Check if this day matches any scheduled reminder
    const matchedSchedule = REMINDER_SCHEDULE_OPTIONS.find(d => d === daysRemaining);
    if (!matchedSchedule) continue;

    // Check if already sent for this vehicle + schedule day + today
    const alreadySent = history.some(h =>
      h.vehicle_id === vehicle.id &&
      h.schedule_day === matchedSchedule &&
      h.sent_at?.startsWith(today) &&
      h.trigger === 'auto'
    );
    if (alreadySent) continue;

    // Determine which methods to use (from Shaken record or defaults)
    let shakenRecord = null;
    try {
      const shakenRecords = await base44.entities.Shaken.filter({ vehicle_id: vehicle.id });
      shakenRecord = shakenRecords[0];
    } catch { /* empty */ }

    const methods = [];
    if (shakenRecord?.reminder_whatsapp) methods.push('whatsapp');
    if (shakenRecord?.reminder_email) methods.push('email');
    if (shakenRecord?.reminder_sms) methods.push('sms');

    // Check if the schedule day is in the reminder_days config
    const scheduleDays = shakenRecord?.reminder_days || [90, 60, 30];
    if (!scheduleDays.includes(matchedSchedule)) continue;

    // If no methods configured, skip
    if (methods.length === 0) continue;

    // Send reminders
    for (const method of methods) {
      const templates = getTemplates();
      const templateData = {
        customer_name: vehicle.customer_name || '-',
        plate_number: vehicle.plate_number,
        brand: vehicle.brand,
        model: vehicle.model,
        expiry_formatted: format(new Date(vehicle.shakeng_expiry), 'dd MMMM yyyy'),
        days_remaining: daysRemaining,
      };

      const message = renderTemplate(templates[method] || '', templateData);
      const success = await simulateSend(method, message, null);

      const entry = {
        vehicle_id: vehicle.id,
        vehicle_plate: vehicle.plate_number,
        vehicle_info: `${vehicle.brand} ${vehicle.model}`,
        customer_id: vehicle.customer_id,
        customer_name: vehicle.customer_name,
        method,
        message,
        status: success ? 'sent' : 'failed',
        sent_by: 'System (Auto)',
        sent_at: new Date().toISOString(),
        trigger: 'auto',
        schedule_day: matchedSchedule,
      };

      try {
        await base44.entities.ReminderHistory.create(entry);
      } catch { /* silent */ }

      sentReminders.push(entry);
    }
  }

  localStorage.setItem(REMINDER_CHECK_KEY, today);
  return { skipped: false, sentReminders };
}

/**
 * Open WhatsApp with pre-filled message (desktop app)
 */
export function openWhatsApp(phone, message) {
  const encoded = encodeURIComponent(message);
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
}

/**
 * Open email client with pre-filled message
 */
export function openEmail(email, subject, body) {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  window.open(`mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`, '_blank');
}
