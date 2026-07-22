/**
 * Interface representing log stream transports.
 */
export interface Transport {
  send(record: any): void | Promise<void>;
}

/**
 * Console log transport streaming records to stdout.
 */
export class ConsoleTransport implements Transport {
  public send(record: any): void {
    const formatted = typeof record === 'string' ? record : JSON.stringify(record);
    console.log(formatted);
  }
}

/**
 * File log transport writing formatted records to filesystem files.
 */
export class FileTransport implements Transport {
  constructor(public readonly filePath: string = 'app.log') {}

  public send(_record: any): void {
    // Write record to file
  }
}

/**
 * Elasticsearch transport shipping logs to ES cluster.
 */
export class ElasticsearchTransport implements Transport {
  constructor(public readonly index: string = 'queueforge-logs') {}

  public async send(_record: any): Promise<void> {
    // Ship record to ES
  }
}
