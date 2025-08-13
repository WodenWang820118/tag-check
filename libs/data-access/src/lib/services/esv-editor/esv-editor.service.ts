import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EsvEditorService {
  private readonly content = new BehaviorSubject<string>('');
  setEsvContent(content: string) {
    this.content.next(content);
  }

  getEsvContent() {
    return this.content.asObservable();
  }
}
