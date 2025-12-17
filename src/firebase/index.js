// Firebase FCM Integration - Main Index File
// Export all Firebase-related modules

// Configuration
export { default as firebaseApp, messaging, admin } from "./firebase.config.js";

// Models
export { default as Notification } from "./notification.model.js";

// Services
export { fcmService } from "./fcm.service.js";

// Routes
export { default as notificationRoutes } from "./notification.routes.js";

// Controllers (for direct use if needed)
export * from "./notification.controller.js";

