import { Injectable } from '@angular/core';
import { TagManager } from './managers/tag-manager.service';
import { TriggerManager } from './managers/trigger-manager.service';
import { ConfigManager } from './managers/config-manager.service';
import { DataLayerUtils } from '../utils/data-layer-utils.service';
import { SpecExtractService } from '../extract/spec-extract.service';
import { SpecTransformService } from './spec-transform.service';
import { EventSettingsVariable, GtmConfigGenerator } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class TransformService {
  constructor(
    private tagManager: TagManager,
    private triggerManager: TriggerManager,
    private dataLayerUtils: DataLayerUtils,
    private configManager: ConfigManager,
    private specExtractService: SpecExtractService,
    private specTransformService: SpecTransformService
  ) {}

  convert(
    googleTagName: string,
    measurementId: string,
    gtmConfigGenerator: GtmConfigGenerator,
    includeItemScopedVariable = false,
    isSendingEcommerceData: 'true' | 'false',
    esvContent: EventSettingsVariable[]
  ) {
    try {
      const specs = this.specExtractService.parseAllSpecs(
        gtmConfigGenerator.specs
      );
      const formattedData = this.specTransformService.formatSpecs(specs);

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
}
