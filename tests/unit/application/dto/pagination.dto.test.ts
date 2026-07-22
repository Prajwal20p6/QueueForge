import { validate, PaginationParams } from '../../../../src/application/dto/pagination.dto';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('Pagination DTO Verification', () => {
  it('should pass and apply defaults on empty inputs', () => {
    const res = validate();
    expect(res.page).toBe(1);
    expect(res.limit).toBe(50);
    expect(res.sort).toBe('createdAt');
    expect(res.order).toBe('desc');
  });

  it('should parse valid parameters successfully', () => {
    const params: PaginationParams = { page: 2, limit: 100, sort: 'emailId', order: 'asc' };
    const res = validate(params);
    expect(res.page).toBe(2);
    expect(res.limit).toBe(100);
    expect(res.sort).toBe('emailId');
    expect(res.order).toBe('asc');
  });

  it('should throw ValidationError on invalid page values', () => {
    expect(() => validate({ page: 0 })).toThrow(ValidationError);
    expect(() => validate({ page: -5 })).toThrow(ValidationError);
  });

  it('should throw ValidationError on invalid limit values', () => {
    expect(() => validate({ limit: 0 })).toThrow(ValidationError);
    expect(() => validate({ limit: 1200 })).toThrow(ValidationError);
  });

  it('should throw ValidationError on non-alphanumeric sort columns', () => {
    expect(() => validate({ sort: 'emailId; DROP TABLE users' })).toThrow(ValidationError);
  });

  it('should throw ValidationError on invalid order values', () => {
    expect(() => validate({ order: 'wrong' as any })).toThrow(ValidationError);
  });
});
