import { GoogleTagConfig, TagTypeEnum } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleTag {
  // Extracted constants
  private static readonly DEFAULT_TRIGGER_ID = '2147479553';
  private static readonly TAG_FIRING_OPTION = 'ONCE_PER_EVENT';
  private static readonly MONITORING_METADATA_TYPE = 'MAP';
  private static readonly CONSENT_STATUS = 'NOT_SET';
  private static readonly MEASUREMENT_ID_TEMPLATE =
    '{{CONST - Measurement ID}}';

  constructor(private readonly parameterUtils: ParameterUtils) {}
  createGA4Configuration(
    googleTagName: string,
    measurementId: string,
    accountId: string,
    containerId: string
  ): GoogleTagConfig {
    // create a constant for the measurementIdParameter
    // let users define the measurementIdParameter in the GTM UI
    return {
      name: googleTagName,
      type: TagTypeEnum.GOOGLE_TAG,
      accountId,
      containerId,
      parameter: this.buildParameters(),
      firingTriggerId: [GoogleTag.DEFAULT_TRIGGER_ID],
      tagFiringOption: GoogleTag.TAG_FIRING_OPTION,
      monitoringMetadata: {
        type: GoogleTag.MONITORING_METADATA_TYPE
      },
      consentSettings: {
        consentStatus: GoogleTag.CONSENT_STATUS
      }
    };
  }

  private buildParameters() {
    return [
      this.parameterUtils.createTemplateParameter(
        'tagId',
        GoogleTag.MEASUREMENT_ID_TEMPLATE
      ),
      this.parameterUtils.createBooleanParameter('sendPageView', 'false'),
      this.parameterUtils.createBooleanParameter(
        'enableSendToServerContainer',
        'false'
      )
    ];
  }
}
