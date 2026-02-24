import IngestPayload from '../models/IngetPayload.js';
import AI_TriangleService from '../modules/AI_Triagle/AI_Triangle.service.js';
import Ticket from '../models/tickets.model.js';
import User from '../models/users.model.js';
import Counter from '../models/counter.model.js';

// ─── Ingest entry points ────────────────────────────────────────────────────

export async function processEmailIngest(input) {
  const ingestPayload = new IngestPayload({
    source: 'email',
    rawData: {
      from: input.from,
      to: input.to,
      subject: input.subject,
      body: input.body,
      headers: input.headers || {},
      cc: input.cc || [],
      bcc: input.bcc || []
    },
    rawText: `Subject: ${input.subject}\n\n${input.body}`,
    sourceMeta: {
      emailFrom: input.from,
      emailTo: input.to,
      subject: input.subject,
      receivedDate: input.receivedDate || new Date()
    },
    attachments: input.attachments || [],
    status: 'pending',
    receivedAt: new Date()
  });

  await ingestPayload.save();
  console.log(`📧 Email ingest saved: ${ingestPayload._id}`);

  await processAITriage(ingestPayload);
  return ingestPayload;
}

export async function processWebhookIngest(input) {
  const ingestPayload = new IngestPayload({
    source: 'webhook',
    rawData: input.rawData || input,
    rawText: input.rawText || JSON.stringify(input.rawData || input),
    sourceMeta: {
      webhookType: input.webhookType || 'generic',
      ...input.sourceMeta
    },
    attachments: input.attachments || [],
    status: 'pending',
    receivedAt: new Date()
  });

  await ingestPayload.save();
  console.log(`🔗 Webhook ingest saved: ${ingestPayload._id}`);

  await processAITriage(ingestPayload);
  return ingestPayload;
}

export async function processManualIngest(input) {
  const ingestPayload = new IngestPayload({
    source: 'manual',
    rawData: {
      title: input.title,
      description: input.description || input.rawText,
      priority: input.priority,
      category: input.category,
      requestedBy: input.requestedBy
    },
    rawText: input.rawText || input.description,
    sourceMeta: {
      createdBy: input.createdBy,
      userAgent: input.userAgent
    },
    attachments: input.attachments || [],
    status: 'pending',
    receivedAt: new Date()
  });

  await ingestPayload.save();
  console.log(`✍️ Manual ingest saved: ${ingestPayload._id}`);

  await processAITriage(ingestPayload);
  return ingestPayload;
}

// ─── AI Triage — stores result, does NOT create ticket ──────────────────────

async function processAITriage(ingestPayload) {
  try {
    console.log(`🤖 Starting AI analysis for ingest: ${ingestPayload._id}`);

    ingestPayload.status = 'processing';
    await ingestPayload.save();

    // Step 1: Gemini AI analysis
    const aiResult = await AI_TriangleService.triageWithGemini(
      ingestPayload.rawText,
      {
        source: ingestPayload.source,
        from: ingestPayload.sourceMeta?.emailFrom || ingestPayload.sourceMeta?.submittedBy,
        subject: ingestPayload.sourceMeta?.subject
      }
    );

    if (!aiResult.success) {
      console.warn('⚠️ AI analysis failed, using fallback data');
    }

    // Step 2: Assignee suggestion
    const users = await User.find({ isActive: true, isDeleted: false }).lean();
    const assignmentSuggestion = await AI_TriangleService.suggestAssigneee(
      aiResult.data,
      users
    );

    // Step 3: Store AI result in the ingest — do NOT create a ticket yet
    ingestPayload.status = 'pending_review';
    ingestPayload.processedAt = new Date();
    ingestPayload.aiAnalysis = {
      title: aiResult.data.title,
      description: aiResult.data.description,
      summary: aiResult.data.summary || null,
      priority: aiResult.data.priority,
      category: aiResult.data.category,
      labels: aiResult.data.labels || [],
      estimatedEffort: aiResult.data.estimatedEffort || 0,
      complexity: aiResult.data.complexity || null,
      confidenceScore: aiResult.data.confidenceScore || 0,
      modelVersion: aiResult.data.modelVersion,
      suggestedAssignee: assignmentSuggestion.suggestedAssignee || null,
      alternatives: assignmentSuggestion.alternativeAssignees || [],
      isFallback: aiResult.data.isFallback || false,
      rawResponse: aiResult.data.rawResponse
    };
    await ingestPayload.save();

    console.log(`📋 Ingest ${ingestPayload._id} analysed → pending manager review`);
    return ingestPayload;

  } catch (error) {
    console.error(`❌ AI Triage failed for ingest ${ingestPayload._id}:`, error);
    ingestPayload.status = 'failed';
    ingestPayload.errorMessage = error.message;
    await ingestPayload.save();
    throw error;
  }
}

