import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkbookService {
  workbook$ = new BehaviorSubject<any>(null);
  worksheetNames$ = new BehaviorSubject<string[]>(['']);
  fileName$ = new BehaviorSubject<string>('');

  // TODO: data types

  handleReadXlsxAction(data: any): void {
    this.workbook$.next(data.workbook);
    this.worksheetNames$.next(data.sheetNames);
  }

  resetWorkbookData() {
    this.workbook$.next(null);
    this.worksheetNames$.next(['']);
    this.fileName$.next('');
  }
}
