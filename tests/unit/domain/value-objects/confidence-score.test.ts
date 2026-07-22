import { ConfidenceScore } from '../../../../src/domain/value-objects/confidence-score';
import { ValidationError } from '../../../../src/domain/errors/validation-error';

describe('ConfidenceScore Value Object Unit Tests', () => {
  it('should successfully create a valid ConfidenceScore', () => {
    const score = ConfidenceScore.create(0.85);
    expect(score.getValue()).toBe(0.85);
    expect(score.toString()).toBe('0.8500');
  });

  it('should throw ValidationError on out-of-bounds scores', () => {
    expect(() => ConfidenceScore.create(-0.01)).toThrow(ValidationError);
    expect(() => ConfidenceScore.create(1.01)).toThrow(ValidationError);
  });

  it('should evaluate high and low thresholds correctly using defaults', () => {
    // Defaults: High >= 0.75, Low < 0.25
    const scoreHigh = ConfidenceScore.create(0.75);
    expect(scoreHigh.isHigh()).toBe(true);
    expect(scoreHigh.isLow()).toBe(false);

    const scoreMedium = ConfidenceScore.create(0.5);
    expect(scoreMedium.isHigh()).toBe(false);
    expect(scoreMedium.isLow()).toBe(false);

    const scoreLow = ConfidenceScore.create(0.24);
    expect(scoreLow.isHigh()).toBe(false);
    expect(scoreLow.isLow()).toBe(true);
  });

  it('should evaluate thresholds using custom values', () => {
    const score = ConfidenceScore.create(0.6);
    expect(score.isHigh(0.55)).toBe(true);
    expect(score.isLow(0.65)).toBe(true);
  });

  it('should evaluate value equality correctly', () => {
    const score1 = ConfidenceScore.create(0.5);
    const score2 = ConfidenceScore.create(0.5);
    const score3 = ConfidenceScore.create(0.51);

    expect(score1.equals(score2)).toBe(true);
    expect(score1.equals(score3)).toBe(false);
  });
});
