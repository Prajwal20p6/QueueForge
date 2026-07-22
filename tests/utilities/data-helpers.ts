/**
 * Data transformation utilities for test payloads.
 */
export class DataHelper {
  public static deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  public static partialUpdate<T>(base: T, updates: Partial<T>): T {
    return { ...base, ...updates };
  }
}
