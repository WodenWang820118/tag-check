/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WorkbookService {
  private readonly workbook = signal<any>(null);
  workbook$ = computed(() => this.workbook());
  private readonly worksheetNames = signal<string[]>(['']);
  worksheetNames$ = computed(() => this.worksheetNames());
  private readonly fileName = signal<string>('');
  fileName$ = computed(() => this.fileName());

  setWorkbook(workbook: any) {
    this.workbook.set(workbook);
  }

  setWorksheetNames(worksheetNames: string[]) {
    this.worksheetNames.set(worksheetNames);
  }

  setFileName(fileName: string) {
    this.fileName.set(fileName);
  }

  handleReadXlsxAction(data: any): void {
    this.workbook.set(data.workbook);
    this.worksheetNames.set(data.sheetNames);
  }

  resetWorkbookData() {
    this.workbook.set(null);
    this.worksheetNames.set(['']);
    this.fileName.set('');
  }

  resetFileName() {
    this.fileName.set('');
  }
}
