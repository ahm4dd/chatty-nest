import type { DrizzleDb } from './types';
import { DrizzleConnection } from './db.provider';

describe('DrizzleConnection', () => {
  it('closes the database pool once', async () => {
    const end = jest.fn(async () => undefined);
    const connection = new DrizzleConnection({
      $client: { end },
    } as unknown as DrizzleDb);

    await connection.onApplicationShutdown();
    await connection.onModuleDestroy();

    expect(end).toHaveBeenCalledTimes(1);
  });
});
