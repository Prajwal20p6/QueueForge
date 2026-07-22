import { PrismaClient } from '@prisma/client';

/**
 * Asserts that no data records were lost between two count measurements.
 * A tolerance allows for expected deletions (e.g., DLQ cleanup).
 *
 * @param before - Record count before the operation.
 * @param after - Record count after the operation.
 * @param tolerance - Allowed reduction in count (default: 0).
 * @throws {Error} if data loss exceeds the tolerance threshold.
 */
export function assertNoDataLoss(
  before: number,
  after: number,
  tolerance = 0
): void {
  const loss = before - after;
  if (loss > tolerance) {
    throw new Error(
      `[assertNoDataLoss] Data loss detected! Before: ${before}, After: ${after}, ` +
        `Loss: ${loss} (tolerance: ${tolerance}).`
    );
  }
}

/**
 * Asserts that all items in the array have unique key values (no duplicates).
 *
 * @param items - Array of objects to check.
 * @param keyFn - Function extracting the unique key from each item.
 * @throws {Error} listing all duplicate keys.
 */
export function assertNoDuplicates<T>(
  items: T[],
  keyFn: (item: T) => string
): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) {
      duplicates.add(key);
    }
    seen.add(key);
  }

  if (duplicates.size > 0) {
    throw new Error(
      `[assertNoDuplicates] Duplicate keys detected: [${Array.from(duplicates).join(', ')}].`
    );
  }
}

/**
 * Asserts that the correct number of delivery records exist for a given task result.
 *
 * @param prisma - PrismaClient instance.
 * @param resultId - Task result entity ID.
 * @param expectedCount - Expected number of delivery records.
 */
export async function assertCorrectDeliveryCount(
  prisma: PrismaClient,
  resultId: string,
  expectedCount: number
): Promise<void> {
  const count = await prisma.taskResultDelivery.count({
    where: { taskResultId: resultId },
  });
  if (count !== expectedCount) {
    throw new Error(
      `[assertCorrectDeliveryCount] Expected ${expectedCount} deliveries for ` +
        `resultId="${resultId}" but found ${count}.`
    );
  }
}

/**
 * Asserts that all expected audit event types exist for the given entity ID.
 *
 * @param prisma - PrismaClient instance.
 * @param entityId - Entity ID to query audit logs for.
 * @param expectedEvents - List of event type strings that must be present.
 */
export async function assertAuditTrailComplete(
  prisma: PrismaClient,
  entityId: string,
  expectedEvents: string[]
): Promise<void> {
  const entries = await prisma.auditLog.findMany({
    where: { entityId },
    select: { eventType: true },
  });

  const actualEvents = new Set(entries.map((e) => e.eventType));
  const missingEvents = expectedEvents.filter((ev) => !actualEvents.has(ev));

  if (missingEvents.length > 0) {
    throw new Error(
      `[assertAuditTrailComplete] Missing audit events for entityId="${entityId}": ` +
        `[${missingEvents.join(', ')}]. Found: [${Array.from(actualEvents).join(', ')}].`
    );
  }
}
