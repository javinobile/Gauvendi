export const PERMISSIONS = {
  // Dashboard
  DASHBOARD: 'dashboard',
  
  // Hotel Settings
  HOTEL_SETTINGS: 'settings.hotel',
  HOTEL_INFORMATION: 'settings.hotel.information',
  HOTEL_OPERATION: 'settings.hotel.operation',
  HOTEL_TAX_SETTING: 'settings.hotel.tax-setting',
  HOTEL_ROLLING_INVENTORY: 'settings.hotel.rolling-inventory',
  
  // User Management
  USER_SETTINGS: 'settings.user',
  USER_CREATE: 'settings.user.create',
  USER_EDIT: 'settings.user.edit',
  USER_DELETE: 'settings.user.delete',
  
  // Room Management
  ROOM_PRODUCTS: 'room-products',
  ROOM_INVENTORY: 'room-inventory',
  ROOM_FEATURES: 'room-features',
  
  // Reservations
  RESERVATIONS: 'reservations',
  RESERVATIONS_CREATE: 'reservations.create',
  RESERVATIONS_CANCEL: 'reservations.cancel',
  
  // Organization
  ORGANIZATION_MANAGE: 'organization.manage',
} as const;

// Usage in controllers:
// @RequirePermissions(PERMISSIONS.HOTEL_INFORMATION)