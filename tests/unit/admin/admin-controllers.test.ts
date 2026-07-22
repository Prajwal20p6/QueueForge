import { AdminDashboardController } from '../../../src/api/admin/controllers/admin-dashboard.controller';
import { DeliveryExplorerController } from '../../../src/api/admin/controllers/delivery-explorer.controller';
import { DashboardService } from '../../../src/api/admin/services/dashboard.service';
import { DeliveryExplorerService } from '../../../src/api/admin/services/delivery-explorer.service';

describe('Admin Controllers Unit Tests', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('AdminDashboardController should return 200 with dashboard data', async () => {
    const service = new DashboardService();
    const controller = new AdminDashboardController(service);

    await controller.getDashboard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('DeliveryExplorerController should return paginated delivery list', async () => {
    const service = new DeliveryExplorerService();
    const controller = new DeliveryExplorerController(service);

    await controller.listDeliveries(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, pagination: expect.any(Object) }));
  });
});
