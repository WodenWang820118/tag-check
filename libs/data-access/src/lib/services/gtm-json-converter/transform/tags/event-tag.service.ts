import { EventTagConfig, Parameter, Tag, TagTypeEnum, Trigger } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { EcParamsService } from '../../utils/ec-params.service';

@Injectable({
  providedIn: 'root'
})
export class EventTag {
  constructor(
    private parameterUtils: ParameterUtils,
    private ecParamsService: EcParamsService
  ) {}

  private processEcommerceData(
    tag: Tag,
    isSendEcommerceData: 'true' | 'false'
  ): Parameter[] {
    if (isSendEcommerceData !== 'true') {
      return tag.parameters;
    }

    return tag.parameters.filter((pm) => {
      return !(pm.value as any).includes('ecommerce');
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
      parameter: [
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
      ],
      firingTriggerId: tag.triggers
        .map((t) =>
          this.parameterUtils.findTriggerIdByEventName(t.name, triggers)
        )
        .flat(),
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
