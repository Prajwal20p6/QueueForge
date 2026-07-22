import { ConflictError, InternalError, ErrorMapper } from '../../../../src/shared/errors';
import { HttpStatus } from '../../../../src/shared/constants/http-status';

describe('Shared Foundation Layer Errors', () => {
  describe('ConflictError', () => {
    it('should construct correct ConflictError properties', () => {
      const err = new ConflictError('State conflict occurred');
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe('State conflict occurred');
    });
  });

  describe('InternalError', () => {
    it('should construct correct InternalError properties', () => {
      const err = new InternalError('DB crash exception details');
      expect(err.statusCode).toBe(HttpStatus.SERVER_ERROR || 500);
      expect(err.message).toBe('DB crash exception details');
    });
  });

  describe('ErrorMapper', () => {
    it('should map standard exceptions to BaseError instances', () => {
      const basicErr = new Error('Unexpected database failure');
      const mapped = ErrorMapper.map(basicErr);

      expect(mapped).toBeInstanceOf(InternalError);
      expect(mapped.statusCode).toBe(500);
    });

    it('should bypass map if already a BaseError instance', () => {
      const cbErr = new ConflictError('Duplicate key');
      const mapped = ErrorMapper.map(cbErr);

      expect(mapped).toBe(cbErr);
    });
  });
});
