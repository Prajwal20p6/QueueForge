export enum DaemonType {
  RECOVERY = 'RECOVERY',
  HEALTH = 'HEALTH',
  METRICS = 'METRICS',
  ADMIN_SYNC = 'ADMIN_SYNC',
}

export enum DaemonRole {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  OBSERVER = 'OBSERVER',
}

/**
 * Returns true if a daemon type is configured as a cluster-wide singleton (only 1 node acts as PRIMARY).
 */
export function isDaemonSingleton(type: DaemonType | string): boolean {
  const typeStr = String(type).toUpperCase();
  return typeStr === DaemonType.RECOVERY || typeStr === DaemonType.ADMIN_SYNC;
}
