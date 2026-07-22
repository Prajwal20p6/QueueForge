/**
 * QueryBuilder class provides a fluent, type-safe builder API for constructing
 * Prisma findMany query arguments including filtering, sorting, pagination, selection, and relation loading.
 */
export class QueryBuilder<TWhere = any, TOrderBy = any, TInclude = any, TSelect = any> {
  private query: {
    where?: TWhere;
    orderBy?: TOrderBy;
    include?: TInclude;
    select?: TSelect;
    take?: number;
    skip?: number;
  } = {};

  /**
   * Appends filters to where clause condition.
   */
  public where(condition: TWhere): this {
    this.query.where = {
      ...(this.query.where || {}),
      ...(condition as any),
    };
    return this;
  }

  /**
   * Appends ordering directions rules.
   */
  public orderBy(field: string, direction: 'asc' | 'desc'): this {
    this.query.orderBy = {
      [field]: direction,
    } as any;
    return this;
  }

  /**
   * Sets pagination offset skip and take limit values.
   */
  public paginate(page: number, limit: number): this {
    const take = Math.max(1, limit);
    const skip = Math.max(0, (page - 1) * take);
    this.query.take = take;
    this.query.skip = skip;
    return this;
  }

  /**
   * Enables inclusion of related nested entity associations.
   */
  public include(relations: string[]): this {
    if (this.query.select) {
      throw new Error('Cannot use both include and select properties in a single Prisma query');
    }
    const includeObj: any = {};
    relations.forEach((rel) => {
      includeObj[rel] = true;
    });
    this.query.include = includeObj;
    return this;
  }

  /**
   * Specifies explicit project fields selection.
   */
  public select(fields: string[]): this {
    if (this.query.include) {
      throw new Error('Cannot use both select and include properties in a single Prisma query');
    }
    const selectObj: any = {};
    fields.forEach((f) => {
      selectObj[f] = true;
    });
    this.query.select = selectObj;
    return this;
  }

  /**
   * Assembles and returns the final Prisma query object.
   */
  public build(): typeof this.query {
    return { ...this.query };
  }
}
export default QueryBuilder;
