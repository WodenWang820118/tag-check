import { Injectable } from '@angular/core';
import { Environment } from './utils';

/** Bridges a host app may inject into the WebView; any of them can be absent. */
interface NativeBridgeProbe {
  flutter_inappwebview?: unknown;
  AnalyticsWebInterface?: unknown;
  webkit?: { messageHandlers?: { firebase?: unknown } };
}

@Injectable({
  providedIn: 'root'
})
export class EnvDetectorService {
  getPlatform(): Environment {
    const scope = globalThis as unknown as NativeBridgeProbe;
    if (scope.flutter_inappwebview) {
      return Environment.FLUTTER;
    } else if (scope.AnalyticsWebInterface) {
      return Environment.ANDROID;
    } else if (scope.webkit?.messageHandlers?.firebase) {
      return Environment.IOS;
    } else {
      return Environment.UNKNOWN;
    }
  }
}
