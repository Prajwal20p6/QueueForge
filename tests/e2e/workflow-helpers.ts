export class WorkflowHelper {
  constructor(private readonly container: any) {}

  public async executeIngestAndDeliver(taskResult: any): Promise<{ resultId: string; deliveryIds: string[] }> {
    const ingestService = this.container.get('ingestResultService');
    const result = await ingestService.execute(taskResult);
    return {
      resultId: result.id,
      deliveryIds: result.deliveryIds || [],
    };
  }
}
