import { User } from './user.aggregate';

describe('User aggregate', () => {
  it('derives normalized username and display fields at creation', () => {
    const user = User.create({
      id: 'user-id',
      email: 'User.Name+Inbox@example.com',
      name: 'User Name',
    });

    expect(user.username).toBe('user-name-inbox');
    expect(user.displayUsername).toBe('user-name-inbox');
    expect(user.displayName).toBe('User Name');
  });

  it('keeps the display name aligned when profile name changes', () => {
    const user = User.create({
      id: 'user-id',
      email: 'user@example.com',
      name: 'Original',
    });

    user.updateProfile({ name: 'Updated' });

    expect(user.name).toBe('Updated');
    expect(user.displayName).toBe('Updated');
  });

  describe('roles', () => {
    it('defaults to USER when no roles provided', () => {
      const user = User.create({ id: 'id', email: 'a@b.com', name: 'A' });
      expect(user.roles).toEqual(['USER']);
    });

    it('normalizes and deduplicates roles at creation', () => {
      const user = User.create({ id: 'id', email: 'a@b.com', name: 'A', roles: ['ADMIN', 'USER', 'ADMIN'] });
      expect(user.roles).toEqual(['USER', 'ADMIN']);
    });

    it('hasRole returns true when role is present', () => {
      const user = User.create({ id: 'id', email: 'a@b.com', name: 'A', roles: ['MODERATOR'] });
      expect(user.hasRole('MODERATOR')).toBe(true);
      expect(user.hasRole('ADMIN')).toBe(false);
    });

    it('addRole adds a new role', () => {
      const user = User.create({ id: 'id', email: 'a@b.com', name: 'A' });
      user.addRole('MODERATOR');
      expect(user.roles).toEqual(['USER', 'MODERATOR']);
    });

    it('addRole is a no-op when role already present', () => {
      const user = User.create({ id: 'id', email: 'a@b.com', name: 'A' });
      user.addRole('USER');
      expect(user.roles).toEqual(['USER']);
    });

    it('removeRole removes the specified role', () => {
      const user = User.create({ id: 'id', email: 'a@b.com', name: 'A', roles: ['USER', 'ADMIN'] });
      user.removeRole('USER');
      expect(user.roles).toEqual(['ADMIN']);
    });

    it('removeRole throws when it would produce an empty array', () => {
      const user = User.create({ id: 'id', email: 'a@b.com', name: 'A' });
      expect(() => user.removeRole('USER')).toThrow('A user must have at least one role');
    });

    it('setRoles replaces all roles', () => {
      const user = User.create({ id: 'id', email: 'a@b.com', name: 'A' });
      user.setRoles(['MODERATOR', 'ADMIN']);
      expect(user.roles).toEqual(['MODERATOR', 'ADMIN']);
    });

    it('setRoles is a no-op when roles are identical', () => {
      const user = User.create({ id: 'id', email: 'a@b.com', name: 'A' });
      user.setRoles(['USER']);
      const eventsBefore = user.getEvents().length;
      user.setRoles(['USER']);
      expect(user.getEvents().length).toBe(eventsBefore);
    });

    it('toRecord round-trips roles correctly', () => {
      const user = User.create({ id: 'id', email: 'a@b.com', name: 'A', roles: ['ADMIN'] });
      const record = user.toRecord();
      const restored = User.from(record);
      expect(restored.roles).toEqual(['ADMIN']);
    });

    it('reconstitute throws on empty roles', () => {
      expect(() => User.from({
        id: 'id', name: 'N', email: 'a@b.com', username: 'a-b',
        displayUsername: 'a-b', displayName: null, bio: null,
        preferences: {}, emailVerified: false, image: null,
        roles: [],
        createdAt: new Date(), updatedAt: new Date(),
      })).toThrow('A user must have at least one role');
    });
  });
});
