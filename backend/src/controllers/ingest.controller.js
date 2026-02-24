import { validateIngestInput, validateEmailPayload, validateWebhookPayload } from "../validators/ingest.validator.js";
import {
  processEmailIngest,
  processWebhookIngest,
  processManualIngest,
  approveIngest,
  rejectIngest,
  listIngests,
  getIngestById,
} from "../service/ingest.service.js";

/**
 * Main ingest endpoint - POST /api/v1/ingest
 * Accepts: Email forward, Webhook payload, Manual entry
 */
export async function ingestController(req, res) {
  const { source } = req.body;

  try {
    let result;

    // Route to specific handler based on source
    switch (source) {
      case 'email':
        const emailError = validateEmailPayload(req.body);
        if (emailError) {
          return res.status(400).json({
            success: false,
            error: "Invalid email payload",
            message: emailError
          });
        }
        result = await processEmailIngest(req.body);
        break;

      case 'webhook':
        const webhookError = validateWebhookPayload(req.body);
        if (webhookError) {
          return res.status(400).json({
            success: false,
            error: "Invalid webhook payload",
            message: webhookError
          });
        }
        result = await processWebhookIngest(req.body);
        break;

      case 'manual':
        const manualError = validateIngestInput(req.body);
        if (manualError) {
          return res.status(400).json({
            success: false,
            error: "Invalid manual payload",
            message: manualError
          });
        }
        result = await processManualIngest(req.body);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid source",
          message: "Source must be 'email', 'webhook', or 'manual'"
        });
    }

    // Reload result to get populated aiAnalysis
    const populated = await result.populate('reviewedBy', 'name email');

    return res.status(201).json({
      success: true,
      message: "Ingest received and AI analysis complete. Awaiting manager review.",
      data: {
        ingestId: populated._id,
        source: populated.source,
        status: populated.status,
        receivedAt: populated.receivedAt,
        processedAt: populated.processedAt,
        aiAnalysis: populated.aiAnalysis
          ? {
              title: populated.aiAnalysis.title,
              description: populated.aiAnalysis.description,
              priority: populated.aiAnalysis.priority,
              category: populated.aiAnalysis.category,
              confidenceScore: populated.aiAnalysis.confidenceScore,
              isFallback: populated.aiAnalysis.isFallback,
              suggestedAssignee: populated.aiAnalysis.suggestedAssignee,
            }
          : null,
      }
    });
  } catch (err) {
    console.error("❌ Error processing ingest:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred processing your request'
    });
  }
}

/**
 * GET /api/v1/ingest
 * List ingest payloads (manager only)
 */
export async function listIngestsController(req, res) {
  try {
    const { status, source, page = 1, limit = 20 } = req.query;
    const result = await listIngests({ status, source, page: +page, limit: +limit });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("❌ Error listing ingests:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/v1/ingest/:id
 * Get a single ingest payload
 */
export async function getIngestByIdController(req, res) {
  try {
    const ingest = await getIngestById(req.params.id);
    if (!ingest) {
      return res.status(404).json({ success: false, message: 'Ingest not found' });
    }
    return res.json({ success: true, data: ingest });
  } catch (err) {
    console.error("❌ Error fetching ingest:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/v1/ingest/:id/approve
 * Manager approves an ingest → creates the ticket
 * Body (all optional overrides): { title, description, priority, category, assignedTo, ... }
 */
export async function approveIngestController(req, res) {
  try {
    const { id } = req.params;
    const reviewerId = req.user._id;
    const overrides = req.body; // manager can override any AI-suggested field

    const { ingestPayload, ticket } = await approveIngest(id, reviewerId, overrides);

    return res.status(201).json({
      success: true,
      message: `Ingest approved. Ticket ${ticket.number} created.`,
      data: {
        ingestId: ingestPayload._id,
        status: ingestPayload.status,
        reviewedAt: ingestPayload.reviewedAt,
        ticket: {
          id: ticket._id,
          number: ticket.number,
          title: ticket.title,
          priority: ticket.priority,
          category: ticket.category,
          assignedTo: ticket.assignedTo,
        },
      },
    });
  } catch (err) {
    console.error("❌ Error approving ingest:", err);
    const status = err.message.includes('not pending review') ? 409 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/v1/ingest/:id/reject
 * Manager rejects an ingest
 * Body: { reason }
 */
export async function rejectIngestController(req, res) {
  try {
    const { id } = req.params;
    const reviewerId = req.user._id;
    const { reason = '' } = req.body;

    const ingestPayload = await rejectIngest(id, reviewerId, reason);

    return res.json({
      success: true,
      message: 'Ingest rejected.',
      data: {
        ingestId: ingestPayload._id,
        status: ingestPayload.status,
        rejectionReason: ingestPayload.rejectionReason,
        reviewedAt: ingestPayload.reviewedAt,
      },
    });
  } catch (err) {
    console.error("❌ Error rejecting ingest:", err);
    const status = err.message.includes('not pending review') ? 409 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
}

/**
 * Slack webhook endpoint - POST /api/v1/ingest/webhooks/slack
 */
export async function slackWebhookController(req, res) {
  // Slack URL verification challenge
  if (req.body.type === 'url_verification') {
    return res.status(200).json({ challenge: req.body.challenge });
  }

  const { event } = req.body;

  if (!event || event.type !== 'message' || event.subtype === 'bot_message') {
    return res.status(200).json({ ok: true }); // Acknowledge but don't process
  }

  try {
    const payload = {
      source: 'webhook',
      webhookType: 'slack',
      rawData: {
        channel: event.channel,
        user: event.user,
        text: event.text,
        ts: event.ts,
        team: req.body.team_id
      },
      rawText: event.text,
      sourceMeta: {
        channelId: event.channel,
        userId: event.user,
        timestamp: event.ts
      }
    };

    await processWebhookIngest(payload);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ Error processing Slack webhook:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

/**
 * Generic form webhook endpoint - POST /api/v1/ingest/webhooks/form
 */
export async function formWebhookController(req, res) {
  try {
    const payload = {
      source: 'webhook',
      webhookType: 'form',
      rawData: req.body,
      rawText: req.body.message || req.body.description || JSON.stringify(req.body),
      sourceMeta: {
        formId: req.body.formId,
        submittedBy: req.body.email || req.body.submittedBy
      }
    };

    const result = await processWebhookIngest(payload);

    return res.status(201).json({
      success: true,
      message: "Form submission received and processed",
      ingestId: result._id,
      ticketNumber: result.ticketId?.number
    });
  } catch (err) {
    console.error("❌ Error processing form webhook:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}
