export interface QueryConfig {
  tableName: string;
  selectFields: string[];
  filterCondition?: string;
  orderByField?: string;
}

/**
 * Fluent query builder compiler.
 */
export class AnalyticsQueryBuilder {
  private config: QueryConfig;

  constructor(tableName: string) {
    this.config = {
      tableName,
      selectFields: ['*'],
    };
  }

  public select(fields: string[]): this {
    this.config.selectFields = fields;
    return this;
  }

  public filterBy(condition: string): this {
    this.config.filterCondition = condition;
    return this;
  }

  public orderBy(field: string): this {
    this.config.orderByField = field;
    return this;
  }

  public build(): QueryConfig {
    return this.config;
  }
}
