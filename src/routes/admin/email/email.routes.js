import { Router } from "express";
import {
    getRecipientCount,
    previewEmail,
    sendBulkEmail,
    getCampaigns,
    getCampaignById,
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    getTemplateCategories,
} from "../../../controllers/admin/email/email.controller.js";
import { verifyJWT } from "../../../middlewares/authMiddleware.js";

const router = Router();

// Protect all routes with admin authentication
router.use(verifyJWT());

// ==================== SENDING ====================

/**
 * @route   GET /api/admin/email/recipients
 * @desc    Get recipient count based on filters (preview before sending)
 * @access  Admin
 * @query   recipientType, category, status, state, city
 */
router.get("/recipients", getRecipientCount);

/**
 * @route   POST /api/admin/email/preview
 * @desc    Preview email before sending
 * @access  Admin
 * @body    subject, content, templateId
 */
router.post("/preview", previewEmail);

/**
 * @route   POST /api/admin/email/send
 * @desc    Send bulk email to recipients
 * @access  Admin
 * @body    name, subject, content, templateId, recipientType, filters, scheduledAt
 */
router.post("/send", sendBulkEmail);

// ==================== CAMPAIGNS (HISTORY) ====================

/**
 * @route   GET /api/admin/email/campaigns
 * @desc    Get all email campaigns (history)
 * @access  Admin
 * @query   page, limit
 */
router.get("/campaigns", getCampaigns);

/**
 * @route   GET /api/admin/email/campaigns/:id
 * @desc    Get campaign details by ID
 * @access  Admin
 */
router.get("/campaigns/:id", getCampaignById);

// ==================== TEMPLATES ====================

/**
 * @route   GET /api/admin/email/templates/categories
 * @desc    Get template categories for dropdown
 * @access  Admin
 */
router.get("/templates/categories", getTemplateCategories);

/**
 * @route   GET /api/admin/email/templates
 * @desc    Get all email templates
 * @access  Admin
 * @query   category, targetAudience, isActive
 */
router.get("/templates", getTemplates);

/**
 * @route   POST /api/admin/email/templates
 * @desc    Create new email template
 * @access  Admin
 * @body    name, category, subject, preheader, content, targetAudience
 */
router.post("/templates", createTemplate);

/**
 * @route   GET /api/admin/email/templates/:id
 * @desc    Get template by ID
 * @access  Admin
 */
router.get("/templates/:id", getTemplateById);

/**
 * @route   PUT /api/admin/email/templates/:id
 * @desc    Update template
 * @access  Admin
 */
router.put("/templates/:id", updateTemplate);

/**
 * @route   DELETE /api/admin/email/templates/:id
 * @desc    Delete template
 * @access  Admin
 */
router.delete("/templates/:id", deleteTemplate);

export default router;
