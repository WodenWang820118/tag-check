import { EventTagConfig, TagTypeEnum, Trigger } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { EventUtils } from '../../utils/event-utils.service';

@Injectable({
  providedIn: 'root'
})
export class ScrollTag {
  constructor(
    private readonly parameterUtils: ParameterUtils,
    private readonly eventUtils: EventUtils
  ) {}
  scrollTag(
    configurationName: string,
    accountId: string,
    containerId: string,
    triggerId: string
  ): EventTagConfig[] {
    return [
      {
        accountId,
        containerId,
        name: 'GA4 event - scroll',
        type: TagTypeEnum.GAAWE,
        parameter: [
          this.parameterUtils.createBooleanParameter(
            'sendEcommerceData',
            'false'
          ),
          this.parameterUtils.createTemplateParameter('eventName', 'scroll'),
          this.parameterUtils.createBuiltInListParameter('eventParameters', [
            this.parameterUtils.createMapParameter(
              'scroll_depth_threshold',
              '{{Scroll Depth Threshold}}'
            )
          ]),
          this.parameterUtils.createTagReferenceParameter(
            'measurementId',
            configurationName
          )
        ],
        fingerprint: '1690184079241',
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

  createScrollTag(
    configurationName: string,
    accountId: string,
    containerId: string,
    triggers: Trigger[]
  ) {
    try {
      // TODO: get the information whether the scroll is included in the data
      const data = [] as any;
      if (!this.eventUtils.isIncludeScroll(data)) {
        return [];
      }

      const trigger = triggers.find(
        (trigger) => trigger.name === 'event scroll'
      );
      if (!trigger || !trigger.triggerId) {
        throw new Error("Couldn't find matching trigger for scroll tag");
      }

      return this.scrollTag(
        configurationName,
        accountId,
        containerId,
        trigger.triggerId as string
      );
    } catch (error) {
      console.error('Error while creating scroll tag:', error);
      // Potentially re-throw the error if it should be handled upstream
      // throw error;
      return [];
    }
  }
}
