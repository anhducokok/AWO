import mongoose from 'mongoose';

const IngestPayloadSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ["email", "webhook", "manual"],
    required: true,
    index: true
  },
  
  // Complete raw data from source
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Extracted/formatted text for AI processing
  rawText: {
    type: String,
    required: true
  },
  
  // Source-specific metadata
  sourceMeta: {
    // Email metadata
    emailFrom: { type: String },
    emailTo: { type: String },
    subject: { type: String },
    receivedDate: { type: Date },
    
    // Webhook metadata
    webhookType: { type: String }, // slack, form, etc.
    channelId: { type: String },
    userId: { type: String },
    
    // Manual entry metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userAgent: { type: String }
  },
  
  // File attachments
  attachments: [{
    filename: { type: String },
    url: { type: String },
    mimeType: { type: String },
    size: { type: Number }
  }],
  
  // Processing status
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
    index: true
  },
  
  // Error tracking
  errorMessage: {
    type: String
  },
  
  // Timestamps
  receivedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  processedAt: {
    type: Date
  },
  
  // Link to created ticket (after AI triage)
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for common queries
IngestPayloadSchema.index({ status: 1, receivedAt: -1 });
IngestPayloadSchema.index({ source: 1, status: 1 });

// Virtual for formatted display
IngestPayloadSchema.virtual('displayText').get(function() {
  if (this.source === 'email' && this.sourceMeta?.subject) {
    return `${this.sourceMeta.subject} - ${this.rawText.substring(0, 100)}...`;
  }
  return this.rawText.substring(0, 150) + '...';
});

const IngestPayload = mongoose.model('IngestPayload', IngestPayloadSchema);

export default IngestPayload;
