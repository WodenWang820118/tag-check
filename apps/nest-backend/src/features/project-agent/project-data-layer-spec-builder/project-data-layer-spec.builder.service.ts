import { Injectable, Logger } from '@nestjs/common';
import {
  Spec,
  StrictDataLayerEvent,
  getParameterListItems,
  getParameterMapValue,
  getParameterValue
} from '@utils';

@Injectable()
export class ProjectDataLayerSpecBuilderService {
  private readonly logger = new Logger(ProjectDataLayerSpecBuilderService.name);
  buildDataLayerSpec(spec: Spec): StrictDataLayerEvent {
    // 1) Resolve event name from tag parameters, fallback to tag name suffix
    const eventNameParam = getParameterValue(spec.tag.parameter, 'eventName');

    if (!eventNameParam) {
      this.logger.warn(`No eventName found for spec=${JSON.stringify(spec)}`);
      throw new Error('eventName is required in spec');
    }

    const result: StrictDataLayerEvent = {
      event: eventNameParam
    };

    // 2) Build ecommerce from eventSettingsTable -> LIST of MAPs with
    //    TEMPLATE entries: { key: 'parameter', value: '<field>' }
    //                      { key: 'parameterValue', value: '<template or literal>' }
    const eventSettings = spec.tag.parameter.find(
      (p) => p.key === 'eventSettingsTable' && p.type === 'LIST'
    );

    if (!eventSettings) {
      return result; // No ecommerce mapping
    }

    // Use a flexible record to allow template strings for values, including items
    const ecommerce: Record<string, unknown> = {};

    for (const entry of getParameterListItems(eventSettings)) {
      const paramName = getParameterMapValue(entry, 'parameter');
      const paramValueTpl = getParameterMapValue(entry, 'parameterValue');
      // Only map when both parameter and parameterValue exist
      if (!paramName || typeof paramName !== 'string') continue;
      if (typeof paramValueTpl !== 'string' || paramValueTpl.length === 0)
        continue;
      // Use parameterValue verbatim (can be template like "{{DLV - ecommerce.xxx}}" or other)
      ecommerce[paramName] = paramValueTpl;
    }

    if (Object.keys(ecommerce).length > 0) {
      // Cast to BaseECommerce for compatibility with StrictDataLayerEvent typing
      result.ecommerce =
        ecommerce as unknown as StrictDataLayerEvent['ecommerce'];
    }
    return result;
  }
}
