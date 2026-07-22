import { createAuthContext } from '../../../../src/security/context/auth-context';

describe('AuthContext Unit Tests', () => {
  it('should construct correct AuthContext properties', () => {
    const principal = { id: 'user-123', name: 'John Doe', scopes: ['read', 'write'] };
    const context = createAuthContext('jwt', principal, 'corr-id-999');

    expect(context.type).toBe('jwt');
    expect(context.getPrincipalId()).toBe('user-123');
    expect(context.correlationId).toBe('corr-id-999');
    expect(context.timestamp).toBeInstanceOf(Date);
  });

  it('should check scopes correctly', () => {
    const principal = { id: 'user-123', scopes: ['read'] };
    const context = createAuthContext('jwt', principal, 'corr-id');

    expect(context.hasScope('read')).toBe(true);
    expect(context.hasScope('write')).toBe(false);
  });

  it('should check admin privileges correctly', () => {
    const userContext = createAuthContext('jwt', { id: 'user', scopes: ['read'] }, 'corr');
    expect(userContext.isAdmin()).toBe(false);

    const adminContext = createAuthContext('jwt', { id: 'admin-user', scopes: ['admin'] }, 'corr');
    expect(adminContext.isAdmin()).toBe(true);
  });

  it('should serialize to JSON without exposing sensitive details', () => {
    const principal = { id: 'user-123', name: 'John Doe', scopes: ['admin', 'supersecret'] };
    const context = createAuthContext('jwt', principal, 'corr-id');
    const json = context.toJSON() as any;

    expect(json.principalId).toBe('user-123');
    expect(json.principalName).toBe('John Doe');
    expect(json.correlationId).toBe('corr-id');
    expect(json.scopes).toBeUndefined(); // scopes should be omitted
  });
});
