import express from "express";
import { ingestController, slackWebhookController, formWebhookController } from "../controllers/ingest.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
const router = express.Router();

/**
 * Main ingestion endpoint
 * POST /api/v1/ingest or /api/ingest
 * Accepts: email, webhook, manual
 * Requires authentication for manual entries
 */
router.post("/", ingestController);

/**
 * Webhook endpoints (no auth required - validated by webhook signatures)
 */
router.post("/webhooks/slack", slackWebhookController);
router.post("/webhooks/form", formWebhookController);

/**
 * Email forwarding endpoint
 * Can be used by email services like SendGrid, Mailgun
 */
router.post("/email", ingestController);

/**
 * Manual entry endpoint (requires authentication)
 */
router.post("/manual", authenticate, ingestController);

export default router;
