import { getErrorMessage } from '../../../../src/security/validation/error-messages';

describe('Error Messages Templates Unit Tests', () => {
  it('should correctly format FIELD_REQUIRED messages', () => {
    const msg = getErrorMessage('FIELD_REQUIRED', { field: 'email' });
    expect(msg).toBe('email is required');
  });

  it('should correctly format INVALID_EMAIL messages', () => {
    const msg = getErrorMessage('INVALID_EMAIL', { field: 'email' });
    expect(msg).toBe('email must be a valid email address');
  });

  it('should correctly format INVALID_ENUM messages', () => {
    const msg = getErrorMessage('INVALID_ENUM', { field: 'type', values: ['WEBHOOK', 'QUEUE'] });
    expect(msg).toBe('type must be one of [WEBHOOK, QUEUE]');
  });

  it('should correctly format MIN_LENGTH messages', () => {
    const msg = getErrorMessage('MIN_LENGTH', { field: 'apiKey', min: 32 });
    expect(msg).toBe('apiKey must be at least 32 characters');
  });

  it('should correctly format MAX_LENGTH messages', () => {
    const msg = getErrorMessage('MAX_LENGTH', { field: 'name', max: 50 });
    expect(msg).toBe('name must be at most 50 characters');
  });

  it('should return fallback if template code is not found', () => {
    const msg = getErrorMessage('NON_EXISTENT_CODE', {});
    expect(msg).toBe('Invalid parameter field value');
  });
});
