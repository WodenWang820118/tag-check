import { EventTagConfig, TagTypeEnum, Trigger, DataLayer } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { EventUtils } from '../../utils/event-utils.service';
import {
  CONSENT_STATUS_NOT_NEEDED,
  MEASUREMENT_ID_VARIABLE_NAME,
  SCROLL_TRIGGER_NAME
} from '../utils/constant';

/**
 * Builds the GA4 scroll event tag, fired by the Scroll Depth trigger with
 * the threshold reached as a parameter.
 */
@Injectable({
  providedIn: 'root'
})
export class ScrollTag {
  private static readonly TRIGGER_NAME = SCROLL_TRIGGER_NAME;
  private static readonly TAG_NAME = 'GA4 event - scroll';
  private static readonly EVENT_NAME = 'scroll';
  private static readonly FINGERPRINT = '1690184079241';
  private static readonly SCROLL_DEPTH_KEY = 'scroll_depth_threshold';
  private static readonly SCROLL_DEPTH_VAR = '{{Scroll Depth Threshold}}';

  constructor(
    private readonly parameterUtils: ParameterUtils,
    private readonly eventUtils: EventUtils
  ) {}
  // Build the scroll tag configuration
  private buildScrollTag(
    accountId: string,
    containerId: string,
    triggerId: string
  ): EventTagConfig[] {
    return [
      {
        accountId,
        containerId,
        name: ScrollTag.TAG_NAME,
        type: TagTypeEnum.GAAWE,
        parameter: [
          this.parameterUtils.createBooleanParameter(
            'sendEcommerceData',
            'false'
          ),
          this.parameterUtils.createTemplateParameter(
            'eventName',
            ScrollTag.EVENT_NAME
          ),
          this.parameterUtils.createBuiltInListParameter('eventSettingsTable', [
            this.parameterUtils.createMapParameter(
              ScrollTag.SCROLL_DEPTH_KEY,
              ScrollTag.SCROLL_DEPTH_VAR
            )
          ]),
          // The event tag's Measurement ID field, as Tag Manager exports it.
          this.parameterUtils.createTemplateParameter(
            'measurementIdOverride',
            `{{${MEASUREMENT_ID_VARIABLE_NAME}}}`
          )
        ],
        fingerprint: ScrollTag.FINGERPRINT,
        firingTriggerId: [triggerId],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: CONSENT_STATUS_NOT_NEEDED
        }
      }
    ];
  }

  /**
   * Creates the scroll tag when a data layer event is `scroll`, or an empty
   * array otherwise or when the `event scroll` trigger is missing.
   * @param configurationName name of the Google tag; not used, because the
   * event tag sets its measurement ID directly
   * @param accountId GTM account ID
   * @param containerId GTM container ID
   * @param triggers trigger names and IDs to find the Scroll Depth trigger in
   * @param dataLayers DataLayer events to inspect
   */
  public createScrollTag(
    configurationName: string,
    accountId: string,
    containerId: string,
    triggers: Trigger[],
    dataLayers: DataLayer[] = []
  ): EventTagConfig[] {
    if (!this.eventUtils.isIncludeScroll(dataLayers)) {
      return [];
    }
    const trigger = triggers.find((t) => t.name === ScrollTag.TRIGGER_NAME);
    if (!trigger?.triggerId) {
      console.error(`Missing trigger (${ScrollTag.TRIGGER_NAME}) or triggerId`);
      return [];
    }
    return this.buildScrollTag(accountId, containerId, trigger.triggerId);
  }
}
