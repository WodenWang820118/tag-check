import { Injectable } from '@angular/core';
import { GtmConfigGenerator, Parameter } from '@utils';
import { TagManager } from './gtm-json-manager/managers/tag-manager.service';
import { TriggerManager } from './gtm-json-manager/managers/trigger-manager.service';
import { ConfigManager } from './gtm-json-manager/managers/config-manager.service';
import { Utils } from './utils/utils.service';
import { EventParameterFormatter } from './utils/event-parameter-formatter.service';
import { DataLayerUtils } from './utils/data-layer-utils.service';

@Injectable({
  providedIn: 'root'
})
export class ConverterService {
  constructor(
    private tagManager: TagManager,
    private triggerManager: TriggerManager,
    private dataLayerUtils: DataLayerUtils,
    private configManager: ConfigManager,
    private utils: Utils,
    private eventParameterFormatter: EventParameterFormatter
  ) {}

  convert(
    googleTagName: string,
    measurementId: string,
    gtmConfigGenerator: GtmConfigGenerator,
    includeItemScopedVariable = false,
    isSendingEcommerceData: 'true' | 'false',
    esvContent: {
      name: string;
      parameters: { [x: string]: string }[];
    }[]
  ) {
    try {
      const specs = this.parseAllSpecs(gtmConfigGenerator.specs);
      const formattedData = this.formatSpecs(specs);

      const triggers = this.triggerManager.getTriggers();
      const tags = this.tagManager.getTags();
      const dataLayers = this.dataLayerUtils.getDataLayers(
        includeItemScopedVariable
      );

      const result = this.configManager.exportGtmJSON(
        googleTagName,
        measurementId,
        formattedData,
        gtmConfigGenerator.accountId,
        gtmConfigGenerator.containerId,
        gtmConfigGenerator.containerName,
        gtmConfigGenerator.gtmId,
        tags,
        dataLayers,
        triggers,
        isSendingEcommerceData,
        esvContent
      );
      return result;
    } catch (error) {
      console.error('An error occurred in ConverterService:', error);
      return null;
    }
  }

  private formatSpecs(
    specs: Record<string, string>[]
  ): { formattedParameters: Parameter[]; eventName: string }[] {
    return specs.map((spec) => {
      const eventName: string = spec['event'];
      const eventParameters = { ...spec };
      delete eventParameters['event'];

      const formattedParameters =
        this.eventParameterFormatter.formatSingleEventParameters(
          JSON.stringify(eventParameters)
        );

      this.triggerManager.formatSingleTrigger(eventName);
      const triggers = this.triggerManager.getTriggers();
      this.tagManager.formatSingleTag(formattedParameters, eventName, triggers);

      return { formattedParameters, eventName };
    });
  }

  private parseAllSpecs(inputString: string): Record<string, string>[] {
    try {
      const allSpecs = JSON.parse(inputString);
      return allSpecs.map(this.parseSpec.bind(this));
    } catch (error) {
      console.error('Error parsing specs:', error);
      throw new Error(
        'Cannot parse JSON. Please revise the format to follow JSON structure rules'
      );
    }
  }

  private parseSpec(
    parsedJSON: Record<string, string>
  ): Record<string, string> {
    if (parsedJSON) {
      const { event, ...json } = parsedJSON;
      const paths = this.utils.getAllObjectPaths(json);
      this.dataLayerUtils.addDataLayer(paths);
      return parsedJSON;
    } else {
      throw new Error('Invalid spec format');
    }
  }
}
