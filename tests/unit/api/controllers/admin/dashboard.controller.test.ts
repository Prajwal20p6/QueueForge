import { AdminDashboardController } from '../../../../../src/api/controllers/admin/dashboard.controller';
import { DashboardBuilder } from '../../../../../src/admin/services/dashboard-builder';
import { MockFactory } from '../../../../helpers/mocks';

describe('AdminDashboardController Unit Tests', () => {
  it('should get dashboard overview successfully', async () => {
    const builder = new DashboardBuilder();
    const logger = MockFactory.createMockLogger();
    const controller = new AdminDashboardController(builder, logger);

    const req = {} as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    await controller.getOverview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        overview: expect.any(Object),
        queueStats: expect.any(Object),
      })
    );
  });
});
