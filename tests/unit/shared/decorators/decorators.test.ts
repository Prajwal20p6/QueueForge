import { Timeout, Memoize, Log } from '../../../../src/shared/decorators';
import { sleep } from '../../../../src/shared/utils';

describe('Shared Foundation Layer Decorators', () => {
  describe('Timeout decorator', () => {
    class TimeoutTest {
      @Timeout(50)
      public async slowMethod() {
        await sleep(100);
        return 'success';
      }

      @Timeout(100)
      public async fastMethod() {
        await sleep(10);
        return 'success';
      }
    }

    it('should throw Error on timeout breach', async () => {
      const test = new TimeoutTest();
      await expect(test.slowMethod()).rejects.toThrow('Operation timed out');
    });

    it('should succeed if completed within duration', async () => {
      const test = new TimeoutTest();
      const res = await test.fastMethod();
      expect(res).toBe('success');
    });
  });

  describe('Memoize decorator', () => {
    class MemoizeTest {
      public callCount = 0;

      @Memoize(1000)
      public getValue(arg: string) {
        this.callCount++;
        return `val:${arg}`;
      }
    }

    it('should cache method invocations results based on arguments key', () => {
      const test = new MemoizeTest();
      const res1 = test.getValue('abc');
      const res2 = test.getValue('abc');

      expect(res1).toBe('val:abc');
      expect(res2).toBe('val:abc');
      expect(test.callCount).toBe(1);

      const res3 = test.getValue('xyz');
      expect(res3).toBe('val:xyz');
      expect(test.callCount).toBe(2);
    });
  });

  describe('Log decorator', () => {
    class LogTest {
      @Log('info')
      public run(value: number) {
        return value * 2;
      }
    }

    it('should log entering and leaving operations', () => {
      const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

      const test = new LogTest();
      const res = test.run(5);
      expect(res).toBe(10);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
