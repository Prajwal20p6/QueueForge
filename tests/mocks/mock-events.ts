export class MockEventPublisher {
  private readonly events: any[] = [];

  public async publish(event: any): Promise<void> {
    this.events.push(event);
  }

  public getPublishedEvents(): any[] {
    return [...this.events];
  }

  public clear(): void {
    this.events.length = 0;
  }
}
