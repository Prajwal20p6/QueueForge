import { z } from 'zod';
import { Validator } from '../../../../src/security/validation/validator';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('Validator Unit Tests', () => {
  const schema = z.object({
    username: z.string().min(3),
    age: z.number().int().min(18),
  });

  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  it('should validate and parse payload matching schema', () => {
    const payload = { username: 'john_doe', age: 25 };
    const res = validator.validate<typeof payload>(payload, schema);

    expect(res.valid).toBe(true);
    expect(res.data).toEqual(payload);
    expect(res.errors).toBeUndefined();
  });

  it('should return errors array when payload does not match schema', () => {
    const payload = { username: 'jo', age: 15 };
    const res = validator.validate(payload, schema);

    expect(res.valid).toBe(false);
    expect(res.errors).toHaveLength(2);
    expect(res.errors![0].field).toBe('username');
    expect(res.errors![1].field).toBe('age');
  });

  it('should throw ValidationError on request payload failure', async () => {
    const payload = { username: 'jo', age: 15 };

    await expect(validator.validateRequest(payload, schema)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError on query payload failure', async () => {
    const payload = { username: 'jo', age: 15 };

    await expect(validator.validateQuery(payload, schema)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError on parameter payload failure', async () => {
    const payload = { username: 'jo', age: 15 };

    await expect(validator.validateParams(payload, schema)).rejects.toThrow(ValidationError);
  });
});
