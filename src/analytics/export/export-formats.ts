/**
 * Abstract formatter class serializing lists of raw object rows.
 */
export abstract class ExportFormatter {
  public abstract format(rows: any[]): Promise<Buffer>;
}

/**
 * Formats data list as standard JSON string files.
 */
export class JsonFormatter extends ExportFormatter {
  public async format(rows: any[]): Promise<Buffer> {
    const jsonStr = JSON.stringify(rows, null, 2);
    return Buffer.from(jsonStr, 'utf-8');
  }
}

/**
 * Formats data list as CSV table blocks.
 */
export class CsvFormatter extends ExportFormatter {
  public async format(rows: any[]): Promise<Buffer> {
    if (rows.length === 0) return Buffer.alloc(0);

    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map((header) => {
        const val = row[header];
        return typeof val === 'string' ? `"${val}"` : String(val);
      });
      csvRows.push(values.join(','));
    }

    return Buffer.from(csvRows.join('\n'), 'utf-8');
  }
}
export { ExportFormatter as AbstractFormatter };
