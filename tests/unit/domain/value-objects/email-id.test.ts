import { EmailId } from '../../../../src/domain/value-objects/email-id';
import { ValidationError } from '../../../../src/domain/errors/validation-error';

describe('EmailId Value Object Unit Tests', () => {
  it('should successfully create a valid EmailId', () => {
    const email = EmailId.create('test.user@inbox.com');
    expect(email.getValue()).toBe('test.user@inbox.com');
    expect(email.toString()).toBe('test.user@inbox.com');
  });

  it('should trim whitespace upon creation', () => {
    const email = EmailId.create('   spaced@example.org   ');
    expect(email.getValue()).toBe('spaced@example.org');
  });

  it('should throw ValidationError on malformed email syntax', () => {
    const malformed = [
      'plainaddress',
      '#@%^%#$@#$@#.com',
      '@example.com',
      'Joe Smith <email@example.com>',
    ];

    malformed.forEach(email => {
      expect(() => {
        EmailId.create(email);
      }).toThrow(ValidationError);
    });
  });

  it('should evaluate value equality correctly', () => {
    const email1 = EmailId.create('first@test.com');
    const email2 = EmailId.create('first@test.com');
    const email3 = EmailId.create('different@test.com');

    expect(email1.equals(email2)).toBe(true);
    expect(email1.equals(email3)).toBe(false);
  });
});
