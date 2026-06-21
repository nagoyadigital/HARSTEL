/**
 * Local replacement for Base44 SDK client
 * Uses localStorage for data persistence
 */
import { createEntityApi } from './localDb'
import { localAuth } from './localAuth'

// Create entity APIs matching the names used throughout the app
const entities = {
  Booking: createEntityApi('Booking'),
  Customer: createEntityApi('Customer'),
  Mechanic: createEntityApi('Mechanic'),
  Notification: createEntityApi('Notification'),
  ReminderHistory: createEntityApi('ReminderHistory'),
  Shaken: createEntityApi('Shaken'),
  Sparepart: createEntityApi('Sparepart'),
  StockMovement: createEntityApi('StockMovement'),
  Transaction: createEntityApi('Transaction'),
  Vehicle: createEntityApi('Vehicle'),
  VehicleBrand: createEntityApi('VehicleBrand'),
  WorkOrder: createEntityApi('WorkOrder'),
}

export const base44 = {
  entities,
  auth: localAuth,
}
