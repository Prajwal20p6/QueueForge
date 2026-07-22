/**
 * Formats an object or value into a minified or indented JSON string
 * @param obj - Target payload to serialize
 * @returns JSON string representation
 */
export function formatJSON(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch (err: any) {
    return `[Unserializable object: ${err.message}]`;
  }
}

/**
 * Normalizes any caught Error or object into a structured, serializable format
 * @param error - Caught target Error
 * @returns Structured error details object
 */
export function formatError(error: any): Record<string, any> {
  if (error instanceof Error) {
    const errorDetails: Record<string, any> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    // Copy any properties attached to custom Error models (like code, statusCode, context)
    const propertyNames = Object.getOwnPropertyNames(error);
    for (const prop of propertyNames) {
      if (!['name', 'message', 'stack'].includes(prop)) {
        errorDetails[prop] = (error as any)[prop];
      }
    }
    return errorDetails;
  }
  return { message: String(error) };
}

/**
 * Standardizes log values into formatted strings
 * @param level - Log priority severity level (e.g. info, warn)
 * @param message - Core message string
 * @param context - Additional structured data
 * @returns Colorless log message string
 */
export function formatLogEntry(level: string, message: string, context?: any): string {
  const timestamp = new Date().toISOString();
  const contextString = context ? ` | Context: ${formatJSON(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}${contextString}`;
}

/**
 * Converts a string from camelCase to snake_case
 * @param str - Input string in camelCase
 * @returns Converted snake_case string
 */
export function camelToSnake(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * Converts a string from snake_case to camelCase
 * @param str - Input string in snake_case
 * @returns Converted camelCase string
 */
export function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z0-9])/g, group =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}
