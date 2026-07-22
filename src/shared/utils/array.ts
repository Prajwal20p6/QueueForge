/**
 * Splits an array into smaller sub-arrays of a specific limit size
 * @param array - Target source array
 * @param size - Chunk limit size
 * @returns Array of chunked sub-arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) return [array];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Deduplicates elements in an array. Supports checking distinct values by key.
 * @param array - Target source array
 * @param key - Optional object key to filter by
 * @returns Deduplicated array
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
  if (key === undefined) {
    return Array.from(new Set(array));
  }
  const seen = new Set<any>();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Groups elements of an array by a resolved key string
 * @param array - Target source array
 * @param key - Selector key or mapping function to extract group key
 * @returns Key-value mapping of grouped items
 */
export function groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const groupKey = typeof key === 'function' ? key(item) : String(item[key]);
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Recursively flattens nested arrays of arbitrary depth
 * @param array - Target nested array
 * @returns Flattened array
 */
export function flatten<T>(array: any[]): T[] {
  return array.reduce((acc, val) => {
    return acc.concat(Array.isArray(val) ? flatten(val) : val);
  }, [] as T[]);
}
