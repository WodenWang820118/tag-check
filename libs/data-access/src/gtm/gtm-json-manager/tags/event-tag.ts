import {
  Tag,
  TagConfig,
  TriggerConfig,
} from '../../../../interfaces/gtm-config-generator';
import {
  createTemplateParameter,
  createListParameter,
  createTagReferenceParameter,
  findTriggerIdByEventName,
  createBooleanParameter,
} from '../parameter-utils';

export function createTag(
  configurationName: string,
  accountId: string,
  containerId: string,
  tag: Tag,
  dataLayers: string[],
  triggers: TriggerConfig[]
): TagConfig {
  // TODO: the dataLayers are nested paths, such as 'ecommerce.items'
  // However, the tag.parameters are not nested, such as 'items'
  // So, I've used the workaround to build it in the utilities.ts, adding the prefix 'ecommerce.'
  // console.log('dataLayers', dataLayers);
  return {
    name: `GA4 event - ${tag.name}`,
    type: 'gaawe',
    accountId,
    containerId,
    parameter: [
      createBooleanParameter('sendEcommerceData', 'false'),
      createTemplateParameter('eventName', tag.name),
      createListParameter('eventParameters', dataLayers, tag.parameters),
      createTagReferenceParameter('measurementId', configurationName),
    ],
    firingTriggerId: tag.triggers.map((t) =>
      findTriggerIdByEventName(t.name, triggers)
    ),
  };
}
