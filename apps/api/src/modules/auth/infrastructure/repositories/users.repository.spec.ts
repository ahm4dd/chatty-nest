import type { DrizzleDb } from '../../../../app/database/types';
import { User } from '../../domain/aggregates/user.aggregate';
import { Username } from '../../domain/value-objects/username.vo';
import { UsersRepositoryImpl } from './users.repository';

describe('UsersRepositoryImpl username handling', () => {
  it('normalizes usernames from email local parts', () => {
    expect(Username.fromRaw(' User.Name+Inbox ').value).toBe('user-name-inbox');
    expect(Username.fromRaw('---').value).toBe('user');
  });

  it('retries username candidates when the first insert is skipped by a conflict', async () => {
    const insertedValues: Array<{ username: string }> = [];
    const db = createDbMock(insertedValues, [[], [{ id: 'user-id' }]]);
    const repository = new UsersRepositoryImpl(db);
    const user = User.create({
      id: 'user-id',
      email: 'User+Inbox@example.com',
      name: 'User',
    });

    await repository.save(user);

    expect(insertedValues.map((value) => value.username)).toEqual([
      'user-inbox',
      'user-inbox1',
    ]);
  });
});

function createDbMock(
  insertedValues: Array<{ username: string }>,
  insertResults: Array<Array<{ id: string }>>,
): DrizzleDb {
  return {
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(async () => []),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      values: jest.fn((value: { username: string }) => {
        insertedValues.push(value);

        return {
          onConflictDoNothing: jest.fn(() => ({
            returning: jest.fn(async () => insertResults.shift() ?? []),
          })),
        };
      }),
    })),
  } as unknown as DrizzleDb;
}
