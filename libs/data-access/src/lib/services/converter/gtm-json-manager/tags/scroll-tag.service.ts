import { Parameter, TagConfig, TriggerConfig } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../parameter-utils.service';
import { EventUtils } from '../../utils/event-utils.service';

@Injectable({
  providedIn: 'root',
})
export class ScrollTag {
  constructor(
    private parameterUtils: ParameterUtils,
    private eventUtils: EventUtils
  ) {}
  scrollTag(
    configurationName: string,
    accountId: string,
    containerId: string,
    triggerId: string
  ): TagConfig[] {
    return [
      {
        accountId,
        containerId,
        name: 'GA4 event - scroll',
        type: 'gaawe',
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
            ),
          ]),
          this.parameterUtils.createTagReferenceParameter(
            'measurementId',
            configurationName
          ),
        ],
        fingerprint: '1690184079241',
        firingTriggerId: [triggerId],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP',
        },
        consentSettings: {
          consentStatus: 'NOT_SET',
        },
      },
    ];
  }

  createScrollTag(
    configurationName: string,
    accountId: string,
    containerId: string,
    data: {
      formattedParameters: Parameter[];
      eventName: string;
    }[],
    triggers: TriggerConfig[]
  ) {
    try {
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
