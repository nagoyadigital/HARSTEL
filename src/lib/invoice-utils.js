/**
 * Invoice Utilities for Japanese Workshop Standard
 * Tax handling, number generation, and settings
 */
import { format } from 'date-fns';

const INVOICE_SETTINGS_KEY = 'harstel_invoice_settings';

// Company Info
export const COMPANY_INFO = {
  name: 'HARSTEL WORKSHOP',
  postal: '〒447-0082',
  address: '2 Chome-83 Koseimachi, Hekinan, Aichi, Japan',
  tel: '090-6357-9803',
  fax: '0566-57-6225',
};

// Default invoice settings
const DEFAULT_SETTINGS = {
  customer: {
    showFinalPrice: true,
    hideTaxDetail: true,
    hideTaxInfo: true,
    hideTaxPercentage: true,
  },
  internal: {
    showTax: true,
    showBasePrice: true,
    showFinalPrice: true,
  },
  taxRate: 0.10, // 10% consumption tax
};

export function getInvoiceSettings() {
  try {
    const stored = localStorage.getItem(INVOICE_SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* use default */ }
  return DEFAULT_SETTINGS;
}

export function saveInvoiceSettings(settings) {
  localStorage.setItem(INVOICE_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Generate invoice number: INV-YYYYMMDD-XXXX
 */
export function generateInvoiceNumber() {
  const date = format(new Date(), 'yyyyMMdd');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `INV-${date}-${seq}`;
}

/**
 * Calculate invoice totals (tax stored internally)
 */
export function calculateInvoiceTotals(items, taxRate = 0.10) {
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const tax = Math.round(subtotal * taxRate);
  const grandTotal = subtotal + tax;

  return {
    subtotal,
    tax,
    taxRate,
    grandTotal,
    // For customer invoice: show grandTotal as the "final price" without tax breakdown
    customerTotal: grandTotal,
  };
}
