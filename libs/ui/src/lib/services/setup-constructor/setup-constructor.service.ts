import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GtmConfigGenerator } from '../../interfaces/gtm-config-generator';
import { extractAccountAndContainerId } from '../converter/utilities/utilities';

@Injectable({
  providedIn: 'root',
})
export class SetupConstructorService {
  googleTagName: BehaviorSubject<string> = new BehaviorSubject<string>('');
  measurementId: BehaviorSubject<string> = new BehaviorSubject<string>('');

  includeItemScopedVariables: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  setGoogleTagName(name: string) {
    this.googleTagName.next(name);
  }

  getGoogleTagName() {
    return this.googleTagName.asObservable();
  }

  setMeasurementId(id: string) {
    this.measurementId.next(id);
  }

  getMeasurementId() {
    return this.measurementId.asObservable();
  }

  setIncludeItemScopedVariables(include: boolean) {
    this.includeItemScopedVariables.next(include);
  }

  getIncludeItemScopedVariables() {
    return this.includeItemScopedVariables.asObservable();
  }

  generateGtmConfig(
    json: any,
    tagManagerUrl: string,
    containerName: string,
    gtmId: string
  ): GtmConfigGenerator {
    const { accountId, containerId } =
      extractAccountAndContainerId(tagManagerUrl);

    const gtmConfigGenerator: GtmConfigGenerator = {
      accountId: accountId,
      containerId: containerId,
      containerName: containerName,
      gtmId: gtmId,
      specs: json,
    };

    return gtmConfigGenerator;
  }
}
