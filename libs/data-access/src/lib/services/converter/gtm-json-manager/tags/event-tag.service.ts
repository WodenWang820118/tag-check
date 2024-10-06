import { Tag, TagConfig, TriggerConfig } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../parameter-utils.service';

@Injectable({
  providedIn: 'root',
})
export class EventTag {
  constructor(private parameterUtils: ParameterUtils) {}
  createTag(
    googleTagName: string,
    accountId: string,
    containerId: string,
    tag: Tag,
    dataLayers: string[],
    triggers: TriggerConfig[]
  ): TagConfig {
    return {
      name: `GA4 event - ${tag.name}`,
      type: 'gaawe',
      accountId,
      containerId,
      parameter: [
        this.parameterUtils.createBooleanParameter(
          'sendEcommerceData',
          'false'
        ),
        this.parameterUtils.createTemplateParameter('eventName', tag.name),
        this.parameterUtils.createListParameter(
          'eventParameters',
          dataLayers,
          tag.parameters
        ),
        this.parameterUtils.createTagReferenceParameter(
          'measurementId',
          googleTagName
        ),
      ],
      firingTriggerId: tag.triggers.map((t) =>
        this.parameterUtils.findTriggerIdByEventName(t.name, triggers)
      ),
      tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: {
        type: 'MAP',
      },
      consentSettings: {
        consentStatus: 'NOT_SET',
      },
    };
  }
}
