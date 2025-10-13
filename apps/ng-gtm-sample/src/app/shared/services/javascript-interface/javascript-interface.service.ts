import { Injectable } from '@angular/core';
import { Environment } from '../env-detector/utils';
import { EnvDetectorService } from '../env-detector/env-detector.service';

@Injectable({
  providedIn: 'root'
})
export class JavascriptInterfaceService {
  constructor(private readonly envDetector: EnvDetectorService) {}
  logEvent(name: string, params: any) {
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
        (globalThis as any).flutter_inappwebview.callHandler('userIdHandler', {
          user_id: userId
        });
        break;
      case Environment.ANDROID:
        this.androidHandler('null', userId, 'setUserId');
        break;
      case Environment.IOS:
        // TODO: implement
        break;
      default:
        break;
    }
  }

  flutterHandler(name: string, params: any, handler: string) {
    try {
      (globalThis as any).flutter_inappwebview.callHandler(handler, {
        name: name,
        params: params
      });
    } catch (error) {
      console.log(error);
    }
  }

  // TODO: haven't verified this
  androidHandler(name: string, params: any, command: string) {
    try {
      switch (command) {
        case 'logEvent':
          (globalThis as any).AnalyticsWebInterface.logEvent(
            name,
            JSON.stringify(params)
          );
          break;
        case 'setUserProperty':
          (globalThis as any).AnalyticsWebInterface.setUserProperty(
            name,
            params
          );
          break;
        case 'setUserId':
          (globalThis as any).AnalyticsWebInterface.setUserId(params);
          break;
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }

  // TODO: haven't verified this
  iosHandler(name: string, params: any, command: string) {
    try {
      const message = {
        command: command,
        name: name,
        parameters: params
      };
      (globalThis as any).webkit.messageHandlers.firebase.postMessage(message);
    } catch (error) {
      console.log(error);
    }
  }
}
