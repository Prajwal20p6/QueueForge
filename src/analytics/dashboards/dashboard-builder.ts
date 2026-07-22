export interface DashboardPanel {
  id: string;
  title: string;
  type: string;
}

export interface Dashboard {
  id: string;
  title: string;
  panels: DashboardPanel[];
}

/**
 * Helper class assembling user-defined dashboard panel dashboards.
 */
export class DashboardBuilder {
  /**
   * Generates custom dashboards layout.
   */
  public buildDashboard(title: string, panels: DashboardPanel[]): Dashboard {
    return {
      id: `dash-${Date.now()}`,
      title,
      panels,
    };
  }
}
