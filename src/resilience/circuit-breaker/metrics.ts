import client from 'prom-client';
import { CircuitState } from './circuit-breaker-state';

// Register prometheus metrics counters and gauges
export const cbOpenedCounter =
  (client.register.getSingleMetric('circuit_breaker_opened_total') as client.Counter) ||
  new client.Counter({
    name: 'circuit_breaker_opened_total',
    help: 'Total counts of circuit breaker open events',
    labelNames: ['destination_id'],
  });

export const cbClosedCounter =
  (client.register.getSingleMetric('circuit_breaker_closed_total') as client.Counter) ||
  new client.Counter({
    name: 'circuit_breaker_closed_total',
    help: 'Total counts of circuit breaker closed events',
    labelNames: ['destination_id'],
  });

export const cbStateGauge =
  (client.register.getSingleMetric('circuit_breaker_state') as client.Gauge) ||
  new client.Gauge({
    name: 'circuit_breaker_state',
    help: 'Circuit breaker active state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
    labelNames: ['destination_id'],
  });

export const cbRecoveryTimer =
  (client.register.getSingleMetric('circuit_breaker_recovery_time_seconds') as client.Histogram) ||
  new client.Histogram({
    name: 'circuit_breaker_recovery_time_seconds',
    help: 'Time elapsed for a circuit breaker to recover back to CLOSED state',
    labelNames: ['destination_id'],
    buckets: [1, 5, 10, 30, 60, 120, 300],
  });

export const cbTransitionsCounter =
  (client.register.getSingleMetric('circuit_breaker_transitions_total') as client.Counter) ||
  new client.Counter({
    name: 'circuit_breaker_transitions_total',
    help: 'Total count of circuit state transitions',
    labelNames: ['destination_id', 'from_state', 'to_state'],
  });

/**
 * Records a state machine transitions metrics update.
 */
export function recordCircuitBreakerTransition(
  destinationId: string,
  fromState: CircuitState | string,
  toState: CircuitState | string,
  _metrics?: any
): void {
  cbTransitionsCounter.inc({
    destination_id: destinationId,
    from_state: String(fromState),
    to_state: String(toState),
  });

  const stateStr = String(toState);
  const val = stateStr === 'CLOSED' ? 0 : stateStr === 'HALF_OPEN' ? 1 : 2;
  cbStateGauge.set({ destination_id: destinationId }, val);
}

/**
 * Records general events like opened/closed transitions counts.
 */
export function recordCircuitBreakerEvent(
  destinationId: string,
  eventType: 'opened' | 'closed' | 'half_opened',
  _metrics?: any
): void {
  if (eventType === 'opened') {
    cbOpenedCounter.inc({ destination_id: destinationId });
  } else if (eventType === 'closed') {
    cbClosedCounter.inc({ destination_id: destinationId });
  }
}
