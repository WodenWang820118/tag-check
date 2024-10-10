import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GtmConfigGenerator } from '@utils';
import { Utils } from '../converter/utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class SetupConstructorService {
  constructor(private utils: Utils) {}
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
      this.utils.extractAccountAndContainerId(tagManagerUrl);

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
