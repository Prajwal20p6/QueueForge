import { ValidationError } from '../../shared/errors/validation-error';

export type DestinationType =
  | 'WEBHOOK'
  | 'DATABASE'
  | 'QUEUE'
  | 'AUDIT'
  | 'webhook'
  | 'database'
  | 'queue'
  | 'audit'
  | (string & {});

const createTypeObj = (kind: string) => {
  const fn: any = () => ({ kind });
  fn.toString = () => kind.toUpperCase();
  fn.valueOf = () => kind.toUpperCase();
  fn.kind = kind;
  fn.value = kind.toUpperCase();
  return fn;
};

export const DestinationType = {
  WEBHOOK: 'WEBHOOK',
  DATABASE: 'DATABASE',
  QUEUE: 'QUEUE',
  AUDIT: 'AUDIT',
  webhook: createTypeObj('webhook'),
  database: createTypeObj('database'),
  queue: createTypeObj('queue'),
  audit: createTypeObj('audit'),
} as any;

/**
 * Immutable Value Object representing a destination integration target type.
 */
export class DestinationTypeVO {
  public readonly value: DestinationType;

  constructor(value: DestinationType | string | any) {
    const rawVal = typeof value === 'object' && value !== null ? (value.kind || value.value || String(value)) : String(value);
    const stringVal = String(rawVal).toUpperCase();
    let uppercaseType: string | undefined;

    if (stringVal === 'WEBHOOK') uppercaseType = 'WEBHOOK';
    else if (stringVal === 'DATABASE') uppercaseType = 'DATABASE';
    else if (stringVal === 'QUEUE') uppercaseType = 'QUEUE';
    else if (stringVal === 'AUDIT') uppercaseType = 'AUDIT';

    if (!uppercaseType) {
      throw new ValidationError(`Invalid DestinationType: "${value}".`);
    }

    this.value = uppercaseType;
    Object.freeze(this);
  }

  /**
   * Retrieves the raw DestinationType value.
   */
  public getValue(): DestinationType {
    return this.value;
  }

  public get kind(): string {
    return this.value.toLowerCase();
  }

  /**
   * Compares value equality with another DestinationTypeVO instance.
   */
  public equals(other: DestinationTypeVO): boolean {
    if (!other || !(other instanceof DestinationTypeVO)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Serializes the DestinationTypeVO to string.
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Checks if destination type is WEBHOOK.
   */
  public isWebhook(): boolean {
    return this.value === 'WEBHOOK';
  }

  /**
   * Checks if destination type is DATABASE.
   */
  public isDatabase(): boolean {
    return this.value === 'DATABASE';
  }

  /**
   * Checks if destination type is QUEUE.
   */
  public isQueue(): boolean {
    return this.value === 'QUEUE';
  }

  /**
   * Checks if destination type is AUDIT.
   */
  public isAudit(): boolean {
    return this.value === 'AUDIT';
  }

  /**
   * Static factory method creating a DestinationTypeVO instance.
   */
  public static create(type: DestinationType | string | any): DestinationTypeVO {
    return new DestinationTypeVO(type);
  }
}

export function isWebhook(type: any): boolean {
  if (!type) return false;
  const val = typeof type === 'string' ? type : (type.kind || type.value || String(type));
  return String(val).toUpperCase() === 'WEBHOOK';
}

export function isDatabase(type: any): boolean {
  if (!type) return false;
  const val = typeof type === 'string' ? type : (type.kind || type.value || String(type));
  return String(val).toUpperCase() === 'DATABASE';
}

export function isQueue(type: any): boolean {
  if (!type) return false;
  const val = typeof type === 'string' ? type : (type.kind || type.value || String(type));
  return String(val).toUpperCase() === 'QUEUE';
}

export function isAudit(type: any): boolean {
  if (!type) return false;
  const val = typeof type === 'string' ? type : (type.kind || type.value || String(type));
  return String(val).toUpperCase() === 'AUDIT';
}
