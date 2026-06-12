import { Roles } from './roles.vo';

describe('Roles', () => {
  describe('create', () => {
    it('defaults to USER when no roles provided', () => {
      const roles = Roles.create();
      expect([...roles]).toEqual(['USER']);
    });

    it('defaults to USER when empty array provided', () => {
      const roles = Roles.create([]);
      expect([...roles]).toEqual(['USER']);
    });

    it('normalizes roles in hierarchy order', () => {
      const roles = Roles.create(['ADMIN', 'USER']);
      expect([...roles]).toEqual(['USER', 'ADMIN']);
    });

    it('deduplicates roles', () => {
      const roles = Roles.create(['USER', 'ADMIN', 'USER']);
      expect([...roles]).toEqual(['USER', 'ADMIN']);
    });
  });

  describe('reconstitute', () => {
    it('throws on empty array', () => {
      expect(() => Roles.reconstitute([])).toThrow('A user must have at least one role');
    });

    it('normalizes valid roles', () => {
      const roles = Roles.reconstitute(['ADMIN', 'USER', 'ADMIN']);
      expect(roles.primary).toBe('USER');
    });
  });

  describe('has', () => {
    it('returns true when role is present', () => {
      const roles = Roles.create(['USER', 'MODERATOR']);
      expect(roles.has('MODERATOR')).toBe(true);
    });

    it('returns false when role is absent', () => {
      const roles = Roles.create(['USER']);
      expect(roles.has('ADMIN')).toBe(false);
    });
  });

  describe('add', () => {
    it('adds a new role', () => {
      const roles = Roles.create(['USER']);
      const next = roles.add('MODERATOR');
      expect([...next]).toEqual(['USER', 'MODERATOR']);
    });

    it('returns same instance when role already present', () => {
      const roles = Roles.create(['USER']);
      const next = roles.add('USER');
      expect(next).toBe(roles);
    });

    it('maintains canonical order after add', () => {
      const roles = Roles.create(['ADMIN']);
      const next = roles.add('USER');
      expect([...next]).toEqual(['USER', 'ADMIN']);
    });
  });

  describe('remove', () => {
    it('removes a role', () => {
      const roles = Roles.create(['USER', 'ADMIN']);
      const next = roles.remove('USER');
      expect([...next]).toEqual(['ADMIN']);
    });

    it('returns same instance when role not present', () => {
      const roles = Roles.create(['USER']);
      const next = roles.remove('ADMIN');
      expect(next).toBe(roles);
    });

    it('throws when removal would leave array empty', () => {
      const roles = Roles.create(['USER']);
      expect(() => roles.remove('USER')).toThrow('A user must have at least one role');
    });
  });

  describe('set', () => {
    it('replaces all roles', () => {
      const roles = Roles.create(['USER']);
      const next = roles.set(['ADMIN']);
      expect([...next]).toEqual(['ADMIN']);
    });

    it('throws on empty input', () => {
      const roles = Roles.create(['USER']);
      expect(() => roles.set([])).toThrow('A user must have at least one role');
    });
  });

  describe('equals', () => {
    it('returns true for same role set', () => {
      const a = Roles.create(['USER', 'ADMIN']);
      const b = Roles.create(['ADMIN', 'USER']);
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for different role sets', () => {
      const a = Roles.create(['USER']);
      const b = Roles.create(['ADMIN']);
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('primary', () => {
    it('returns the lowest-ranked role', () => {
      const roles = Roles.create(['ADMIN', 'USER']);
      expect(roles.primary).toBe('USER');
    });

    it('returns USER when that is the only role', () => {
      const roles = Roles.create(['USER']);
      expect(roles.primary).toBe('USER');
    });
  });

  describe('toArray', () => {
    it('returns a copy of the roles array', () => {
      const roles = Roles.create(['USER', 'ADMIN']);
      const arr = roles.toArray();
      expect(arr).toEqual(['USER', 'ADMIN']);
      arr.push('MODERATOR');
      expect([...roles]).toEqual(['USER', 'ADMIN']);
    });
  });
});
