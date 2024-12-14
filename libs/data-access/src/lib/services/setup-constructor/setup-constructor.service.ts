import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GtmConfigGenerator, Spec } from '@utils';
import { UtilsService } from '../gtm-json-converter/utils/utils.service';
/**
 * Service to hold the form data to generate the GTM configuration.
 * Specifically, data is used in the functional card component.
 */
@Injectable({
  providedIn: 'root'
})
export class SetupConstructorService {
  constructor(private utilsService: UtilsService) {}
  googleTagName: BehaviorSubject<string> = new BehaviorSubject<string>('');
  measurementId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  includeItemScopedVariables: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  isSendingEcommerceData: BehaviorSubject<boolean> =
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

  setIsSendingEcommerceData(isSending: boolean) {
    this.isSendingEcommerceData.next(isSending);
  }

  getIsSendingEcommerceData() {
    return this.isSendingEcommerceData.asObservable();
  }

  generateGtmConfig(
    json: Spec[],
    tagManagerUrl: string,
    containerName: string,
    gtmId: string
  ): GtmConfigGenerator {
    const { accountId, containerId } =
      this.utilsService.extractAccountAndContainerId(tagManagerUrl);

    const gtmConfigGenerator: GtmConfigGenerator = {
      accountId: accountId,
      containerId: containerId,
      containerName: containerName,
      gtmId: gtmId,
      specs: json
    };

    return gtmConfigGenerator;
  }
}
