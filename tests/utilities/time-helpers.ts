/**
 * Time manipulation and date utilities for test scenarios.
 */
export class TimeHelper {
  public static addSeconds(seconds: number, date = new Date()): Date {
    return new Date(date.getTime() + seconds * 1000);
  }

  public static addMinutes(minutes: number, date = new Date()): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  public static subtractSeconds(seconds: number, date = new Date()): Date {
    return new Date(date.getTime() - seconds * 1000);
  }
}
