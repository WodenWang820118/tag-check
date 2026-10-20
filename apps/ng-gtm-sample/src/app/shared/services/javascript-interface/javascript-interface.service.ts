import { Injectable } from '@angular/core';
import { Environment } from '../env-detector/utils';
import { EnvDetectorService } from '../env-detector/env-detector.service';

/**
 * Bridges the Flutter, Android and iOS host apps inject into the WebView. Each
 * handler below only runs after `EnvDetectorService` found its bridge.
 */
interface NativeBridges {
  flutter_inappwebview: {
    callHandler(handlerName: string, ...args: unknown[]): unknown;
  };
  AnalyticsWebInterface: {
    logEvent(name: string, jsonParams: string): void;
    setUserProperty(name: string, value: unknown): void;
    setUserId(userId: unknown): void;
  };
  webkit: {
    messageHandlers: { firebase: { postMessage(message: unknown): void } };
  };
}

function nativeBridges(): NativeBridges {
  return globalThis as unknown as NativeBridges;
}

@Injectable({
  providedIn: 'root'
})
export class JavascriptInterfaceService {
  constructor(private readonly envDetector: EnvDetectorService) {}
  logEvent(name: string, params: Record<string, unknown>) {
    switch (this.envDetector.getPlatform()) {
      case Environment.FLUTTER:
        this.flutterHandler(name, params, 'eventHandler');
        break;
      case Environment.ANDROID:
        this.androidHandler(name, params, 'logEvent');
        break;
      case Environment.IOS:
        this.iosHandler(name, params, 'logEvent');
        break;
      default:
        break;
    }
  }

  setUserProperty(name: string, value: string) {
    switch (this.envDetector.getPlatform()) {
      case Environment.FLUTTER:
        this.flutterHandler(name, value, 'userPropertyHandler');
        break;
      case Environment.ANDROID:
        this.androidHandler(name, value, 'setUserProperty');
        break;
      case Environment.IOS:
        this.iosHandler(name, value, 'setUserProperty');
        break;
      default:
        break;
    }
  }

  setUserId(userId = '123456') {
    switch (this.envDetector.getPlatform()) {
      case Environment.FLUTTER:
        nativeBridges().flutter_inappwebview.callHandler('userIdHandler', {
          user_id: userId
        });
        break;
      case Environment.ANDROID:
        this.androidHandler('null', userId, 'setUserId');
        break;
      case Environment.IOS:
        // iOS handler not yet implemented for this feature
        break;
      default:
        break;
    }
  }

  flutterHandler(name: string, params: unknown, handler: string) {
    try {
      nativeBridges().flutter_inappwebview.callHandler(handler, {
        name: name,
        params: params
      });
    } catch (error) {
      console.log(error);
    }
  }

  // NOTE: Android handler - verify on real device
  androidHandler(name: string, params: unknown, command: string) {
    try {
      switch (command) {
        case 'logEvent':
          nativeBridges().AnalyticsWebInterface.logEvent(
            name,
            JSON.stringify(params)
          );
          break;
        case 'setUserProperty':
          nativeBridges().AnalyticsWebInterface.setUserProperty(name, params);
          break;
        case 'setUserId':
          nativeBridges().AnalyticsWebInterface.setUserId(params);
          break;
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }

  // NOTE: iOS handler - verify on real device
  iosHandler(name: string, params: unknown, command: string) {
    try {
      const message = {
        command: command,
        name: name,
        parameters: params
      };
      nativeBridges().webkit.messageHandlers.firebase.postMessage(message);
    } catch (error) {
      console.log(error);
    }
  }
}
