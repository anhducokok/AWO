import IngestPayload from '../models/IngetPayload.js';

/**
 * Get all ingest payloads with pagination and filters
 */
export async function getAllIngests(filters = {}) {
  const {
    page = 1,
    limit = 20,
    source,
    status,
    startDate,
    endDate
  } = filters;

  const query = {};

  if (source) {
    query.source = source;
  }

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.receivedAt = {};
    if (startDate) query.receivedAt.$gte = new Date(startDate);
    if (endDate) query.receivedAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [ingests, total] = await Promise.all([
    IngestPayload.find(query)
      .sort({ receivedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    IngestPayload.countDocuments(query)
  ]);

  return {
    data: ingests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get ingest by ID
 */
export async function getIngestById(ingestId) {
  return await IngestPayload.findById(ingestId).lean();
}

/**
 * Create new ingest payload
 */
export async function createIngest(ingestData) {
  const ingest = new IngestPayload(ingestData);
  await ingest.save();
  return ingest;
}

/**
 * Update ingest status
 */
export async function updateIngestStatus(ingestId, status, metadata = {}) {
  const updateData = {
    status,
    ...metadata
  };

  if (status === 'completed' || status === 'failed') {
    updateData.processedAt = new Date();
  }

  return await IngestPayload.findByIdAndUpdate(
    ingestId,
    updateData,
    { new: true }
  );
}

/**
 * Get pending ingests for processing
 */
export async function getPendingIngests(limit = 10) {
  return await IngestPayload.find({ status: 'pending' })
    .sort({ receivedAt: 1 })
    .limit(limit)
    .lean();
}

/**
 * Get ingests statistics
 */
export async function getIngestStats(startDate, endDate) {
  const matchQuery = {};
  
  if (startDate || endDate) {
    matchQuery.receivedAt = {};
    if (startDate) matchQuery.receivedAt.$gte = new Date(startDate);
    if (endDate) matchQuery.receivedAt.$lte = new Date(endDate);
  }

  const stats = await IngestPayload.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        bySource: {
          $push: "$source"
        },
        byStatus: {
          $push: "$status"
        },
        avgProcessingTime: {
          $avg: {
            $cond: [
              { $and: ["$processedAt", "$receivedAt"] },
              { $subtract: ["$processedAt", "$receivedAt"] },
              null
            ]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        avgProcessingTimeMs: "$avgProcessingTime",
        bySource: 1,
        byStatus: 1
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      bySource: {},
      byStatus: {},
      avgProcessingTimeMs: 0
    };
  }

  const result = stats[0];

  // Count occurrences
  result.bySource = result.bySource.reduce((acc, source) => {
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  result.byStatus = result.byStatus.reduce((acc, status) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return result;
}

/**
 * Delete old completed ingests (cleanup)
 */
export async function deleteOldIngests(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await IngestPayload.deleteMany({
    status: 'completed',
    processedAt: { $lt: cutoffDate }
  });

  return result.deletedCount;
}
