import { AiTaskResult } from '@prisma/client';
import { IngestResultResponse } from '../../application/dto/ingestion.dto';
import { LineageResponse } from '../../application/dto/lineage.dto';

/**
 * Serializer class converting database result models and associated delivery records to API response DTOs.
 */
export class ResultSerializer {
  /**
   * Formats ingestion result response.
   */
  public serializeIngestionResponse(result: AiTaskResult, destinationCount: number): IngestResultResponse {
    return {
      resultId: result.id,
      status: 'accepted',
      queuedAt: result.createdAt,
      destinationCount,
    };
  }

  /**
   * Compiles classification results and delivery tracking logs to build the Lineage response DTO.
   */
  public serializeLineageResponse(results: any[], deliveries: any[]): LineageResponse {
    const emailId = results.length > 0 ? results[0].emailId : 'unknown';

    const agents = results.map((r) => ({
      agentId: r.agentId,
      agentVersion: r.agentVersion,
      resultPayload: r.resultPayload,
      confidenceScore: Number(r.confidenceScore),
      createdAt: r.createdAt,
    }));

    const mappedDeliveries = deliveries.map((d) => {
      const attemptsCount = d.attempts?.length || 0;
      const sortedAttempts = d.attempts
        ? [...d.attempts].sort(
            (a, b) => new Date(a.attemptedAt || a.createdAt).getTime() - new Date(b.attemptedAt || b.createdAt).getTime()
          )
        : [];
      const lastAttempt = sortedAttempts[sortedAttempts.length - 1];

      return {
        destinationId: d.destinationId,
        destinationType: d.destination?.destinationType || 'UNKNOWN',
        status: d.status,
        retryCount: d.retryCount,
        attempts: attemptsCount,
        lastAttemptAt: lastAttempt ? lastAttempt.attemptedAt || lastAttempt.createdAt : undefined,
        errorMessage: lastAttempt ? lastAttempt.errorMessage || undefined : undefined,
      };
    });

    const completedCount = deliveries.filter((d) => d.status === 'COMPLETED').length;
    const failedCount = deliveries.filter((d) => d.status === 'FAILED_DLQ').length;
    const pendingCount = deliveries.length - completedCount - failedCount;

    return {
      emailId,
      agents,
      deliveries: mappedDeliveries,
      summary: {
        totalAgents: agents.length,
        totalDestinations: deliveries.length,
        completedCount,
        failedCount,
        pendingCount,
      },
    };
  }
}
