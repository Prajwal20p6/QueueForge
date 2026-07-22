export { ResultFactory } from './result.factory';
export { DeliveryFactory } from './delivery.factory';
export { DestinationFactory } from './destination.factory';

/**
 * Convenience factory builder functions for one-line entity creation.
 */

/** Creates a single AiTaskResult with defaults. */
export const makeResult = () => require('./result.factory').ResultFactory.createOne();

/** Creates a single Delivery with defaults. */
export const makeDelivery = () => require('./delivery.factory').DeliveryFactory.createOne();

/** Creates a single Destination (WEBHOOK) with defaults. */
export const makeDestination = () => require('./destination.factory').DestinationFactory.createOne();

/** Creates many AiTaskResults. */
export const makeResults = (count: number) =>
  require('./result.factory').ResultFactory.createMany(count);

/** Creates many Deliveries. */
export const makeDeliveries = (count: number) =>
  require('./delivery.factory').DeliveryFactory.createMany(count);

/** Creates many Destinations. */
export const makeDestinations = (count: number) =>
  require('./destination.factory').DestinationFactory.createMany(count);
