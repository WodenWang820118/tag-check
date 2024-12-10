import {
  Parameter,
  Tag,
  TagConfig,
  Trigger,
  TriggerConfig,
  VariableConfig
} from '@utils';
import { TagManager } from './tag-manager.service';
import { VariableManger } from './variable-manager.service';
import { Injectable } from '@angular/core';
import { TriggerManager } from './trigger-manager.service';
import { Utils } from '../../utils/utils.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigManager {
  constructor(
    private tagManager: TagManager,
    private variableManager: VariableManger,
    private triggerManager: TriggerManager,
    private utils: Utils
  ) {}
  getGTMFinalConfiguration(
    accountId: string,
    containerId: string,
    variables: VariableConfig[],
    triggers: TriggerConfig[],
    tags: TagConfig[],
    builtInVariable: VariableConfig[],
    containerName: string,
    gtmId: string
  ) {
    return {
      exportFormatVersion: 2,
      exportTime: this.utils.outputTime(),
      containerVersion: {
        path: `accounts/${accountId}/containers/${containerId}/versions/0`,
        accountId: `${accountId}`,
        containerId: `${containerId}`,
        containerVersionId: '0',
        container: {
          path: `accounts/${accountId}/containers/${containerId}`,
          accountId: `${accountId}`,
          containerId: `${containerId}`,
          name: containerName,
          publicId: gtmId,
          usageContext: ['WEB'],
          fingerprint: '1690281340453',
          tagManagerUrl: `https://tagmanager.google.com/#/container/accounts/${accountId}/containers/${containerId}/workspaces?apiLink=container`,
          features: {
            supportUserPermissions: true,
            supportEnvironments: true,
            supportWorkspaces: true,
            supportGtagConfigs: false,
            supportBuiltInVariables: true,
            supportClients: false,
            supportFolders: true,
            supportTags: true,
            supportTemplates: true,
            supportTriggers: true,
            supportVariables: true,
            supportVersions: true,
            supportZones: true,
            supportTransformations: false
          },
          tagIds: [gtmId]
        },
        builtInVariable,
        variable: variables,
        trigger: triggers,
        tag: tags,
        fingerprint: '1690374452646',
        tagManagerUrl: `https://tagmanager.google.com/#/versions/accounts/${accountId}/containers/${containerId}/versions/0?apiLink=version`
      }
    };
  }

  exportGtmJSON(
    googleTagName: string,
    measurementId: string,
    data: {
      formattedParameters: Parameter[];
      eventName: string;
    }[],
    accountId: string,
    containerId: string,
    containerName: string,
    gtmId: string,
    tags: Tag[],
    dataLayers: string[],
    triggers: Trigger[],
    isSendingEcommerceData: 'true' | 'false',
    esvContent: {
      name: string;
      parameters: { [x: string]: string }[];
    }[]
  ) {
    const _variable = this.variableManager.getVariables(
      accountId,
      containerId,
      data,
      dataLayers,
      esvContent
    );
    console.log('variables', _variable);
    const _triggers = this.triggerManager.getTriggerConfig(
      accountId,
      containerId,
      data,
      triggers
    );
    const _tags = this.tagManager.getAllTags(
      googleTagName,
      measurementId,
      accountId,
      containerId,
      data,
      _triggers,
      tags,
      dataLayers,
      isSendingEcommerceData,
      esvContent
    );
    const builtInVariable = this.variableManager.getBuiltInVariables(
      accountId,
      containerId,
      data
    );

    return this.getGTMFinalConfiguration(
      accountId,
      containerId,
      _variable,
      _triggers,
      _tags,
      builtInVariable,
      containerName,
      gtmId
    );
  }
}
