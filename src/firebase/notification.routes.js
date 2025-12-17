import express from "express";
import {
    registerFCMToken,
    sendNotification,
    sendToUser,
    getNotificationHistory,
    getNotificationById,
    deleteNotification,
    getTokenStats,
    subscribeToTopic,
    unsubscribeFromTopic,
    getMyNotifications,
} from "./notification.controller.js";
import { verifyNotificationAuth } from "./notification.middleware.js";

const router = express.Router();

// ==================== User Routes (Authenticated) ====================

/**
 * @route   POST /api/notifications/register-token
 * @desc    Register FCM token for push notifications
 * @access  Private (JobSeeker/Recruiter)
 */
router.post("/register-token", verifyNotificationAuth, registerFCMToken);

/**
 * @route   POST /api/notifications/subscribe-topic
 * @desc    Subscribe to a notification topic
 * @access  Private (JobSeeker/Recruiter)
 */
router.post("/subscribe-topic", subscribeToTopic);

/**
 * @route   POST /api/notifications/unsubscribe-topic
 * @desc    Unsubscribe from a notification topic
 * @access  Private (JobSeeker/Recruiter)
 */
router.post("/unsubscribe-topic", unsubscribeFromTopic);

/**
 * @route   GET /api/notifications/my-notifications
 * @desc    Get user's notifications
 * @access  Private (JobSeeker/Recruiter)
 */
router.get("/my-notifications", verifyNotificationAuth, getMyNotifications);

// ==================== Admin Routes ====================

/**
 * @route   POST /api/notifications/send
 * @desc    Send notification (to all, jobSeekers, recruiters, specific users, or topic)
 * @access  Private (Admin only)
 */
router.post("/send", sendNotification);

/**
 * @route   POST /api/notifications/send-to-user
 * @desc    Send notification to a specific user
 * @access  Private (Admin only)
 */
router.post("/send-to-user", sendToUser);

/**
 * @route   GET /api/notifications/history
 * @desc    Get notification history
 * @access  Private (Admin only)
 */
router.get("/history", getNotificationHistory);

/**
 * @route   GET /api/notifications/token-stats
 * @desc    Get FCM token statistics
 * @access  Private (Admin only)
 */
router.get("/token-stats", getTokenStats);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get single notification details
 * @access  Private (Admin only)
 */
router.get("/:id", getNotificationById);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private (Admin only)
 */
router.delete("/:id", deleteNotification);

export default router;
