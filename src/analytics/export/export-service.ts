import { ExportFilters, ExportResult } from '../types';
import { Logger } from '../../observability/logging/logger';
import { JsonFormatter, CsvFormatter } from './export-formats';

/**
 * Service class performing data extraction export tasks.
 */
export class ExportService {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Generates formatted file buffer based on filter constraints.
   */
  public async exportDeliveries(filters: ExportFilters, format: 'json' | 'csv'): Promise<ExportResult> {
    this.logger.info(`[ExportService] Initiating deliveries export. Format: ${format}`);

    // Mock extraction row records matching filter parameters
    const mockRows = [
      { id: 'del-1', status: filters.status || 'SUCCESS', timestamp: new Date().toISOString() },
      { id: 'del-2', status: filters.status || 'SUCCESS', timestamp: new Date().toISOString() },
    ];

    const formatter = format === 'csv' ? new CsvFormatter() : new JsonFormatter();
    const buffer = await formatter.format(mockRows);

    return {
      rowCount: mockRows.length,
      buffer,
    };
  }
}
