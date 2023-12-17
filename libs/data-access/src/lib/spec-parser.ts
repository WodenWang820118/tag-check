import { read, readFileSync } from 'fs';
import { TagManager } from '../gtm/gtm-json-manager/managers/tag-manager';
import { TriggerManager } from '../gtm/gtm-json-manager/managers/trigger-manager';
import { VariableManger } from '../gtm/gtm-json-manager/managers/variable-manager';
import {
  exportGtmJSON,
  getGTMFinalConfiguration,
} from '../gtm/utilities/configuration-utilities';
import { DataLayerManager } from '../gtm/utilities/data-layer-utils';
import { fixJsonString } from '../gtm/utilities/json-string-utils';
import { getAllObjectPaths } from '../gtm/utilities/object-path-utils';
import { formatSingleEventParameters } from '../gtm/utilities/parameter-formatting-utils';
import { Tag } from '../interfaces/gtm-config';
import { specs } from './spec';

export class SpecParser {
  tagManager: TagManager = new TagManager();
  triggerManager: TriggerManager = new TriggerManager();
  variableManager: VariableManger = new VariableManger();
  dataLayerManager: DataLayerManager = new DataLayerManager();
  includeItemScopedVariables = false;

  parse(spec: string): any {
    let parsedSpec = null;
    try {
      parsedSpec = JSON.parse(fixJsonString(spec));
    } catch (e) {
      console.error('Error parsing spec', e);
    }
    return parsedSpec;
  }

  stringify(spec: any): string {
    return JSON.stringify(spec, null, 2);
  }

  outputGTMSpec(specsContent: string) {
    return this.generateConfig(specsContent);
  }

  generateConfig(specsString: string): any {
    try {
      const specs = this.parseAllSpecs(specsString);
      const formattedData = specs.map((spec: { [x: string]: any }) => {
        const eventName = spec['event'];

        // TODO: maybe we can improve the implementation
        const eventParameters = { ...spec }; // copy of spec
        delete eventParameters['event'];

        const formattedParameters = formatSingleEventParameters(
          JSON.stringify(eventParameters)
        );

        this.triggerManager.formatSingleTrigger(eventName);
        const triggers = this.triggerManager.getTriggers();

        this.tagManager.formatSingleTag(
          formattedParameters,
          eventName,
          triggers
        );

        return { formattedParameters, eventName };
      });

      // get all necesssary data for export
      const triggers = this.triggerManager.getTriggers();
      const tags = this.tagManager.getTags();
      const dataLayers = this.dataLayerManager.getDataLayers(
        this.includeItemScopedVariables
      );
      console.log('dataLayers: ', dataLayers);
      const configurationName = 'GA4 Configuration'; // necessary to generate a configuration tag
      const accountId = '123456789';
      const containerId = '1234567890';
      const containerName = 'GA4 Container';
      const gtmId = 'GTM-1234567';
      return exportGtmJSON(
        configurationName,
        formattedData,
        accountId,
        containerId,
        containerName,
        gtmId,
        tags,
        dataLayers,
        triggers
      );
    } catch (error) {
      console.error('error: ', error);
      throw { error };
    }
  }

  parseAllSpecs(inputString: string) {
    const allSpecs = JSON.parse(inputString);
    // Using 'map' to apply the 'parseSpec' function to each object in the 'allSpecs' array
    // 'bind(this)' is used to ensure that 'this' inside 'parseSpec' refers to the class instance
    // When passing a method like 'parseSpec' as a callback, the context of 'this' is lost
    // Using 'bind(this)', the context is preserved and 'this' inside 'parseSpec' still refers to the class instance
    return allSpecs.map(this.parseSpec.bind(this));
  }

  parseSpec(parsedJSON: Record<string, string>) {
    if (parsedJSON) {
      const { event, ...Json } = parsedJSON;

      // the paths is for building data layer variables
      const paths = getAllObjectPaths(Json);
      this.dataLayerManager.addDataLayer(paths);

      return parsedJSON;
    } else {
      // If JSON parsing fails, throw an error.
      throw new Error(
        'Cannot parse JSON. Please revise the format to follow JSON structure rules'
      );
    }
  }
}