// ─── Manager approval — creates the ticket ──────────────────────────────────

export async function approveIngest(ingestId, reviewerId, overrides = {}) {
  const ingestPayload = await IngestPayload.findById(ingestId);

  if (!ingestPayload) {
    throw new Error(`Ingest not found: ${ingestId}`);
  }
  if (ingestPayload.status !== 'pending_review') {
    throw new Error(`Ingest is not pending review (current status: ${ingestPayload.status})`);
  }

  const ai = ingestPayload.aiAnalysis || {};

  // Allow manager to override any AI-suggested field
  const ticketNumber = await generateTicketNumber();
  const ticket = new Ticket({
    number: ticketNumber,
    title: overrides.title || ai.title,
    description: overrides.description || ai.description,
    summary: overrides.summary || ai.summary || null,
    priority: overrides.priority || ai.priority,
    status: 'open',
    category: overrides.category || ai.category,
    labels: overrides.labels || ai.labels || [],
    estimatedEffort: overrides.estimatedEffort ?? ai.estimatedEffort ?? 0,
    complexity: overrides.complexity || ai.complexity || null,
    assignedTo: overrides.assignedTo || ai.suggestedAssignee?.userId || null,

    aiAnalysis: {
      processed: true,
      confidenceScore: ai.confidenceScore || 0,
      modelVersion: ai.modelVersion,
      suggestedAssignee: ai.suggestedAssignee || null,
      alternatives: ai.alternatives || [],
      rawResponse: ai.rawResponse,
      isFallback: ai.isFallback || false
    },

    source: ingestPayload.source,
    sourceMeta: ingestPayload.rawData,
    ingestId: ingestPayload._id
  });

  await ticket.save();
  console.log(`✅ Ticket created: ${ticket.number}`);

  ingestPayload.status = 'approved';
  ingestPayload.ticketId = ticket._id;
  ingestPayload.reviewedBy = reviewerId;
  ingestPayload.reviewedAt = new Date();
  await ingestPayload.save();

  console.log(`✅ Ingest ${ingestPayload._id} approved → Ticket: ${ticket.number}`);
  return { ingestPayload, ticket };
}

// ─── Manager rejection ───────────────────────────────────────────────────────

export async function rejectIngest(ingestId, reviewerId, reason = '') {
  const ingestPayload = await IngestPayload.findById(ingestId);

  if (!ingestPayload) {
    throw new Error(`Ingest not found: ${ingestId}`);
  }
  if (ingestPayload.status !== 'pending_review') {
    throw new Error(`Ingest is not pending review (current status: ${ingestPayload.status})`);
  }

  ingestPayload.status = 'rejected';
  ingestPayload.reviewedBy = reviewerId;
  ingestPayload.reviewedAt = new Date();
  ingestPayload.rejectionReason = reason;
  await ingestPayload.save();

  console.log(`🚫 Ingest ${ingestPayload._id} rejected by ${reviewerId}`);
  return ingestPayload;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listIngests({ status, source, page = 1, limit = 20 } = {}) {
  const query = {};
  if (status) query.status = status;
  if (source) query.source = source;

  const [items, total] = await Promise.all([
    IngestPayload.find(query)
      .sort({ receivedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    IngestPayload.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getIngestById(ingestId) {
  return IngestPayload.findById(ingestId).populate('ticketId').populate('reviewedBy', 'name email');
}

export async function updateIngestStatus(ingestId, status, metadata = {}) {
  const ingest = await IngestPayload.findById(ingestId);
  if (!ingest) throw new Error(`Ingest payload not found: ${ingestId}`);

  ingest.status = status;
  if (status === 'approved') ingest.processedAt = new Date();
  if (status === 'failed' && metadata.error) ingest.errorMessage = metadata.error;
  if (metadata.ticketId) ingest.ticketId = metadata.ticketId;

  await ingest.save();
  return ingest;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateTicketNumber() {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'ticketNumber' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `TICKET-${String(counter.seq).padStart(6, '0')}`;
}