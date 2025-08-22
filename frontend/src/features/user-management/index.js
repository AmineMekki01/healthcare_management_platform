// User Management Feature - Comprehensive Exports

// Services
export { userService } from './services/userService';
export { followService } from './services/followService';
export * from './services';

// Hooks
export { useUserManagement } from './hooks/useUserManagement';
export { useFollow } from './hooks/useFollow';
export * from './hooks';

// Utils
export { userUtils } from './utils/userUtils';
export * from './utils';

// Components
export { default as UserProfile } from './components/UserProfile';
export { default as UserAvatar } from './components/shared/UserAvatar';
export { default as UserCard } from './components/shared/UserCard';
export { default as AppointmentBooking } from './components/AppointmentBooking';
export { default as AppointmentManager } from './components/AppointmentManager';

// Legacy exports for compatibility
export { default as userService } from './services/userService';
