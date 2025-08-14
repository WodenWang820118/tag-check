import { Injectable } from '@angular/core';
import { TagManager } from './managers/tag-manager.service';
import { TriggerManager } from './managers/trigger-manager.service';
import {
  ConfigManager,
  GTMFinalConfigurationOptions
} from './managers/config-manager.service';
import { DataLayerUtils } from '../utils/data-layer-utils.service';
import { EventSettingsVariable, GTMContainerConfig } from '@utils';
import { VariableManager } from './managers/variable-manager.service';

@Injectable({
  providedIn: 'root'
})
export class TransformService {
  constructor(
    private readonly configManager: ConfigManager,
    private readonly tagManager: TagManager,
    private readonly triggerManager: TriggerManager,
    private readonly variableManager: VariableManager,
    private readonly dataLayerUtils: DataLayerUtils
  ) {}

  convert(
    googleTagName: string,
    measurementId: string,
    gtmConfigGenerator: GTMContainerConfig,
    isSendingEcommerceData: 'true' | 'false',
    esvContent: EventSettingsVariable[]
  ) {
    try {
      const dataLayers = this.dataLayerUtils.getDataLayers(
        gtmConfigGenerator.specs
      );

      const variables = this.variableManager.getVariables(
        gtmConfigGenerator.accountId,
        gtmConfigGenerator.containerId,
        measurementId,
        dataLayers,
        esvContent
      );

      const builtInVariables = this.variableManager.getBuiltInVariables(
        gtmConfigGenerator.accountId,
        gtmConfigGenerator.containerId,
        dataLayers
      );

      const triggers = this.triggerManager.getTriggers(
        gtmConfigGenerator.accountId,
        gtmConfigGenerator.containerId,
        dataLayers
      );

      const tags = this.tagManager.getTags(
        gtmConfigGenerator.accountId,
        gtmConfigGenerator.containerId,
        dataLayers,
        this.triggerManager.createTriggers(dataLayers),
        googleTagName,
        measurementId,
        isSendingEcommerceData
      );

      const result = this.configManager.getGTMFinalConfiguration({
        accountId: gtmConfigGenerator.accountId,
        containerId: gtmConfigGenerator.containerId,
        variables,
        builtInVariables,
        triggers,
        tags,
        containerName: gtmConfigGenerator.containerName,
        gtmId: gtmConfigGenerator.gtmId
      } as GTMFinalConfigurationOptions);
      return result;
    } catch (error) {
      console.error('An error occurred in ConverterService:', error);
      throw new Error('Failed to convert the JSON');
    }
  }
}
