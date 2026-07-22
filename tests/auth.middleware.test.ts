import { Request, Response } from 'express';
import { validateApiKey, validateJwt } from '../src/infrastructure/security/auth.middleware';
import jwt from 'jsonwebtoken';
import { getConfig } from '../src/config';

describe('Auth Middlewares', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      header: jest.fn(),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('validateApiKey', () => {
    it('should call next() if valid API Key is provided in X-API-Key header', () => {
      (req.header as jest.Mock).mockImplementation((name: string) => {
        if (name === 'X-API-Key') return 'qf_secret_api_key_12345';
        return undefined;
      });

      validateApiKey(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if API Key header is missing', () => {
      (req.header as jest.Mock).mockReturnValue(undefined);

      validateApiKey(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 if API Key is incorrect', () => {
      (req.header as jest.Mock).mockImplementation((name: string) => {
        if (name === 'X-API-Key') return 'wrong-key-value';
        return undefined;
      });

      validateApiKey(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('validateJwt', () => {
    const secret = getConfig().security.jwtSecret;

    it('should call next() and assign user if valid token is provided in Authorization header', () => {
      const token = jwt.sign({ sub: 'user123', role: 'admin' }, secret);
      (req.header as jest.Mock).mockImplementation((name: string) => {
        if (name === 'Authorization') return `Bearer ${token}`;
        return undefined;
      });

      validateJwt(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect((req as any).user).toMatchObject({ sub: 'user123', role: 'admin' });
    });

    it('should return 403 if JWT signature is invalid', () => {
      const token = jwt.sign({ sub: 'user123' }, 'wrong-signing-secret');
      (req.header as jest.Mock).mockImplementation((name: string) => {
        if (name === 'Authorization') return `Bearer ${token}`;
        return undefined;
      });

      validateJwt(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
