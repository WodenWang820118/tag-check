import {
  GTMConfiguration,
  TagConfig,
  TriggerConfig,
  VariableConfig
} from '@utils';
import { Injectable } from '@angular/core';
import { UtilsService } from '../../utils/utils.service';

export interface GTMFinalConfigurationOptions {
  accountId: string;
  containerId: string;
  variables: VariableConfig[];
  builtInVariables: VariableConfig[];
  triggers: TriggerConfig[];
  tags: TagConfig[];
  containerName: string;
  gtmId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigManager {
  constructor(private readonly utilsService: UtilsService) {}

  getGTMFinalConfiguration(
    options: GTMFinalConfigurationOptions
  ): GTMConfiguration {
    const {
      accountId,
      containerId,
      variables,
      builtInVariables,
      triggers,
      tags,
      containerName,
      gtmId
    } = options;

    return {
      exportFormatVersion: 2,
      exportTime: this.utilsService.outputTime(),
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
        variable: variables,
        builtInVariable: builtInVariables,
        trigger: triggers,
        tag: tags,
        fingerprint: '1690374452646',
        tagManagerUrl: `https://tagmanager.google.com/#/versions/accounts/${accountId}/containers/${containerId}/versions/0?apiLink=version`
      }
    };
  }
}
