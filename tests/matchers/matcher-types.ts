declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDeliveryStatus(): R;
      toBeValidUUID(): R;
    }
  }
}

export {};
