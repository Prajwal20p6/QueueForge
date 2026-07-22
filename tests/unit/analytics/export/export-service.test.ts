import { ExportService } from '../../../../src/analytics/export/export-service';
import { MockFactory } from '../../../helpers/mocks';

describe('ExportService Unit Tests', () => {
  let service: ExportService;

  beforeAll(() => {
    const logger = MockFactory.createMockLogger();
    service = new ExportService(logger);
  });

  it('should generate JSON export buffers correctly', async () => {
    const result = await service.exportDeliveries({}, 'json');
    expect(result.rowCount).toBe(2);

    const json = JSON.parse(result.buffer!.toString());
    expect(json.length).toBe(2);
    expect(json[0].id).toBe('del-1');
  });

  it('should generate CSV export buffers correctly', async () => {
    const result = await service.exportDeliveries({}, 'csv');
    expect(result.rowCount).toBe(2);

    const csvLines = result.buffer!.toString().split('\n');
    expect(csvLines[0]).toBe('id,status,timestamp');
    expect(csvLines[1]).toContain('del-1');
  });
});
