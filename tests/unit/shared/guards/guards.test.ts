import {
  isEmail,
  isUUID,
  isValidURL,
  isPositiveNumber,
  isBoolean,
  isRecord,
  isDefined,
  isNotNull,
} from '../../../../src/shared/guards';

describe('Shared Foundation Layer Guards', () => {
  it('should narrowing types correctly', () => {
    expect(isEmail('test@example.com')).toBe(true);
    expect(isEmail(123)).toBe(false);

    expect(isUUID('a0a0a0a0-b1b1-4c2c-83d3-e4e4e4e4e4e4')).toBe(true);
    expect(isUUID('invalid')).toBe(false);

    expect(isValidURL('https://example.com')).toBe(true);
    expect(isValidURL('invalid')).toBe(false);

    expect(isPositiveNumber(5)).toBe(true);
    expect(isPositiveNumber(-10)).toBe(false);

    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(1)).toBe(false);

    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);

    expect(isDefined(undefined)).toBe(false);
    expect(isDefined(5)).toBe(true);

    expect(isNotNull(null)).toBe(false);
    expect(isNotNull(5)).toBe(true);
  });
});
