import { ResilienceConfig } from '../../config/resilience';
import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Standard algorithms for selecting candidates when shedding load under severe queue pressure.
 */
export enum SheddingStrategy {
  FIFO = 'FIFO',
  RANDOM = 'RANDOM',
  PRIORITY = 'PRIORITY',
  NONE = 'NONE',
}

export type ShedStrategyType = 'REJECT' | 'DELAY' | 'SHED';

export interface SheddingPolicy {
  strategy: ShedStrategyType;
  rejectStatusCode?: number;
  delayMs?: number;
  shedPercentage?: number;
}

export interface ShedStrategy {
  selectJobsToShed<T = any>(jobs: T[], percentageToShed: number): T[];
}

/**
 * Selects candidate tasks to discard based on specified SheddingStrategy strategy algorithm.
 */
export function selectJobsToShed<T = any>(
  jobs: T[],
  percentageToShed: number,
  strategy: SheddingStrategy = SheddingStrategy.FIFO
): T[] {
  if (!jobs || jobs.length === 0 || percentageToShed <= 0 || strategy === SheddingStrategy.NONE) {
    return [];
  }

  const countToShed = Math.min(jobs.length, Math.ceil((jobs.length * percentageToShed) / 100));
  if (countToShed <= 0) return [];

  const copy = [...jobs];

  switch (strategy) {
    case SheddingStrategy.FIFO:
      // Shed oldest jobs first
      return copy.slice(0, countToShed);

    case SheddingStrategy.RANDOM:
      // Shuffle array copy and slice
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy.slice(0, countToShed);

    case SheddingStrategy.PRIORITY:
      // Sort ascending by priority (lowest priority number/value dropped first)
      copy.sort((a: any, b: any) => {
        const pA = a.priority ?? a.data?.priority ?? 0;
        const pB = b.priority ?? b.data?.priority ?? 0;
        return pA - pB;
      });
      return copy.slice(0, countToShed);

    default:
      return [];
  }
}

/**
 * Returns the shedding policy matching system load limits configurations.
 */
export function getSheddingPolicy(config: ResilienceConfig): SheddingPolicy {
  let strategy: ShedStrategyType = 'REJECT';
  if (config?.backpressureSheddingStrategy === 'BLOCK') {
    strategy = 'REJECT';
  } else if (config?.backpressureSheddingStrategy === 'DROP_OLDEST') {
    strategy = 'SHED';
  } else if (config?.backpressureSheddingStrategy === 'DROP_LATEST') {
    strategy = 'DELAY';
  }

  if (config?.backpressureAlarmThreshold !== undefined && (config.backpressureAlarmThreshold <= 0 || config.backpressureAlarmThreshold > 100)) {
    throw new ValidationError('backpressureAlarmThreshold', {
      message: 'Backpressure alarm threshold percentage must be between 1 and 100',
    });
  }

  return {
    strategy,
    rejectStatusCode: 429,
    delayMs: 5000,
    shedPercentage: 10,
  };
}
