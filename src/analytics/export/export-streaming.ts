import { ExportFilters } from '../types';
import { ExportFormatter } from './export-formats';
import { Readable } from 'stream';

/**
 * Stream evaluator compiling large data exports incrementally.
 */
export class StreamingExporter {
  /**
   * Generates readable streams yielding batches of formatted records blocks.
   */
  public streamDeliveries(filters: ExportFilters, formatter: ExportFormatter): Readable {
    const mockRows = [
      { id: 'del-1', status: filters.status || 'SUCCESS' },
      { id: 'del-2', status: filters.status || 'SUCCESS' },
    ];

    return new Readable({
      async read() {
        if (mockRows.length === 0) {
          this.push(null); // End of stream
          return;
        }
        const batch = mockRows.splice(0, 1);
        const chunk = await formatter.format(batch);
        this.push(chunk);
      },
    });
  }
}
