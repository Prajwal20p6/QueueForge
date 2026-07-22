export class MetricsVerifier {
  constructor(private readonly metricsMock: any) {}

  public assertCounterIncremented(name: string): void {
    const counter = this.metricsMock?.getCounter?.(name);
    if (!counter || (!counter.add?.mock?.calls?.length && !counter.increment?.mock?.calls?.length)) {
      throw new Error(`Expected metric counter "${name}" to be incremented`);
    }
  }
}
