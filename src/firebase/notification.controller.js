import fcmService from "./fcm.service.js";
import Notification from "./notification.model.js";
import { JobSeeker } from "../models/jobSeeker/jobSeeker.model.js";
import { Recruiter } from "../models/recruiter/recruiter.model.js";
import ApiError from "../utils/ApiError.js";

/**
 * Register FCM Token
 * POST /api/notifications/register-token
 */
export const registerFCMToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;

        // Get user info from auth middleware
        const userId = req.user._id || req.user.id;
        const role = req.user.role;

        if (!fcmToken) {
            throw new ApiError(400, "FCM token is required");
        }

        // Add token to user's fcmTokens array
        let user;
        if (role === "job-seeker" || role === "Worker" || role === "JobSeeker") {
            user = await JobSeeker.findByIdAndUpdate(
                userId,
                { $addToSet: { fcmTokens: fcmToken } },
                { new: true }
            );
        } else if (role === "recruiter" || role === "Recruiter") {
            user = await Recruiter.findByIdAndUpdate(
                userId,
                { $addToSet: { fcmTokens: fcmToken } },
                { new: true }
            );
        } else {
            throw new ApiError(400, "Invalid user role for FCM token");
        }

        res.status(200).json({
            success: true,
            message: "FCM token registered successfully",
            data: { fcmTokens: user.fcmTokens },
            meta: null,
        });
    } catch (error) {
        console.error("❌ Error registering FCM token:", error.message);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to register FCM token",
            data: null,
            meta: null,
        });
    }
};

/**
 * Send Notification (Admin Only)
 * POST /api/notifications/send
 */
export const sendNotification = async (req, res) => {
    try {
        const {
            title,
            body,
            imageUrl,
            link,
            data,
            recipientType,
            recipients,
            topic,
            scheduledAt,
        } = req.body;

        // Validate required fields
        if (!title || !body) {
            throw new ApiError(400, "Title and body are required");
        }

        if (!recipientType) {
            throw new ApiError(400, "Recipient type is required");
        }

        // Create notification record
        const notification = new Notification({
            title,
            body,
            imageUrl,
            link,
            data: data ? new Map(Object.entries(data)) : new Map(),
            recipientType,
            recipients: recipients || [],
            topic,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            isScheduled: !!scheduledAt,
            status: scheduledAt ? "scheduled" : "sending",
            createdBy: req.user?.userId,
        });

        // If scheduled, save and return
        if (scheduledAt) {
            await notification.save();
            return res.status(200).json({
                success: true,
                message: "Notification scheduled successfully",
                data: notification,
                meta: null,
            });
        }

        // Send immediately based on recipient type
        let result;
        const notificationPayload = { title, body, imageUrl, data: data || {}, link };

        switch (recipientType) {
            case "all":
                result = await fcmService.sendToAll(notificationPayload);
                break;

            case "jobSeekers":
                result = await fcmService.sendToAllJobSeekers(notificationPayload);
                break;

            case "recruiters":
                result = await fcmService.sendToAllRecruiters(notificationPayload);
                break;

            case "specific":
                if (!recipients || recipients.length === 0) {
                    throw new ApiError(400, "Recipients are required for specific type");
                }
                result = await fcmService.sendToSpecificUsers(recipients, notificationPayload);
                break;

            case "topic":
                if (!topic) {
                    throw new ApiError(400, "Topic is required for topic type");
                }
                result = await fcmService.sendToTopic(topic, notificationPayload);
                break;

            default:
                throw new ApiError(400, "Invalid recipient type");
        }

        // Update notification status
        notification.status = result.success ? "sent" : "failed";
        notification.sentAt = new Date();
        notification.stats = {
            totalRecipients: result.successCount + result.failureCount || 1,
            sent: result.successCount || (result.success ? 1 : 0),
            failed: result.failureCount || (result.success ? 0 : 1),
        };
        notification.fcmResponse = {
            successCount: result.successCount,
            failureCount: result.failureCount,
            messageId: result.messageId,
            errors: result.failedTokens || [],
        };

        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification sent successfully",
            data: {
                notification,
                result,
            },
            meta: null,
        });
    } catch (error) {
        console.error("❌ Error sending notification:", error.message);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to send notification",
            data: null,
            meta: null,
        });
    }
};

