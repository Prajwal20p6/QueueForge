/**
 * Type guard asserting a value is a positive number (> 0)
 */
export function isPositiveNumber(val: any): val is number {
  return typeof val === 'number' && !isNaN(val) && val > 0;
}
export { isPositiveNumber as isPositive };
