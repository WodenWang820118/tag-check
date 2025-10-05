import { Injectable } from '@angular/core';
import { Environment } from './utils';

@Injectable({
  providedIn: 'root'
})
export class EnvDetectorService {
  constructor() {}

  getPlatform(): Environment {
    if ((globalThis as any).flutter_inappwebview) {
      return Environment.FLUTTER;
    } else if ((globalThis as any).AnalyticsWebInterface) {
      return Environment.ANDROID;
    } else if ((globalThis as any)?.webkit?.messageHandlers?.firebase) {
      return Environment.IOS;
    } else {
      return Environment.UNKNOWN;
    }
  }
}
