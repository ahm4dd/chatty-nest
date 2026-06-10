import { Username } from './username.vo';

describe('Username', () => {
  it('normalizes raw values', () => {
    expect(Username.fromRaw(' User.Name+Inbox ').value).toBe('user-name-inbox');
    expect(Username.fromRaw('---').value).toBe('user');
  });

  it('derives usernames from email local parts', () => {
    expect(Username.fromEmail('User.Name+Inbox@example.com').value).toBe(
      'user-name-inbox',
    );
  });
});
