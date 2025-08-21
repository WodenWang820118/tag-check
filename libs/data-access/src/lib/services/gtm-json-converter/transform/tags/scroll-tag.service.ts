import { EventTagConfig, TagTypeEnum, Trigger, DataLayer } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { EventUtils } from '../../utils/event-utils.service';

@Injectable({
  providedIn: 'root'
})
export class ScrollTag {
  // Constants for easier maintenance
  private static readonly TRIGGER_NAME = 'event scroll';
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
    configurationName: string,
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
          this.parameterUtils.createBuiltInListParameter('eventParameters', [
            this.parameterUtils.createMapParameter(
              ScrollTag.SCROLL_DEPTH_KEY,
              ScrollTag.SCROLL_DEPTH_VAR
            )
          ]),
          this.parameterUtils.createTagReferenceParameter(
            'measurementId',
            configurationName
          )
        ],
        fingerprint: ScrollTag.FINGERPRINT,
        firingTriggerId: [triggerId],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      }
    ];
  }

  /**
   * Creates scroll tag(s) if scroll events are present in dataLayers
   * @param configurationName GTM configuration tag reference
   * @param accountId GTM account ID
   * @param containerId GTM container ID
   * @param triggers Available triggers to match
   * @param dataLayers DataLayer events to inspect
   */
  public createScrollTag(
    configurationName: string,
    accountId: string,
    containerId: string,
    triggers: Trigger[],
    dataLayers: DataLayer[] = []
  ): EventTagConfig[] {
    // Only proceed if scroll event is included
    if (!this.eventUtils.isIncludeScroll(dataLayers)) {
      return [];
    }
    // Find the scroll trigger
    const trigger = triggers.find((t) => t.name === ScrollTag.TRIGGER_NAME);
    if (!trigger?.triggerId) {
      console.error(`Missing trigger (${ScrollTag.TRIGGER_NAME}) or triggerId`);
      return [];
    }
    // Build and return the tag configuration
    return this.buildScrollTag(
      configurationName,
      accountId,
      containerId,
      trigger.triggerId
    );
  }
}
