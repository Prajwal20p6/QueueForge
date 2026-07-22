import { ValidationError } from '../../shared/errors/validation-error';

export interface JobData {
  deliveryId: string;
  payload: any;
  attempts?: number;
  [key: string]: any;
}

/**
 * Handles job data validation, nested date conversions, and format schemas.
 */
export class JobSerializer {
  /**
   * Serializes a JobData object, converting Date objects to ISO strings.
   */
  public static serialize(jobData: JobData): Record<string, any> {
    const copy = this.deepCloneAndConvertDates(jobData);
    return copy;
  }

  /**
   * Deserializes a record back to JobData, converting date-like ISO strings to Date objects where applicable.
   */
  public static deserialize(jobData: Record<string, any>): JobData {
    if (!jobData) {
      throw new ValidationError('Job data record is empty or invalid.');
    }
    const copy = this.deepCloneAndParseDates(jobData);
    return copy as JobData;
  }

  /**
   * Asserts the validity of JobData schemas.
   */
  public static validateJobData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Job data must be a valid object.');
    }
    if (typeof data.deliveryId !== 'string' || data.deliveryId.trim() === '') {
      throw new ValidationError('Job data requires a non-empty string deliveryId.');
    }
    if (data.payload === undefined) {
      throw new ValidationError('Job data requires a valid payload.');
    }
  }

  private static deepCloneAndConvertDates(obj: any): any {
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepCloneAndConvertDates(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const cloned: Record<string, any> = {};
      Object.keys(obj).forEach((key) => {
        cloned[key] = this.deepCloneAndConvertDates(obj[key]);
      });
      return cloned;
    }
    return obj;
  }

  private static deepCloneAndParseDates(obj: any): any {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (typeof obj === 'string' && isoDateRegex.test(obj)) {
      return new Date(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepCloneAndParseDates(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const cloned: Record<string, any> = {};
      Object.keys(obj).forEach((key) => {
        cloned[key] = this.deepCloneAndParseDates(obj[key]);
      });
      return cloned;
    }
    return obj;
  }
}
