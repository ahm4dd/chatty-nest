import { hasRequiredRole } from './role.vo';

describe('hasRequiredRole', () => {
  it('allows a user with the exact required role', () => {
    expect(hasRequiredRole(['USER'], 'USER')).toBe(true);
    expect(hasRequiredRole(['SUPPORT'], 'SUPPORT')).toBe(true);
    expect(hasRequiredRole(['MODERATOR'], 'MODERATOR')).toBe(true);
    expect(hasRequiredRole(['ADMIN'], 'ADMIN')).toBe(true);
  });

  it('allows a user with a higher role', () => {
    expect(hasRequiredRole(['ADMIN'], 'USER')).toBe(true);
    expect(hasRequiredRole(['ADMIN'], 'SUPPORT')).toBe(true);
    expect(hasRequiredRole(['ADMIN'], 'MODERATOR')).toBe(true);
    expect(hasRequiredRole(['MODERATOR'], 'USER')).toBe(true);
    expect(hasRequiredRole(['MODERATOR'], 'SUPPORT')).toBe(true);
    expect(hasRequiredRole(['SUPPORT'], 'USER')).toBe(true);
  });

  it('denies a user with a lower role', () => {
    expect(hasRequiredRole(['USER'], 'SUPPORT')).toBe(false);
    expect(hasRequiredRole(['USER'], 'MODERATOR')).toBe(false);
    expect(hasRequiredRole(['USER'], 'ADMIN')).toBe(false);
    expect(hasRequiredRole(['SUPPORT'], 'MODERATOR')).toBe(false);
    expect(hasRequiredRole(['SUPPORT'], 'ADMIN')).toBe(false);
    expect(hasRequiredRole(['MODERATOR'], 'ADMIN')).toBe(false);
  });

  it('succeeds if any of the user roles satisfy the requirement', () => {
    expect(hasRequiredRole(['USER', 'ADMIN'], 'ADMIN')).toBe(true);
    expect(hasRequiredRole(['USER', 'ADMIN'], 'USER')).toBe(true);
    expect(hasRequiredRole(['SUPPORT', 'ADMIN'], 'MODERATOR')).toBe(true);
  });

  it('returns false for an empty roles array', () => {
    expect(hasRequiredRole([], 'USER')).toBe(false);
    expect(hasRequiredRole([], 'ADMIN')).toBe(false);
  });
});
