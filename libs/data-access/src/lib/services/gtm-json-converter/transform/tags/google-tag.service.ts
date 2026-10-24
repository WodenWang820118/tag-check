import { GoogleTagConfig, TagTypeEnum } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';
import {
  CONSENT_STATUS_NOT_NEEDED,
  MEASUREMENT_ID_VARIABLE_NAME
} from '../utils/constant';

/** Builds the Google tag (`googtag`) every other tag in the container needs. */
@Injectable({
  providedIn: 'root'
})
export class GoogleTag {
  /** GTM's built-in "All Pages" trigger. */
  private static readonly DEFAULT_TRIGGER_ID = '2147479553';
  private static readonly TAG_FIRING_OPTION = 'ONCE_PER_EVENT';
  private static readonly MONITORING_METADATA_TYPE = 'MAP';
  private static readonly CONSENT_STATUS = CONSENT_STATUS_NOT_NEEDED;
  private static readonly MEASUREMENT_ID_TEMPLATE = `{{${MEASUREMENT_ID_VARIABLE_NAME}}}`;

  constructor(private readonly parameterUtils: ParameterUtils) {}

  /**
   * Creates the Google tag. Its tag ID reads the measurement ID Constant
   * variable, so users change the ID in one place in the GTM UI;
   * `measurementId` itself goes into that variable, not into the tag.
   */
  createGA4Configuration(
    googleTagName: string,
    measurementId: string,
    accountId: string,
    containerId: string
  ): GoogleTagConfig {
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
