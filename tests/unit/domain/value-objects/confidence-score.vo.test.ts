import { ConfidenceScore } from '../../../../src/domain/value-objects/confidence-score.vo';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('ConfidenceScore Value Object Unit Tests', () => {
  it('should create valid ConfidenceScore instances and evaluate threshold classifiers', () => {
    const high = ConfidenceScore.create(0.95);
    expect(high.getValue()).toBe(0.95);
    expect(high.isHigh()).toBe(true);
    expect(high.isMedium()).toBe(false);
    expect(high.isLow()).toBe(false);

    const med = ConfidenceScore.create(0.65);
    expect(med.isHigh()).toBe(false);
    expect(med.isMedium()).toBe(true);
    expect(med.isLow()).toBe(false);

    const low = ConfidenceScore.create(0.3);
    expect(low.isLow()).toBe(true);
  });

  it('should throw ValidationError if score is outside 0.0 to 1.0 range', () => {
    expect(() => ConfidenceScore.create(-0.1)).toThrow(ValidationError);
    expect(() => ConfidenceScore.create(1.05)).toThrow(ValidationError);
    expect(() => new ConfidenceScore(NaN)).toThrow(ValidationError);
  });
});
