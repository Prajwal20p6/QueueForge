import {
  hashSHA256,
  generateUUID,
  generateULID,
  encryptAES256,
  decryptAES256,
  hmacSHA256,
} from '../../../src/shared/utils/crypto';
import {
  getCurrentTimestamp,
  addSeconds,
  addMinutes,
  isExpired,
  calculateBackoff,
} from '../../../src/shared/utils/time';
import {
  formatJSON,
  formatError,
  camelToSnake,
  snakeToCamel,
} from '../../../src/shared/utils/formatting';
import { chunk, unique, groupBy, flatten } from '../../../src/shared/utils/array';
import { pick, omit, isDefined, deepCopy, merge } from '../../../src/shared/utils/object';
import { buildAuthHeader, buildHMACHeader, parseRetryAfter } from '../../../src/shared/utils/http';

describe('Shared Layer Utilities', () => {
  describe('crypto.ts', () => {
    it('should hash strings with SHA-256 correctly', () => {
      const hash = hashSHA256('hello');
      expect(hash).toHaveLength(64);
      expect(hash).toBe(hashSHA256('hello')); // deterministic
    });

    it('should generate valid UUIDs and ULIDs', () => {
      const uuid = generateUUID();
      expect(uuid).toHaveLength(36);

      const ulid = generateULID();
      expect(ulid).toHaveLength(26);
    });

    it('should correctly encrypt and decrypt payloads with AES-256', () => {
      const secret = 'my-super-secret-key-123';
      const plain = 'Cleartext Message';
      const cipher = encryptAES256(plain, secret);

      expect(cipher).toContain(':');
      expect(decryptAES256(cipher, secret)).toBe(plain);
    });

    it('should sign payloads with HMAC-SHA256', () => {
      const sign = hmacSHA256('message', 'secret');
      expect(sign).toHaveLength(64);
    });
  });

  describe('time.ts', () => {
    it('should add durations and calculate expiry dates correctly', () => {
      expect(getCurrentTimestamp()).toBeGreaterThan(0);
      const start = new Date('2026-01-01T12:00:00.000Z');
      const offsetSec = addSeconds(start, 30);
      expect(offsetSec.getUTCSeconds()).toBe(30);

      const offsetMin = addMinutes(start, 5);
      expect(offsetMin.getUTCMinutes()).toBe(5);

      expect(isExpired(new Date(Date.now() - 10000))).toBe(true);
      expect(isExpired(new Date(Date.now() + 10000))).toBe(false);
    });

    it('should compute backoffs matching retry attempt counts', () => {
      const delay1 = calculateBackoff(0, 1000, 30000);
      const delay2 = calculateBackoff(1, 1000, 30000);
      expect(delay2).toBeGreaterThanOrEqual(delay1);
    });
  });

  describe('formatting.ts', () => {
    it('should serialize JSON safely and convert case formats', () => {
      expect(formatJSON({ a: 1 })).toBe('{"a":1}');
      expect(camelToSnake('myVariableId')).toBe('my_variable_id');
      expect(snakeToCamel('my_variable_id')).toBe('myVariableId');
    });

    it('should extract error trace structures', () => {
      const error = new Error('Test crash');
      const formatted = formatError(error);
      expect(formatted.name).toBe('Error');
      expect(formatted.message).toBe('Test crash');
      expect(formatted.stack).toBeDefined();
    });
  });

  describe('array.ts', () => {
    it('should split, group, deduplicate, and flatten lists', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(unique([1, 1, 2, 3, 3])).toEqual([1, 2, 3]);
      expect(flatten([1, [2, [3]]])).toEqual([1, 2, 3]);

      const list = [
        { id: 'a', val: 1 },
        { id: 'b', val: 2 },
        { id: 'a', val: 3 },
      ];
      const grouped = groupBy(list, 'id');
      expect(grouped['a']).toHaveLength(2);
      expect(grouped['b']).toHaveLength(1);
    });
  });

  describe('object.ts', () => {
    it('should execute pick, omit, deepCopy, and merge operations', () => {
      const original = { a: 1, b: 2, c: { d: 3 } };

      expect(pick(original, ['a', 'b'])).toEqual({ a: 1, b: 2 });
      expect(omit(original, ['a', 'b'])).toEqual({ c: { d: 3 } });
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
      expect(isDefined(0)).toBe(true);

      const copied = deepCopy(original);
      copied.c.d = 99;
      expect(original.c.d).toBe(3); // deep copied verification

      const merged = merge({ a: 1, b: { c: 2 } }, { b: { d: 3 }, e: 4 });
      expect(merged).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });
  });

  describe('http.ts', () => {
    it('should construct headers and parse Retry-After correctly', () => {
      const headers = buildAuthHeader('my-key');
      expect(headers['X-API-Key']).toBe('my-key');
      expect(headers['Authorization']).toBe('ApiKey my-key');

      const hmacHeaders = buildHMACHeader({ test: true }, 'secret');
      expect(hmacHeaders['X-QueueForge-Signature']).toBeDefined();

      // Seconds parse checks
      expect(parseRetryAfter('120')).toBe(120000);

      // Date parse checks
      const future = new Date(Date.now() + 5000).toUTCString();
      const parsed = parseRetryAfter(future);
      expect(parsed).toBeGreaterThan(0);
      expect(parsed).toBeLessThanOrEqual(5000);
    });
  });
});
