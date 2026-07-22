import { HeaderBuilder } from '../../../../src/security/hmac/header-builder';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('HeaderBuilder Unit Tests', () => {
  let builder: HeaderBuilder;

  beforeEach(() => {
    builder = new HeaderBuilder();
  });

  it('should build bearer header format', () => {
    const header = builder.buildBearerHeader('mytoken');
    expect(header).toBe('Bearer mytoken');
  });

  it('should throw ValidationError if token is malformed for Bearer', () => {
    expect(() => builder.buildBearerHeader('')).toThrow(ValidationError);
  });

  it('should build ApiKey header format', () => {
    const key = 'a'.repeat(32);
    const header = builder.buildApiKeyHeader(key);
    expect(header).toBe(`ApiKey ${key}`);
  });

  it('should throw ValidationError if key length < 32 for ApiKey', () => {
    expect(() => builder.buildApiKeyHeader('shortkey')).toThrow(ValidationError);
  });

  it('should build signature and timestamp structure for HMAC', async () => {
    const payload = { test: 'data' };
    const secret = 'h'.repeat(32);

    const headers = await builder.buildHmacHeader(payload, secret);
    expect(headers.timestamp).toBeDefined();
    expect(headers.signature.startsWith(`t=${headers.timestamp},s=`)).toBe(true);
  });

  it('should throw ValidationError if HMAC secret length is < 32', async () => {
    const payload = { test: 'data' };
    await expect(builder.buildHmacHeader(payload, 'shortsecret')).rejects.toThrow(ValidationError);
  });
});
