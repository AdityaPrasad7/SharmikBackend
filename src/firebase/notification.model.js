import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Notification Schema
 * Stores notification records for push notifications and in-app notifications
 */
const notificationSchema = new Schema(
    {
        // Notification content
        title: {
            type: String,
            required: true,
            trim: true,
        },
        body: {
            type: String,
            required: true,
            trim: true,
        },
        // Optional image URL for rich notifications
        imageUrl: {
            type: String,
            default: "",
        },
        // Deep link or URL for click action
        link: {
            type: String,
            default: "",
        },
        // Notification data payload (for app handling)
        data: {
            type: Map,
            of: String,
            default: {},
        },

        // Recipient targeting
        recipientType: {
            type: String,
            enum: ["all", "jobSeekers", "recruiters", "specific", "topic"],
            required: true,
            default: "all",
        },
        // Specific user IDs (when recipientType is "specific")
        recipients: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    required: true,
                },
                userType: {
                    type: String,
                    enum: ["JobSeeker", "Recruiter", "Admin"],
                    required: true,
                },
                // Delivery status for this recipient
                status: {
                    type: String,
                    enum: ["pending", "sent", "delivered", "failed", "read"],
                    default: "pending",
                },
                sentAt: Date,
                readAt: Date,
                errorMessage: String,
            },
        ],
        // FCM topic (when recipientType is "topic")
        topic: {
            type: String,
            trim: true,
        },

        // Scheduling
        scheduledAt: {
            type: Date,
            default: null,
        },
        isScheduled: {
            type: Boolean,
            default: false,
        },

        // Delivery Status
        status: {
            type: String,
            enum: ["draft", "scheduled", "sending", "sent", "failed", "cancelled"],
            default: "draft",
        },
        sentAt: {
            type: Date,
        },

        // Statistics
        stats: {
            totalRecipients: { type: Number, default: 0 },
            sent: { type: Number, default: 0 },
            delivered: { type: Number, default: 0 },
            failed: { type: Number, default: 0 },
            read: { type: Number, default: 0 },
        },

        // FCM response
        fcmResponse: {
            successCount: Number,
            failureCount: Number,
            messageId: String,
            errors: [
                {
                    tokenIndex: Number,
                    error: String,
                },
            ],
        },

        // Created by admin
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        // Flag to identify notifications sent from admin panel
        isAdminSent: {
            type: Boolean,
            default: false,
        },
        // Track users who have deleted/dismissed this notification (for broadcast messages)
        deletedBy: [{
            userId: {
                type: Schema.Types.ObjectId,
                required: true,
            },
            userType: {
                type: String,
                enum: ["JobSeeker", "Recruiter"],
                required: true,
            },
            deletedAt: {
                type: Date,
                default: Date.now,
            },
        }],
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
notificationSchema.index({ status: 1 });
notificationSchema.index({ recipientType: 1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ "recipients.userId": 1, "recipients.userType": 1 });

const Notification =
    mongoose.models.Notification || model("Notification", notificationSchema);

export default Notification;
