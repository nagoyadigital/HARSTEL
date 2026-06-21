/**
 * Shaken (車検) Utility Functions
 * Status calculation, days remaining, cost estimation, and helpers
 */

import { differenceInDays, format, addYears } from 'date-fns';

/**
 * Calculate Shaken status based on expiry date
 * @param {string} expiryDate - ISO date string
 * @returns {{ status: string, daysRemaining: number, color: string, urgency: string }}
 */
export function getShakenStatus(expiryDate) {
  if (!expiryDate) return { status: 'Tidak Ada Data', daysRemaining: null, color: 'gray', urgency: 'none' };

  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysRemaining = differenceInDays(expiry, now);

  if (daysRemaining < 0) {
    return { status: 'Expired', daysRemaining, color: 'red', urgency: 'critical' };
  }
  if (daysRemaining <= 30) {
    return { status: 'Akan Habis', daysRemaining, color: 'red', urgency: 'high' };
  }
  if (daysRemaining <= 60) {
    return { status: 'Akan Habis', daysRemaining, color: 'amber', urgency: 'medium' };
  }
  if (daysRemaining <= 90) {
    return { status: 'Akan Habis', daysRemaining, color: 'amber', urgency: 'low' };
  }
  return { status: 'Aktif', daysRemaining, color: 'green', urgency: 'none' };
}

/**
 * Get appropriate badge variant based on days remaining
 */
export function getShakenBadgeVariant(daysRemaining) {
  if (daysRemaining === null) return 'default';
  if (daysRemaining < 0) return 'destructive';
  if (daysRemaining <= 30) return 'destructive';
  if (daysRemaining <= 60) return 'warning';
  if (daysRemaining <= 90) return 'warning';
  return 'success';
}

/**
 * Format days remaining into human-readable text
 */
export function formatDaysRemaining(daysRemaining) {
  if (daysRemaining === null) return 'Data tidak tersedia';
  if (daysRemaining < 0) return `Expired ${Math.abs(daysRemaining)} hari lalu`;
  if (daysRemaining === 0) return 'Habis hari ini!';
  if (daysRemaining === 1) return 'Sisa 1 hari';
  return `Sisa ${daysRemaining} hari`;
}

/**
 * Estimate next Shaken cost based on vehicle data
 * Standard rates for Japan (approximate 2024 values)
 */
export function estimateShakenCost({ vehicleWeight, vehicleAge, fuelType }) {
  // Weight tax (重量税) based on vehicle weight
  let weightTax = 0;
  const weight = vehicleWeight || 1500; // default 1500kg
  if (weight <= 500) weightTax = 8200;
  else if (weight <= 1000) weightTax = 16400;
  else if (weight <= 1500) weightTax = 24600;
  else if (weight <= 2000) weightTax = 32800;
  else if (weight <= 2500) weightTax = 41000;
  else weightTax = 49200;

  // Older vehicles pay more
  const age = vehicleAge || 5;
  if (age >= 18) weightTax = Math.round(weightTax * 1.5);
  else if (age >= 13) weightTax = Math.round(weightTax * 1.3);

  // Jibaiseki (自賠責保険) - compulsory insurance ~20,010 for 24 months
  const jibaiseki = 20010;

  // Inspection fee (検査手数料)
  const inspectionFee = fuelType === 'Hybrid' || fuelType === 'Listrik' ? 1800 : 2100;

  // Stamp fee (印紙代)
  const stampFee = 400;

  // Maintenance/repair estimate (整備費用) - average
  const maintenanceCost = age >= 10 ? 80000 : age >= 5 ? 50000 : 30000;

  // Agency fee (代行手数料) if done through shop
  const agencyFee = 15000;

  const total = weightTax + jibaiseki + inspectionFee + stampFee + maintenanceCost + agencyFee;

  return {
    weightTax,
    jibaiseki,
    inspectionFee,
    stampFee,
    maintenanceCost,
    agencyFee,
    total,
  };
}

/**
 * Calculate next Shaken expiry date (2 years from current expiry)
 */
export function getNextShakenExpiry(currentExpiry) {
  if (!currentExpiry) return null;
  return addYears(new Date(currentExpiry), 2);
}

/**
 * Filter vehicles/shaken records by urgency level
 */
export function filterByUrgency(records, level) {
  return records.filter(r => {
    const expiry = r.shaken_expiry || r.shakeng_expiry;
    if (!expiry) return false;
    const { urgency } = getShakenStatus(expiry);
    switch (level) {
      case 'all': return true;
      case 'expired': return urgency === 'critical';
      case 'critical': return urgency === 'critical' || urgency === 'high';
      case 'warning': return urgency === 'medium' || urgency === 'low';
      case 'active': return urgency === 'none';
      default: return true;
    }
  });
}

/**
 * Group shaken records by month of expiry
 */
export function groupByExpiryMonth(records) {
  const groups = {};
  records.forEach(r => {
    const expiry = r.shaken_expiry || r.shakeng_expiry;
    if (!expiry) return;
    const month = expiry.slice(0, 7); // YYYY-MM
    if (!groups[month]) groups[month] = [];
    groups[month].push(r);
  });
  return groups;
}

/**
 * Generate Shaken quotation items for Work Order
 */
export function generateShakenQuotation(shakenRecord, vehicle) {
  const age = vehicle?.year ? new Date().getFullYear() - vehicle.year : 5;
  const costs = estimateShakenCost({
    vehicleWeight: vehicle?.weight || 1500,
    vehicleAge: age,
    fuelType: vehicle?.fuel_type,
  });

  return [
    { type: 'service', name: '車検代行手数料 (Shaken Agency Fee)', qty: 1, price: costs.agencyFee, total: costs.agencyFee },
    { type: 'service', name: '車検整備費用 (Shaken Maintenance)', qty: 1, price: costs.maintenanceCost, total: costs.maintenanceCost },
    { type: 'service', name: '重量税 (Weight Tax)', qty: 1, price: costs.weightTax, total: costs.weightTax },
    { type: 'service', name: '自賠責保険 (Jibaiseki Insurance)', qty: 1, price: costs.jibaiseki, total: costs.jibaiseki },
    { type: 'service', name: '検査手数料 (Inspection Fee)', qty: 1, price: costs.inspectionFee, total: costs.inspectionFee },
    { type: 'service', name: '印紙代 (Stamp Fee)', qty: 1, price: costs.stampFee, total: costs.stampFee },
  ];
}
