import express from "express";
import {
  ingestController,
  slackWebhookController,
  formWebhookController,
  listIngestsController,
  getIngestByIdController,
  approveIngestController,
  rejectIngestController,
} from "../controllers/ingest.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// ─── Ingest submission ────────────────────────────────────────────────────────
router.post("/", ingestController);
router.post("/email", ingestController);
router.post("/manual", authenticate, ingestController);

// ─── Webhook endpoints (no auth — validated by webhook signatures) ────────────
router.post("/webhooks/slack", slackWebhookController);
router.post("/webhooks/form", formWebhookController);

// ─── Manager review endpoints (auth required) ────────────────────────────────
router.get("/", authenticate, listIngestsController);
router.get("/:id", authenticate, getIngestByIdController);
router.post("/:id/approve", authenticate, approveIngestController);
router.post("/:id/reject", authenticate, rejectIngestController);

export default router;
