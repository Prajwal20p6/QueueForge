import { EmailId } from '../../../../src/domain/value-objects/email-id.vo';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('EmailId Value Object Unit Tests', () => {
  it('should successfully create a valid EmailId instance', () => {
    const email = EmailId.create('test.user@example.com');
    expect(email.getValue()).toBe('test.user@example.com');
    expect(email.toString()).toBe('test.user@example.com');
  });

  it('should trim leading and trailing whitespace upon creation', () => {
    const email = EmailId.create('  user@domain.com  ');
    expect(email.getValue()).toBe('user@domain.com');
  });

  it('should throw ValidationError when given an empty or invalid email address', () => {
    expect(() => new EmailId('')).toThrow(ValidationError);
    expect(() => EmailId.create('invalid-email')).toThrow(ValidationError);
    expect(() => EmailId.create('@domain.com')).toThrow(ValidationError);
    expect(() => EmailId.create('user@')).toThrow(ValidationError);
  });

  it('should compare equality case-insensitively', () => {
    const email1 = EmailId.create('USER@Example.com');
    const email2 = EmailId.create('user@example.com');
    const email3 = EmailId.create('other@example.com');

    expect(email1.equals(email2)).toBe(true);
    expect(email1.equals(email3)).toBe(false);
    expect(email1.equals(null as any)).toBe(false);
  });
});
