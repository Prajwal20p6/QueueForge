import { IngestResultRequest, IngestResultResponse } from '../dto/ingestion.dto';
import { LineageResponse } from '../dto/lineage.dto';

/**
 * Service interface for AI result ingestion, validation, and lineage tracing.
 */
export interface IResultService {
  /**
   * Validates and ingests an AI classification task result, scheduling destination dispatches.
   */
  ingest(request: IngestResultRequest): Promise<IngestResultResponse>;

  /**
   * Validates the structure and property constraints of an incoming ingestion request.
   */
  validate(request: any): Promise<IngestResultRequest>;

  /**
   * Retrieves the processing lifecycle lineage trace for a specific email identifier.
   */
  getLineage(emailId: string): Promise<LineageResponse>;
}
