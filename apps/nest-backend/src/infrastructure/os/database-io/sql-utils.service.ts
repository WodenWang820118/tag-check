import { Injectable } from '@nestjs/common';

@Injectable()
export class SqlUtilsService {
  stripLeadingComments(sql: string): string {
    return sql.replace(/^(?:\s*--[^\n]*\n)+/g, '');
  }

  normalizeIdentifier(token: string): string {
    const t = token.trim();
    let s = t;
    const first = s[0];
    const last = s[s.length - 1];
    if (
      (first === '"' && last === '"') ||
      (first === '`' && last === '`') ||
      (first === '[' && last === ']')
    ) {
      s = s.slice(1, -1);
    }
    return s.toLowerCase();
  }

  splitSqlValues(valuesRaw: string): string[] {
    const result: string[] = [];
    let current = '';
    let i = 0;
    const len = valuesRaw.length;
    let depth = 0;
    while (i < len) {
      const ch = valuesRaw[i];
      if (ch === "'") {
        const { text, next } = this.readQuoted(valuesRaw, i);
        current += text;
        i = next;
        continue;
      }
      if (ch === '(') depth++;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        result.push(current.trim());
        current = '';
        i++;
        continue;
      }
      current += ch;
      i++;
    }
    if (current.trim().length > 0) result.push(current.trim());
    return result;
  }

  private readQuoted(
    valuesRaw: string,
    startIndex: number
  ): { text: string; next: number } {
    let i = startIndex;
    const len = valuesRaw.length;
    let text = '';
    text += valuesRaw[i];
    i++;
    while (i < len) {
      const ch = valuesRaw[i];
      text += ch;
      if (ch === "'") {
        if (i + 1 < len && valuesRaw[i + 1] === "'") {
          text += "'";
          i += 2;
          continue;
        }
        i++;
        break;
      }
      i++;
    }
    return { text, next: i };
  }

  quoteIdentifierForPragma(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
  }
}
