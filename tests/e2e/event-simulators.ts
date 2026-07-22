export class EventSimulator {
  public static async simulateWebhookSuccess(url: string): Promise<{ status: number }> {
    return { status: 200 };
  }

  public static async simulateWebhookFailure(url: string, statusCode = 500): Promise<{ status: number }> {
    return { status: statusCode };
  }
}
