import { messaging } from "./firebase.config.js";
import Notification from "./notification.model.js";
import { JobSeeker } from "../models/jobSeeker/jobSeeker.model.js";
import { Recruiter } from "../models/recruiter/recruiter.model.js";

/**
 * Firebase Cloud Messaging Service
 * Handles all FCM push notification operations
 * Now queries fcmTokens array from user models
 */
class FCMService {
    /**
     * Send notification to a single device
     */
    async sendToDevice(fcmToken, { title, body, imageUrl, data = {}, link }) {
        try {
            const message = {
                token: fcmToken,
                notification: {
                    title,
                    body,
                    ...(imageUrl && { imageUrl }),
                },
                data: {
                    ...data,
                    ...(link && { link }),
                    click_action: "FLUTTER_NOTIFICATION_CLICK",
                },
                android: {
                    priority: "high",
                    notification: {
                        channelId: "shramik_notifications",
                        sound: "default",
                        priority: "high",
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: "default",
                            badge: 1,
                        },
                    },
                },
            };

            const response = await messaging.send(message);
            console.log("✅ Notification sent successfully:", response);

            return { success: true, messageId: response };
        } catch (error) {
            console.error("❌ Error sending notification:", error.message);

            // Handle invalid token - remove from user's array
            if (error.code === "messaging/registration-token-not-registered") {
                await this.removeInvalidToken(fcmToken);
            }

            throw error;
        }
    }

    /**
     * Remove invalid token from all users
     */
    async removeInvalidToken(fcmToken) {
        try {
            await JobSeeker.updateMany(
                { fcmTokens: fcmToken },
                { $pull: { fcmTokens: fcmToken } }
            );
            await Recruiter.updateMany(
                { fcmTokens: fcmToken },
                { $pull: { fcmTokens: fcmToken } }
            );
            console.log("🗑️ Removed invalid token:", fcmToken);
        } catch (error) {
            console.error("❌ Error removing invalid token:", error.message);
        }
    }

    /**
     * Send notification to multiple devices
     */
    async sendToMultipleDevices(fcmTokens, { title, body, imageUrl, data = {}, link }) {
        if (!fcmTokens || fcmTokens.length === 0) {
            return { success: false, message: "No tokens provided" };
        }

        try {
            const message = {
                notification: {
                    title,
                    body,
                    ...(imageUrl && { imageUrl }),
                },
                data: {
                    ...data,
                    ...(link && { link }),
                    click_action: "FLUTTER_NOTIFICATION_CLICK",
                },
                android: {
                    priority: "high",
                    notification: {
                        channelId: "shramik_notifications",
                        sound: "default",
                        priority: "high",
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: "default",
                            badge: 1,
                        },
                    },
                },
            };

            const response = await messaging.sendEachForMulticast({
                tokens: fcmTokens,
                ...message,
            });

            console.log(`✅ Notifications sent: ${response.successCount} success, ${response.failureCount} failed`);

            // Handle failed tokens
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push({
                        token: fcmTokens[idx],
                        error: resp.error?.message || "Unknown error",
                    });

                    // Remove invalid tokens
                    if (resp.error?.code === "messaging/registration-token-not-registered") {
                        this.removeInvalidToken(fcmTokens[idx]);
                    }
                }
            });

            return {
                success: true,
                successCount: response.successCount,
                failureCount: response.failureCount,
                failedTokens,
            };
        } catch (error) {
            console.error("❌ Error sending to multiple devices:", error.message);
            throw error;
        }
    }

    /**
     * Send notification to a topic
     */
    async sendToTopic(topic, { title, body, imageUrl, data = {}, link }) {
        try {
            const message = {
                topic,
                notification: {
                    title,
                    body,
                    ...(imageUrl && { imageUrl }),
                },
                data: {
                    ...data,
                    ...(link && { link }),
                    click_action: "FLUTTER_NOTIFICATION_CLICK",
                },
                android: {
                    priority: "high",
                },
                apns: {
                    payload: {
                        aps: {
                            sound: "default",
                        },
                    },
                },
            };

            const response = await messaging.send(message);
            console.log("✅ Topic notification sent:", response);

            return { success: true, messageId: response };
        } catch (error) {
            console.error("❌ Error sending to topic:", error.message);
            throw error;
        }
    }

    /**
     * Subscribe tokens to a topic
     */
    async subscribeToTopic(fcmTokens, topic) {
        try {
            const response = await messaging.subscribeToTopic(fcmTokens, topic);
            console.log(`✅ Subscribed to topic "${topic}":`, response.successCount, "success");

            return {
                success: true,
                successCount: response.successCount,
                failureCount: response.failureCount,
            };
        } catch (error) {
            console.error("❌ Error subscribing to topic:", error.message);
            throw error;
        }
    }

    /**
     * Unsubscribe tokens from a topic
     */
    async unsubscribeFromTopic(fcmTokens, topic) {
        try {
            const response = await messaging.unsubscribeFromTopic(fcmTokens, topic);
            console.log(`✅ Unsubscribed from topic "${topic}":`, response.successCount, "success");

            return {
                success: true,
                successCount: response.successCount,
                failureCount: response.failureCount,
            };
        } catch (error) {
            console.error("❌ Error unsubscribing from topic:", error.message);
            throw error;
        }
    }

    /**
     * Send notification to all job seekers
     */
    async sendToAllJobSeekers({ title, body, imageUrl, data, link }) {
        const jobSeekers = await JobSeeker.find({
            fcmTokens: { $exists: true, $ne: [] },
        }).select("fcmTokens");

        const fcmTokens = jobSeekers.flatMap((js) => js.fcmTokens);

        if (fcmTokens.length === 0) {
            return { success: false, message: "No job seeker tokens found" };
        }

        return this.sendToMultipleDevices(fcmTokens, { title, body, imageUrl, data, link });
    }

    /**
     * Send notification to all recruiters
     */
    async sendToAllRecruiters({ title, body, imageUrl, data, link }) {
        const recruiters = await Recruiter.find({
            fcmTokens: { $exists: true, $ne: [] },
        }).select("fcmTokens");

        const fcmTokens = recruiters.flatMap((r) => r.fcmTokens);

        if (fcmTokens.length === 0) {
            return { success: false, message: "No recruiter tokens found" };
        }

        return this.sendToMultipleDevices(fcmTokens, { title, body, imageUrl, data, link });
    }

    /**
     * Send notification to all users
     */
    async sendToAll({ title, body, imageUrl, data, link }) {
        const jobSeekers = await JobSeeker.find({
            fcmTokens: { $exists: true, $ne: [] },
        }).select("fcmTokens");

        const recruiters = await Recruiter.find({
            fcmTokens: { $exists: true, $ne: [] },
        }).select("fcmTokens");

        const fcmTokens = [
            ...jobSeekers.flatMap((js) => js.fcmTokens),
            ...recruiters.flatMap((r) => r.fcmTokens),
        ];

        if (fcmTokens.length === 0) {
            return { success: false, message: "No tokens found" };
        }

        return this.sendToMultipleDevices(fcmTokens, { title, body, imageUrl, data, link });
    }

    /**
     * Send notification to specific users
     */
    async sendToSpecificUsers(recipients, { title, body, imageUrl, data, link }) {
        const fcmTokens = [];

        for (const r of recipients) {
            let user;
            if (r.userType === "JobSeeker") {
                user = await JobSeeker.findById(r.userId).select("fcmTokens");
            } else if (r.userType === "Recruiter") {
                user = await Recruiter.findById(r.userId).select("fcmTokens");
            }
            if (user && user.fcmTokens) {
                fcmTokens.push(...user.fcmTokens);
            }
        }

        if (fcmTokens.length === 0) {
            return { success: false, message: "No tokens found for specified users" };
        }

        return this.sendToMultipleDevices(fcmTokens, { title, body, imageUrl, data, link });
    }

    /**
     * Send notification to a single user (all their devices)
     */
    async sendToUser(userId, userType, { title, body, imageUrl, data, link }) {
        let user;
        if (userType === "JobSeeker") {
            user = await JobSeeker.findById(userId).select("fcmTokens");
        } else if (userType === "Recruiter") {
            user = await Recruiter.findById(userId).select("fcmTokens");
        }

        if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
            return { success: false, message: "No tokens found for user" };
        }

        return this.sendToMultipleDevices(user.fcmTokens, { title, body, imageUrl, data, link });
    }
}

// Export singleton instance
export const fcmService = new FCMService();
export default fcmService;

