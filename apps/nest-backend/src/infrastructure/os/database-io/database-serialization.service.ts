import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseSerializationService {
  quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  quoteValue(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (value instanceof Date) return `'${value.toISOString()}'`;
    if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`;
    if (typeof value === 'object')
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    if (typeof value === 'boolean') return value ? '1' : '0';
    return JSON.stringify(value, null, 2);
  }
}
