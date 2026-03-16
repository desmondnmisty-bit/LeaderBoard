const { adminAuth } = require('../../src/middleware/adminAuth');

// Helper: build mock req/res/next
function makeReqResNext(headers = {}) {
  const req = {
    headers,
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    method: 'GET',
    originalUrl: '/admin/test',
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('adminAuth middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('when ADMIN_API_KEY is set', () => {
    beforeEach(() => {
      process.env.ADMIN_API_KEY = 'a-very-secure-test-key-that-is-long-enough';
    });

    it('returns 401 when no key is provided', () => {
      const { req, res, next } = makeReqResNext();
      adminAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when wrong key is provided via x-admin-key', () => {
      const { req, res, next } = makeReqResNext({ 'x-admin-key': 'wrong-key' });
      adminAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next() when correct key is provided via x-admin-key', () => {
      const key = process.env.ADMIN_API_KEY;
      const { req, res, next } = makeReqResNext({ 'x-admin-key': key });
      adminAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('calls next() when correct key is provided via Authorization Bearer', () => {
      const key = process.env.ADMIN_API_KEY;
      const { req, res, next } = makeReqResNext({ authorization: `Bearer ${key}` });
      adminAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('when ADMIN_API_KEY is not set', () => {
    beforeEach(() => {
      delete process.env.ADMIN_API_KEY;
    });

    it('returns 503 in production', () => {
      process.env.NODE_ENV = 'production';
      const { req, res, next } = makeReqResNext();
      adminAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next() in development (open access)', () => {
      process.env.NODE_ENV = 'development';
      const { req, res, next } = makeReqResNext();
      adminAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
