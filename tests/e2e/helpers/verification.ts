/**
 * @fileoverview E2E Verification Helper
 *
 * Provides high-level verification utilities for E2E scenario outcomes:
 * delivery completion, data integrity, metric correctness, and timing.
 */

/**
 * Verifies that all deliveries in a workflow completed successfully.
 * @param statuses - Array of delivery final statuses.
 */
export function verifyAllDeliveriesCompleted(statuses: string[]): void {
  for (const status of statuses) {
    if (status !== 'COMPLETED') {
      throw new Error(`Expected all deliveries COMPLETED, found: ${status}`);
    }
  }
}

/**
 * Verifies that at least one delivery was moved to the DLQ.
 * @param statuses - Array of delivery final statuses.
 */
export function verifyDLQPresent(statuses: string[]): void {
  const hasDLQ = statuses.some(s => s === 'FAILED_DLQ');
  if (!hasDLQ) {
    throw new Error(`Expected at least one FAILED_DLQ delivery, found: ${statuses.join(', ')}`);
  }
}

/**
 * Verifies no data loss: all expected delivery IDs are present.
 * @param expected - Expected delivery IDs.
 * @param actual - Actual delivery IDs returned.
 */
export function verifyNoDataLoss(expected: string[], actual: string[]): void {
  const missing = expected.filter(id => !actual.includes(id));
  if (missing.length > 0) {
    throw new Error(`Missing delivery IDs: ${missing.join(', ')}`);
  }
}

/**
 * Verifies workflow timing is within acceptable bounds.
 * @param durationMs - Measured duration in milliseconds.
 * @param maxMs - Maximum acceptable duration.
 */
export function verifyTimingWithinBounds(durationMs: number, maxMs: number): void {
  if (durationMs > maxMs) {
    throw new Error(`Workflow took ${durationMs}ms, exceeding max ${maxMs}ms`);
  }
}
