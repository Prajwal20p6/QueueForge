import { AnomalyDetector } from '../../../observability/anomaly-detection';
import { MockFactory } from '../../helpers/mocks';

describe('AnomalyDetector Unit Tests', () => {
  it('should detect anomaly when metric is above 3 standard deviations', () => {
    const mockLogger = MockFactory.createMockLogger();
    const detector = new AnomalyDetector(mockLogger);

    const anomaly = detector.detect('api_latency', 500, 100, 50); // z-score = 8.0
    expect(anomaly).toBeDefined();
    expect(anomaly?.zScore).toBe(8.0);
  });

  it('should return null when z-score is small', () => {
    const mockLogger = MockFactory.createMockLogger();
    const detector = new AnomalyDetector(mockLogger);

    const anomaly = detector.detect('api_latency', 120, 100, 50); // z-score = 0.4
    expect(anomaly).toBeNull();
  });
});
