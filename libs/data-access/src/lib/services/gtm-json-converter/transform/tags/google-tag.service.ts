import { TagConfig } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleTag {
  constructor(private parameterUtils: ParameterUtils) {}
  createGA4Configuration(
    googleTagName: string,
    measurementId: string,
    accountId: string,
    containerId: string
  ): TagConfig {
    const measurementIdParameter = measurementId
      ? measurementId
      : '{{Measurement ID}}';
    return {
      name: googleTagName,
      type: 'gaawc',
      accountId,
      containerId,
      parameter: [
        this.parameterUtils.createBooleanParameter('sendPageView', 'false'),
        this.parameterUtils.createBooleanParameter(
          'enableSendToServerContainer',
          'false'
        ),
        this.parameterUtils.createTemplateParameter(
          'measurementId',
          `${measurementIdParameter}`
        )
      ],
      firingTriggerId: ['2147479553'],
      tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: {
        type: 'MAP'
      },
      consentSettings: {
        consentStatus: 'NOT_SET'
      }
    };
  }
}
