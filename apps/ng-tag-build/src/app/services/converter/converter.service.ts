import { DataLayerManager } from './utilities/data-layer-utils';
import { Injectable } from '@angular/core';
import { exportGtmJSON } from './utilities/configuration-utilities';
import {
  GtmConfigGenerator,
  Tag,
  Trigger,
} from '../../interfaces/gtm-config-generator';
import { formatSingleEventParameters } from './utilities/parameter-formatting-utils';
import { TagManager } from './gtm-json-manager/managers/tag-manager';
import { TriggerManager } from './gtm-json-manager/managers/trigger-manager';
import { getAllObjectPaths } from './utilities/object-path-utils';

@Injectable({
  providedIn: 'root',
})
export class ConverterService {
  // dataLayers stores all variable paths from the input JSON
  tagManager: TagManager;
  triggerManager: TriggerManager;
  dataLayerManager: DataLayerManager;
  // dataLayers: string[] = [];
  triggers: Trigger[] = [];
  tags: Tag[] = [];
  measurementIdCustomJS = '';

  constructor() {
    this.tagManager = new TagManager();
    this.triggerManager = new TriggerManager();
    this.dataLayerManager = new DataLayerManager();
  }

  convert(
    googleTagName: string,
    measurementId: string,
    gtmConfigGenerator: GtmConfigGenerator,
    includeItemScopedVariabled = false
  ) {
    try {
      const specs = this.parseAllSpecs(gtmConfigGenerator.specs);
      const formattedData = specs.map((spec: { [x: string]: any }) => {
        const eventName = spec['event'];

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
        includeItemScopedVariabled
      );
      console.log('dataLayers: ', dataLayers);
      return exportGtmJSON(
        googleTagName,
        measurementId,
        formattedData,
        gtmConfigGenerator.accountId,
        gtmConfigGenerator.containerId,
        gtmConfigGenerator.containerName,
        gtmConfigGenerator.gtmId,
        tags,
        dataLayers,
        triggers
      );
    } catch (error) {
      console.error('error: ', error);
      throw { error };
    }
  }

  // ------------------------------------------------------------
  // general utility
  // ------------------------------------------------------------

  // data parsing

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
