import {
  parseISODate,
  formatDate,
  addMinutes,
  getTimestamp,
  truncate,
  camelToSnake,
  snakeToCamel,
  generateId,
  deepClone,
  deepMerge,
  omit,
  pick,
  isEmpty,
  chunk,
  flatten,
  unique,
  groupBy,
  sortBy,
  isValidEmail,
  isValidURL,
  isValidUUID,
  validateEmail,
  hash,
  generateRandomString,
  generateToken,
  getEnv,
  getEnvOrThrow,
  parseEnvAsNumber,
  parseEnvAsBoolean,
  Timer,
  sleep,
  setTimeoutAsync,
} from '../../../../src/shared/utils';

describe('Shared Foundation Layer Utilities', () => {
  describe('date-utils', () => {
    it('should parse, format, add minutes, and get UTC timestamps', () => {
      const now = new Date();
      const iso = formatDate(now);
      const parsed = parseISODate(iso);

      expect(parsed.getTime()).toBe(now.getTime());
      expect(() => parseISODate('invalid-date')).toThrow();

      const future = addMinutes(now, 10);
      expect(future.getTime() - now.getTime()).toBe(600000);

      const ts = getTimestamp();
      expect(ts).toBeGreaterThan(0);
    });
  });

  describe('string-utils', () => {
    it('should truncate and convert camel/snake cases', () => {
      expect(truncate('hello world', 5)).toBe('hello...');
      expect(truncate('hello', 10)).toBe('hello');

      expect(camelToSnake('camelCaseText')).toBe('camel_case_text');
      expect(snakeToCamel('snake_case_text')).toBe('snakeCaseText');

      const id = generateId();
      expect(id.length).toBe(36);
    });
  });

  describe('object-utils', () => {
    it('should clone, merge, pick, omit, and inspect empty values', () => {
      const source = { a: 1, b: { c: 2 } };
      const cloned = deepClone(source);
      expect(cloned).toEqual(source);
      expect(cloned.b).not.toBe(source.b);

      const merged = deepMerge({ x: 1 }, { y: 2 });
      expect(merged).toEqual({ x: 1, y: 2 });

      const resOmit = omit({ a: 1, b: 2, c: 3 }, ['b']);
      expect(resOmit).toEqual({ a: 1, c: 3 });

      const resPick = pick({ a: 1, b: 2, c: 3 }, ['a', 'c']);
      expect(resPick).toEqual({ a: 1, c: 3 });

      expect(isEmpty({})).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('array-utils', () => {
    it('should chunk, flatten, unique, groupBy, and sortBy elements', () => {
      expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
      expect(flatten([1, [2, [3]]])).toEqual([1, 2, 3]);
      expect(unique([1, 2, 2, 3])).toEqual([1, 2, 3]);

      const group = groupBy([{ id: 'a', type: 'webhook' }, { id: 'b', type: 'webhook' }], (x: any) => x.type);
      expect(group.webhook.length).toBe(2);

      const sorted = sortBy([{ v: 5 }, { v: 2 }, { v: 9 }], 'v');
      expect(sorted[0].v).toBe(2);
    });
  });

  describe('validation-utils', () => {
    it('should assert validation guards for emails, URLs, and UUIDs', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);

      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('invalid')).toBe(false);

      expect(isValidUUID('a0a0a0a0-b1b1-4c2c-83d3-e4e4e4e4e4e4')).toBe(true);
      expect(isValidUUID('invalid')).toBe(false);

      expect(() => validateEmail('invalid')).toThrow();
    });
  });

  describe('crypto-utils', () => {
    it('should compute hash SHA256 and generate tokens', () => {
      const h1 = hash('test');
      expect(h1.length).toBe(64);

      const r1 = generateRandomString(16);
      expect(r1.length).toBe(16);

      const t1 = generateToken();
      expect(t1).toBeDefined();
    });
  });

  describe('env-utils', () => {
    it('should parse environment variables safely', () => {
      process.env.TEST_PORT = '3000';
      process.env.TEST_FLAG = 'true';

      expect(getEnv('TEST_PORT')).toBe('3000');
      expect(getEnvOrThrow('TEST_PORT')).toBe('3000');
      expect(() => getEnvOrThrow('MISSING_KEY')).toThrow();

      expect(parseEnvAsNumber('TEST_PORT')).toBe(3000);
      expect(parseEnvAsBoolean('TEST_FLAG')).toBe(true);
    });
  });

  describe('timer-utils', () => {
    it('should sleep and track durations', async () => {
      const timer = new Timer();
      await sleep(10);
      expect(timer.getElapsedMs()).toBeGreaterThanOrEqual(10);

      let triggered = false;
      await setTimeoutAsync(async () => {
        triggered = true;
      }, 5);
      expect(triggered).toBe(true);
    });
  });
});