/**
 * Send Notification to Specific User
 * POST /api/notifications/send-to-user
 */
export const sendToUser = async (req, res) => {
    try {
        const { userId, userType, title, body, imageUrl, link, data } = req.body;

        if (!userId || !userType || !title || !body) {
            throw new ApiError(400, "userId, userType, title, and body are required");
        }

        const result = await fcmService.sendToUser(userId, userType, {
            title,
            body,
            imageUrl,
            data: data || {},
            link,
        });

        // Create notification record
        const notification = new Notification({
            title,
            body,
            imageUrl,
            link,
            data: data ? new Map(Object.entries(data)) : new Map(),
            recipientType: "specific",
            recipients: [{ userId, userType, status: result.success ? "sent" : "failed" }],
            status: result.success ? "sent" : "failed",
            sentAt: new Date(),
            createdBy: req.user?.userId,
        });

        await notification.save();

        res.status(200).json({
            success: true,
            message: result.success ? "Notification sent" : "Failed to send notification",
            data: { notification, result },
            meta: null,
        });
    } catch (error) {
        console.error("❌ Error sending to user:", error.message);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to send notification",
            data: null,
            meta: null,
        });
    }
};

/**
 * Get Notification History
 * GET /api/notifications/history
 */
export const getNotificationHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, recipientType } = req.query;

        const query = {};
        if (status) query.status = status;
        if (recipientType) query.recipientType = recipientType;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate("createdBy", "name email");

        const total = await Notification.countDocuments(query);

        res.status(200).json({
            success: true,
            message: "Notification history retrieved",
            data: notifications,
            meta: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("❌ Error fetching notification history:", error.message);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch notification history",
            data: null,
            meta: null,
        });
    }
};

/**
 * Get Single Notification Details
 * GET /api/notifications/:id
 */
export const getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findById(id).populate("createdBy", "name email");

        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }

        res.status(200).json({
            success: true,
            message: "Notification retrieved",
            data: notification,
            meta: null,
        });
    } catch (error) {
        console.error("❌ Error fetching notification:", error.message);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch notification",
            data: null,
            meta: null,
        });
    }
};

/**
 * Delete Notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
            data: null,
            meta: null,
        });
    } catch (error) {
        console.error("❌ Error deleting notification:", error.message);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to delete notification",
            data: null,
            meta: null,
        });
    }
};

/**
 * Get FCM Token Stats
 * GET /api/notifications/token-stats
 */
export const getTokenStats = async (req, res) => {
    try {
        // Count job seekers with tokens
        const jobSeekerCount = await JobSeeker.countDocuments({
            fcmTokens: { $exists: true, $ne: [] }
        });

        // Count recruiters with tokens
        const recruiterCount = await Recruiter.countDocuments({
            fcmTokens: { $exists: true, $ne: [] }
        });

        // Count total tokens
        const jobSeekerTokens = await JobSeeker.aggregate([
            { $match: { fcmTokens: { $exists: true, $ne: [] } } },
            { $project: { tokenCount: { $size: "$fcmTokens" } } },
            { $group: { _id: null, total: { $sum: "$tokenCount" } } }
        ]);

        const recruiterTokens = await Recruiter.aggregate([
            { $match: { fcmTokens: { $exists: true, $ne: [] } } },
            { $project: { tokenCount: { $size: "$fcmTokens" } } },
            { $group: { _id: null, total: { $sum: "$tokenCount" } } }
        ]);

        const formattedStats = {
            total: (jobSeekerTokens[0]?.total || 0) + (recruiterTokens[0]?.total || 0),
            byUserType: {
                JobSeeker: jobSeekerTokens[0]?.total || 0,
                Recruiter: recruiterTokens[0]?.total || 0
            },
            usersWithTokens: {
                JobSeeker: jobSeekerCount,
                Recruiter: recruiterCount
            }
        };

        res.status(200).json({
            success: true,
            message: "Token stats retrieved",
            data: formattedStats,
            meta: null,
        });
    } catch (error) {
        console.error("❌ Error fetching token stats:", error.message);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch token stats",
            data: null,
            meta: null,
        });
    }
};

