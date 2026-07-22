/**
 * Pick specific keys from an object to create a new object
 * @param obj - Target source object
 * @param keys - Keys list to pick
 * @returns New object with picked properties
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Exclude specific keys from an object to create a new object
 * @param obj - Target source object
 * @param keys - Keys list to exclude
 * @returns New object with remaining properties
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/**
 * Type guard function to ensure a variable is not null and not undefined
 * @param value - Target checking value
 * @returns True if value is defined (type narrowing)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Performs a deep copy of an object, copying nested maps, lists, and Date values
 * @param obj - Target source variable
 * @returns Cloned copy
 */
export function deepCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepCopy(item)) as any;
  }

  const cloned = {} as Record<string, any>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepCopy((obj as any)[key]);
    }
  }
  return cloned as T;
}

/**
 * Deeply merges two objects, combining properties and resolving nested conflicts recursively
 * @param obj1 - Base target object
 * @param obj2 - Merging source object
 * @returns Merged combined object
 */
export function merge<T extends Record<string, any>, U extends Record<string, any>>(
  obj1: T,
  obj2: U
): T & U {
  const result = deepCopy(obj1) as any;
  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      const val2 = obj2[key];
      if (
        val2 &&
        typeof val2 === 'object' &&
        !Array.isArray(val2) &&
        !((val2 as any) instanceof Date)
      ) {
        const val1 = result[key];
        if (val1 && typeof val1 === 'object' && !Array.isArray(val1) && !(val1 instanceof Date)) {
          result[key] = merge(val1, val2);
        } else {
          result[key] = deepCopy(val2);
        }
      } else {
        result[key] = deepCopy(val2);
      }
    }
  }
  return result as T & U;
}
