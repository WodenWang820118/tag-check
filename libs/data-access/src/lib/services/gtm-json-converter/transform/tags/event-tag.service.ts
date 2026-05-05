import { EventTagConfig, Parameter, Tag, TagTypeEnum, Trigger } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { CONSENT_STATUS_NOT_NEEDED } from '../utils/constant';

@Injectable({
  providedIn: 'root'
})
export class EventTag {
  constructor(private readonly parameterUtils: ParameterUtils) {}

  private processEcommerceData(
    tag: Tag,
    isSendEcommerceData: 'true' | 'false'
  ): Parameter[] {
    if (isSendEcommerceData !== 'true') {
      return tag.parameters;
    }

    return tag.parameters.filter((pm) => {
      return !(typeof pm.value === 'string' && pm.value.includes('ecommerce'));
    });
  }

  createTag(
    googleTagName: string,
    accountId: string,
    containerId: string,
    tag: Tag,
    triggers: Trigger[],
    isSendEcommerceData: 'true' | 'false'
  ): EventTagConfig {
    return {
      name: `GA4 event - ${tag.name}`,
      type: TagTypeEnum.GAAWE,
      accountId,
      containerId,
      parameter: this.buildParameter(googleTagName, tag, isSendEcommerceData),
      firingTriggerId: this.buildTriggerIds(tag, triggers),
      tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: {
        type: 'MAP'
      },
      consentSettings: {
        consentStatus: CONSENT_STATUS_NOT_NEEDED
      }
    };
  }

  private buildParameter(
    googleTagName: string,
    tag: Tag,
    isSendEcommerceData: 'true' | 'false'
  ) {
    return [
      this.parameterUtils.createBooleanParameter(
        'sendEcommerceData',
        isSendEcommerceData
      ),
      this.parameterUtils.createTemplateParameter('eventName', tag.name),
      this.parameterUtils.createListParameter(
        'eventParameters',
        this.processEcommerceData(tag, isSendEcommerceData)
      ),
      this.parameterUtils.createTagReferenceParameter(
        'measurementId',
        googleTagName
      )
    ];
  }

  private buildTriggerIds(tag: Tag, triggers: Trigger[]): string[] {
    return tag.triggers.flatMap((t) =>
      this.parameterUtils.findTriggerIdByEventName(t.name, triggers)
    );
  }
}
