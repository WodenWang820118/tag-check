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
    // create a constant for the measurementIdParameter
    // let users define the measurementIdParameter in the GTM UI
    return {
      name: googleTagName,
      type: 'googtag',
      accountId,
      containerId,
      parameter: [
        this.parameterUtils.createTemplateParameter(
          'tagId',
          `{{CONST - Measurement ID}}`
        ),
        this.parameterUtils.createBooleanParameter('sendPageView', 'false'),
        this.parameterUtils.createBooleanParameter(
          'enableSendToServerContainer',
          'false'
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
