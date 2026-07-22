/**
 * Validator auditing SQL statements prior to execution.
 */
export class QueryValidator {
  /**
   * Asserts if query contains destructive words like drop/delete/update/insert/alter/truncate.
   */
  public validate(sql: string): { valid: boolean; reason?: string } {
    const sanitized = sql.toLowerCase().trim();

    const destructiveKeywords = ['drop', 'delete', 'update', 'insert', 'alter', 'truncate', 'grant', 'revoke'];
    for (const word of destructiveKeywords) {
      if (sanitized.includes(word)) {
        return {
          valid: false,
          reason: `SQL contains unauthorized query keywords: ${word}`,
        };
      }
    }

    if (!sanitized.startsWith('select')) {
      return {
        valid: false,
        reason: 'SQL must start with SELECT read operations.',
      };
    }

    return { valid: true };
  }
}
