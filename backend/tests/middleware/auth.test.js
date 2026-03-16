const { optionalAuth } = require('../../src/middleware/auth');

function makeReqResNext(headers = {}) {
  const req = { headers };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('optionalAuth middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('when ADMIN_API_KEY is set', () => {
    beforeEach(() => {
      process.env.ADMIN_API_KEY = 'a-valid-key-for-testing-purposes-here';
    });

    it('calls next() when correct key provided via x-admin-key', () => {
      const { req, res, next } = makeReqResNext({ 'x-admin-key': process.env.ADMIN_API_KEY });
      optionalAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('calls next() when correct key provided via x-api-key', () => {
      const { req, res, next } = makeReqResNext({ 'x-api-key': process.env.ADMIN_API_KEY });
      optionalAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('calls next() when correct Bearer token provided', () => {
      const { req, res, next } = makeReqResNext({ authorization: `Bearer ${process.env.ADMIN_API_KEY}` });
      optionalAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('returns 401 when no key provided', () => {
      const { req, res, next } = makeReqResNext();
      optionalAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when wrong key provided', () => {
      const { req, res, next } = makeReqResNext({ 'x-admin-key': 'wrong-key' });
      optionalAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('when ADMIN_API_KEY is not set', () => {
    beforeEach(() => {
      delete process.env.ADMIN_API_KEY;
    });

    it('returns 503 in production', () => {
      process.env.NODE_ENV = 'production';
      const { req, res, next } = makeReqResNext();
      optionalAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next() in development', () => {
      process.env.NODE_ENV = 'development';
      const { req, res, next } = makeReqResNext();
      optionalAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
