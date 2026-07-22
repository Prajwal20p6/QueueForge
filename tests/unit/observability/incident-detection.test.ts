import { IncidentDetector } from '../../../observability/incident-detection';
import { MockFactory } from '../../helpers/mocks';

describe('IncidentDetector Unit Tests', () => {
  it('should detect incident when error rate is high', async () => {
    const mockLogger = MockFactory.createMockLogger();
    const detector = new IncidentDetector(mockLogger);

    const incident = await detector.detect(6.0, 100);
    expect(incident).toBeDefined();
    expect(incident?.severity).toBe(1);
  });

  it('should return null when metrics are within healthy bounds', async () => {
    const mockLogger = MockFactory.createMockLogger();
    const detector = new IncidentDetector(mockLogger);

    const incident = await detector.detect(0.5, 200);
    expect(incident).toBeNull();
  });
});
