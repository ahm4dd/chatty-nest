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
});
