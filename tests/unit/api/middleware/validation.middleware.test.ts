import { validateRequest } from '../../../../src/api/middleware/request-validator.middleware';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('validateRequest Middleware Unit Tests', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = { body: { name: 'Valid' } };
    res = {};
    next = jest.fn();
  });

  it('should pass validated body to next() on success', () => {
    const validatorFn = (data: any) => {
      if (!data.name) throw new ValidationError('name', 'Name is required');
      return { name: data.name.toUpperCase() };
    };

    const middleware = validateRequest(validatorFn, 'body');
    middleware(req, res, next);

    expect(req.body.name).toBe('VALID');
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with ValidationError when validation fails', () => {
    const validatorFn = () => {
      throw new ValidationError('name', 'Invalid name');
    };

    const middleware = validateRequest(validatorFn, 'body');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: 'ValidationError' }));
  });
});
