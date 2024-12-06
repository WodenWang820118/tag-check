import { Tag, TagConfig, TriggerConfig } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../parameter-utils.service';
import { EcParamsService } from '../../utils/ec-params.service';

interface TagCreationParams {
  googleTagName: string;
  accountId: string;
  containerId: string;
  tag: Tag;
  dataLayers: string[];
  triggers: TriggerConfig[];
  isSendEcommerceData: 'true' | 'false';
}

@Injectable({
  providedIn: 'root'
})
export class EventTag {
  constructor(
    private parameterUtils: ParameterUtils,
    private ecParamsService: EcParamsService
  ) {}

  createTag(
    googleTagName: string,
    accountId: string,
    containerId: string,
    tag: Tag,
    dataLayers: string[],
    triggers: TriggerConfig[],
    isSendEcommerceData: 'true' | 'false'
  ): TagConfig {
    const processedData = this.processEcommerceData(
      dataLayers,
      tag,
      isSendEcommerceData
    );

    return this.buildTagConfig({
      googleTagName,
      accountId,
      containerId,
      tag,
      triggers,
      isSendEcommerceData,
      ...processedData
    });
  }

  private processEcommerceData(
    dataLayers: string[],
    tag: Tag,
    isSendEcommerceData: 'true' | 'false'
  ) {
    if (isSendEcommerceData !== 'true') {
      return { dataLayers, parameters: tag.parameters };
    }

    const filteredDataLayers = dataLayers.filter(
      (layer) =>
        !layer.startsWith('ecommerce') && !this.ecParamsService.getEcParams()
    );

    const filteredParameters = tag.parameters.filter(
      (param) =>
        !param.key.startsWith('ecommerce') &&
        !this.ecParamsService.getEcParams().includes(param.key)
    );

    return {
      dataLayers: filteredDataLayers,
      parameters: filteredParameters
    };
  }

  private buildTagConfig(
    config: TagCreationParams & { parameters: any[] }
  ): TagConfig {
    const {
      googleTagName,
      accountId,
      containerId,
      tag,
      dataLayers,
      triggers,
      isSendEcommerceData,
      parameters
    } = config;

    return {
      name: `GA4 event - ${tag.name}`,
      type: 'gaawe',
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
          dataLayers,
          parameters
        ),
        this.parameterUtils.createTagReferenceParameter(
          'measurementId',
          googleTagName
        )
      ],
      firingTriggerId: tag.triggers.map((t) =>
        this.parameterUtils.findTriggerIdByEventName(t.name, triggers)
      ),
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
