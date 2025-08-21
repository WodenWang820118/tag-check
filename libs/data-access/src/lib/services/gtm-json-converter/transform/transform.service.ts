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

  /**
   * Orchestrates managers to build a GTM container configuration.
   */
  convert({
    googleTagName,
    measurementId,
    gtmConfigGenerator,
    isSendingEcommerceData,
    esvContent
  }: ConvertOptions): GTMFinalConfig {
    try {
      const { accountId, containerId, containerName, gtmId, specs } =
        gtmConfigGenerator;

      const dataLayers = this.dataLayerUtils.getDataLayers(specs);

      const variables = this.variableManager.getVariables({
        accountId,
        containerId,
        measurementId,
        dataLayers,
        esvContent
      });

      const builtInVariables = this.variableManager.getBuiltInVariables({
        accountId,
        containerId,
        dataLayers
      });

      const triggers = this.triggerManager.getTriggers(
        accountId,
        containerId,
        dataLayers
      );

      // Avoid recomputing trigger structures used by tags
      const createdTriggers = this.triggerManager.createTriggers(dataLayers);

      const tags = this.tagManager.getTags(
        accountId,
        containerId,
        dataLayers,
        createdTriggers,
        googleTagName,
        measurementId,
        isSendingEcommerceData
      );

      return this.configManager.getGTMFinalConfiguration({
        accountId,
        containerId,
        variables,
        builtInVariables,
        triggers,
        tags,
        containerName,
        gtmId
      } as GTMFinalConfigurationOptions);
    } catch (error) {
      // Preserve the original error for better diagnostics
      console.error('[TransformService] Failed to convert GTM JSON:', error);
      throw error;
    }
  }
}

/**
 * Input contract for convert(). Groups parameters to keep the API stable and readable.
 */
export interface ConvertOptions {
  googleTagName: string;
  measurementId: string;
  gtmConfigGenerator: GTMContainerConfig;
  isSendingEcommerceData: 'true' | 'false';
  esvContent: EventSettingsVariable[];
}

// Inferred return type based on ConfigManager.getGTMFinalConfiguration
type GTMFinalConfig = ReturnType<ConfigManager['getGTMFinalConfiguration']>;
