import { SLIValidator } from '../../../observability/sli-validator';
import { SLIDefinitions } from '../../../observability/sli-definitions';
import { MockFactory } from '../../helpers/mocks';

describe('SLIValidator Unit Tests', () => {
  it('should validate all registered SLIs successfully', async () => {
    const mockMetrics = MockFactory.createMockMetricsRegistry();
    const mockLogger = MockFactory.createMockLogger();

    const validator = new SLIValidator(SLIDefinitions, mockMetrics, mockLogger);
    const valid = await validator.validate();

    expect(valid).toBe(true);
  });
});