/**
 * Subscribe to Topic
 * POST /api/notifications/subscribe-topic
 */
export const subscribeToTopic = async (req, res) => {
    try {
        const { topic } = req.body;
        const userId = req.user._id || req.user.id;
        const role = req.user.role;

        if (!topic) {
            throw new ApiError(400, "Topic is required");
        }

        // Get user's tokens from their model
        let user;
        if (role === "job-seeker" || role === "Worker" || role === "JobSeeker") {
            user = await JobSeeker.findById(userId).select("fcmTokens");
        } else {
            user = await Recruiter.findById(userId).select("fcmTokens");
        }

        const fcmTokens = user?.fcmTokens || [];

        if (fcmTokens.length === 0) {
            throw new ApiError(404, "No active FCM tokens found");
        }

        const result = await fcmService.subscribeToTopic(fcmTokens, topic);

        res.status(200).json({
            success: true,
            message: `Subscribed to topic: ${topic}`,
            data: result,
            meta: null,
        });
    } catch (error) {
        console.error("❌ Error subscribing to topic:", error.message);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to subscribe to topic",
            data: null,
            meta: null,
        });
    }
};

/**
 * Unsubscribe from Topic
 * POST /api/notifications/unsubscribe-topic
 */
export const unsubscribeFromTopic = async (req, res) => {
    try {
        const { topic } = req.body;
        const userId = req.user._id || req.user.id;
        const role = req.user.role;

        if (!topic) {
            throw new ApiError(400, "Topic is required");
        }

        // Get user's tokens from their model
        let user;
        if (role === "job-seeker" || role === "Worker" || role === "JobSeeker") {
            user = await JobSeeker.findById(userId).select("fcmTokens");
        } else {
            user = await Recruiter.findById(userId).select("fcmTokens");
        }

        const fcmTokens = user?.fcmTokens || [];

        if (fcmTokens.length === 0) {
            throw new ApiError(404, "No active FCM tokens found");
        }

        const result = await fcmService.unsubscribeFromTopic(fcmTokens, topic);

        res.status(200).json({
            success: true,
            message: `Unsubscribed from topic: ${topic}`,
            data: result,
            meta: null,
        });
    } catch (error) {
        console.error("❌ Error unsubscribing from topic:", error.message);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to unsubscribe from topic",
            data: null,
            meta: null,
        });
    }
};

/**
 * Get User's Notifications
 * GET /api/notifications/my-notifications
 */
export const getMyNotifications = async (req, res) => {
    try {
        // Get user info from auth middleware
        const userId = req.user._id || req.user.id;
        const role = req.user.role;

        // Convert role to userType for query
        const userType = role === "job-seeker" || role === "Worker" ? "JobSeeker" : "Recruiter";

        const { page = 1, limit = 20 } = req.query;

        // Find notifications where user is a recipient or sent to their type
        const query = {
            $or: [
                { recipientType: "all" },
                { recipientType: userType === "JobSeeker" ? "jobSeekers" : "recruiters" },
                {
                    recipientType: "specific",
                    "recipients.userId": userId,
                    "recipients.userType": userType,
                },
            ],
            status: "sent",
        };

        const notifications = await Notification.find(query)
            .sort({ sentAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select("title body imageUrl link sentAt");

        const total = await Notification.countDocuments(query);

        res.status(200).json({
            success: true,
            message: "Notifications retrieved",
            data: notifications,
            meta: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("❌ Error fetching user notifications:", error.message);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch notifications",
            data: null,
            meta: null,
        });
    }
};
