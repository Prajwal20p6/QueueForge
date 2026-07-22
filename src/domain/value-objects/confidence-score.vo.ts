import { ValidationError } from '../errors/validation-error';

/**
 * Immutable Value Object representing normalized AI model prediction confidence score (0.0 to 1.0).
 */
export class ConfidenceScore {
  public readonly value: number;

  constructor(value: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new ValidationError(`Invalid confidence score: ${value}. Must be a valid number.`);
    }

    if (value < 0.0 || value > 1.0) {
      throw new ValidationError(`Invalid confidence score: ${value}. Must be between 0.0 and 1.0.`);
    }

    this.value = value;
    Object.freeze(this);
  }

  /**
   * Retrieves numerical confidence score value.
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * Compares value equality with another ConfidenceScore instance.
   */
  public equals(other: ConfidenceScore): boolean {
    if (!other || !(other instanceof ConfidenceScore)) {
      return false;
    }
    return Math.abs(this.value - other.value) < 1e-9;
  }

  /**
   * Serializes confidence score to string formatted to 4 decimal places.
   */
  public toString(): string {
    return this.value.toFixed(4);
  }

  public valueOf(): number {
    return this.value;
  }

  /**
   * Evaluates if confidence is high (>= 0.75, or custom threshold).
   */
  public isHigh(threshold = 0.75): boolean {
    return this.value >= threshold;
  }

  /**
   * Evaluates if confidence is low (< 0.35, or custom threshold).
   */
  public isLow(threshold = 0.35): boolean {
    return this.value < threshold;
  }

  /**
   * Evaluates if confidence score is medium (between low and high thresholds).
   */
  public isMedium(lowThreshold = 0.25, highThreshold = 0.75): boolean {
    return this.value >= lowThreshold && this.value < highThreshold;
  }

  /**
   * Static factory method for creating a ConfidenceScore instance.
   */
  public static create(value: number): ConfidenceScore {
    return new ConfidenceScore(value);
  }
}
