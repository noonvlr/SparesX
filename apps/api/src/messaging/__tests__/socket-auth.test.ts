import { SocketAuthError, extractToken, verifyToken } from '../sockets/auth';
import jwt from 'jsonwebtoken';

describe('socket auth helpers', () => {
  const secret = 'unit-test-secret';

  it('extracts token from handshake auth', () => {
    const token = 'abc123';
    const handshake: any = { auth: { token } };

    expect(extractToken(handshake)).toBe(token);
  });

  it('extracts token from authorization header', () => {
    const token = 'xyz';
    const handshake: any = { headers: { authorization: `Bearer ${token}` } };

    expect(extractToken(handshake)).toBe(token);
  });

  it('returns undefined when token missing', () => {
    const handshake: any = { auth: {} };
    expect(extractToken(handshake)).toBeUndefined();
  });

  it('verifies a valid token and returns payload', () => {
    const signed = jwt.sign({ userId: 'user-1', email: 'user@example.com' }, secret);

    const payload = verifyToken(signed, secret);

    expect(payload).toEqual({ userId: 'user-1', email: 'user@example.com' });
  });

  it('throws SocketAuthError when userId is missing', () => {
    const signed = jwt.sign({ foo: 'bar' }, secret);

    expect(() => verifyToken(signed, secret)).toThrow(SocketAuthError);
  });

  it('throws when token invalid', () => {
    expect(() => verifyToken('invalid-token', secret)).toThrow();
  });
});
