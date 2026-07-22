import { JobSerializer, JobData } from '../../../../src/infrastructure/queue/job-serializer';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('job-serializer Unit Tests', () => {
  it('should serialize dates into ISO strings and deserialize back to Dates', () => {
    const originalDate = new Date();
    const data: JobData = {
      deliveryId: 'del-123',
      payload: {
        text: 'hello',
        dateField: originalDate,
        nested: {
          anotherDate: originalDate,
        },
      },
    };

    const serialized = JobSerializer.serialize(data);
    expect(typeof serialized.payload.dateField).toBe('string');
    expect(serialized.payload.dateField).toBe(originalDate.toISOString());

    const deserialized = JobSerializer.deserialize(serialized);
    expect(deserialized.payload.dateField).toBeInstanceOf(Date);
    expect(deserialized.payload.dateField.getTime()).toBe(originalDate.getTime());
    expect(deserialized.payload.nested.anotherDate).toBeInstanceOf(Date);
  });

  it('should throw ValidationError on schema validation check failures', () => {
    expect(() => JobSerializer.validateJobData(null)).toThrow(ValidationError);
    expect(() => JobSerializer.validateJobData({ deliveryId: '' })).toThrow(ValidationError);
    expect(() => JobSerializer.validateJobData({ deliveryId: 'id' })).toThrow(ValidationError); // payload missing
  });
});
