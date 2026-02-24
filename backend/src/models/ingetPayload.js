import mongoose from 'mongoose';

const ingestPayloadSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['email', 'webhook', 'manual'],
    required: true,
    index: true
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  rawText: {
    type: String,
    required: true
  },
  sourceMeta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimeType: String
  }],
  status: {
    type: String,
    // pending        → just saved, AI not yet run
    // processing     → AI triage in progress
    // pending_review → AI done, waiting for manager approval
    // approved       → manager approved, ticket created
    // rejected       → manager rejected
    // failed         → AI triage crashed
    enum: ['pending', 'processing', 'pending_review', 'approved', 'rejected', 'failed'],
    default: 'pending',
    index: true
  },
  errorMessage: String,
  receivedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: Date,

  // AI analysis result — stored here until manager approves
  aiAnalysis: {
    title: String,
    description: String,
    summary: String,
    priority: String,
    category: String,
    labels: [String],
    estimatedEffort: Number,
    complexity: String,
    confidenceScore: Number,
    modelVersion: String,
    suggestedAssignee: {
      userId: mongoose.Schema.Types.ObjectId,
      userName: String,
      userEmail: String,
      score: Number,
      reasoning: String
    },
    alternatives: [{
      userId: mongoose.Schema.Types.ObjectId,
      userName: String,
      userEmail: String,
      score: Number,
      reasoning: String
    }],
    isFallback: { type: Boolean, default: false },
    rawResponse: mongoose.Schema.Types.Mixed
  },

  // Review metadata
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  rejectionReason: String,

  // Link to created ticket (set after approval)
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }
}, { timestamps: true });

// Index for common queries
ingestPayloadSchema.index({ status: 1, receivedAt: -1 });

export default mongoose.model('IngestPayload', ingestPayloadSchema);
