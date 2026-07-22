import {
  runInTransaction,
  runWithIsolation,
  IsolationLevel,
} from '../../../src/infrastructure/database/transaction';
import { getPrismaClient } from '../../../src/infrastructure/database/client';
import { InfrastructureError } from '../../../src/shared/errors/infrastructure-error';

describe('Database Transaction Integration', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = getPrismaClient();
    jest.restoreAllMocks();
  });

  it('should run transaction successfully', async () => {
    jest.spyOn(prisma, '$transaction').mockResolvedValue('success-val');

    const result = await runInTransaction(prisma, async _tx => {
      return 'success-val';
    });

    expect(result).toBe('success-val');
  });

  it('should retry transaction on deadlock conflict and succeed eventually', async () => {
    let calls = 0;
    jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      calls++;
      if (calls === 1) {
        // Mock deadlock error code P2034
        const err: any = new Error('Deadlock detected');
        err.code = 'P2034';
        throw err;
      }
      return cb(prisma);
    });

    const callback = jest.fn().mockResolvedValue('retried-val');
    const result = await runInTransaction(prisma, callback);

    expect(result).toBe('retried-val');
    expect(calls).toBe(2);
  });

  it('should throw InfrastructureError after failing max retry attempts on deadlock', async () => {
    jest.spyOn(prisma, '$transaction').mockImplementation(async () => {
      const err: any = new Error('Database write lock deadlock conflict');
      err.code = 'P2034';
      throw err;
    });

    const callback = jest.fn();
    await expect(runInTransaction(prisma, callback)).rejects.toThrow(InfrastructureError);
  });

  it('should execute transactional block with custom isolation levels', async () => {
    jest.spyOn(prisma, '$transaction').mockResolvedValue('isolated-val');

    const callback = jest.fn().mockResolvedValue('isolated-val');
    const result = await runWithIsolation(prisma, IsolationLevel.SERIALIZABLE, callback);

    expect(result).toBe('isolated-val');
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
      timeout: 30000,
    });
  });
});
