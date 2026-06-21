/**
 * Date formatting utilities for Japanese standard (YYYY/MM/DD)
 */
import { format as fnsFormat } from 'date-fns';

/**
 * Format date to Japanese standard YYYY/MM/DD
 */
export function formatDateJP(date) {
  if (!date) return '-';
  try {
    return fnsFormat(new Date(date), 'yyyy/MM/dd');
  } catch {
    return '-';
  }
}

/**
 * Format date with time YYYY/MM/DD HH:mm
 */
export function formatDateTimeJP(date) {
  if (!date) return '-';
  try {
    return fnsFormat(new Date(date), 'yyyy/MM/dd HH:mm');
  } catch {
    return '-';
  }
}

/**
 * Format date for display (shorter) YYYY/MM/DD
 */
export function formatDateShort(date) {
  if (!date) return '-';
  try {
    return fnsFormat(new Date(date), 'yyyy/MM/dd');
  } catch {
    return '-';
  }
}

/**
 * Format to Japanese long format (e.g., 2024年6月18日)
 */
export function formatDateLongJP(date) {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return '-';
  }
}
