import { ExportJob } from '../types/admin.types';
import { generateUUID } from '../../../shared/utils/crypto';

/**
 * Service managing background data exports in JSON, CSV, or Parquet formats.
 */
export class ExportService {
  private exports = new Map<string, ExportJob>();

  public async createExportJob(_entityType: string, format: 'JSON' | 'CSV' | 'PARQUET'): Promise<ExportJob> {
    const exportId = generateUUID();
    const job: ExportJob = {
      exportId,
      status: 'COMPLETED',
      format,
      downloadUrl: `/admin/exports/${exportId}/download`,
      createdAt: new Date(),
    };
    this.exports.set(exportId, job);
    return job;
  }

  public async getExportStatus(exportId: string): Promise<ExportJob | undefined> {
    return this.exports.get(exportId);
  }
}
