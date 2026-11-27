import { Injectable, signal } from '@angular/core';

export interface PlanEditorTableRow {
  eventName: string;
  eventParameters: string;
  itemParameters: string;
}

/**
 * Preserves the rows entered in the plan editor dialog across opens in the same session.
 */
@Injectable({
  providedIn: 'root'
})
export class PlanEditorService {
  readonly rows = signal<PlanEditorTableRow[]>([
    { eventName: '', eventParameters: '', itemParameters: '' }
  ]);

  setRows(rows: PlanEditorTableRow[]): void {
    this.rows.set(rows);
  }

  addRow(row?: PlanEditorTableRow): void {
    this.rows.update((current) => [
      ...current,
      row ?? { eventName: '', eventParameters: '', itemParameters: '' }
    ]);
  }

  deleteRow(index: number): void {
    this.rows.update((current) => current.filter((_, i) => i !== index));
  }

  updateRow(
    index: number,
    field: keyof PlanEditorTableRow,
    value: string
  ): void {
    this.rows.update((current) => {
      if (index < 0 || index >= current.length) {
        return current;
      }
      const updated = [...current];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }
}
