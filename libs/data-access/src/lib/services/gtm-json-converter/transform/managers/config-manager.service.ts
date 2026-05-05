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
  // --- GTM export constants ---
  private static readonly EXPORT_FORMAT_VERSION = 2;
  private static readonly CONTAINER_VERSION_ID = '0';
  private static readonly USAGE_CONTEXT = ['WEB'] as const;

  // Fingerprints are stable identifiers used by GTM exports
  private static readonly CONTAINER_FINGERPRINT = '1690281340453';
  private static readonly VERSION_FINGERPRINT = '1690374452646';

  // Feature flags describing container capabilities
  private static readonly DEFAULT_FEATURES = {
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
  } as const;

  private static readonly TAG_MANAGER_BASE_URL =
    'https://tagmanager.google.com/#/container/accounts';

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
      exportFormatVersion: ConfigManager.EXPORT_FORMAT_VERSION,
      exportTime: this.utilsService.outputTime(),
      containerVersion: {
        path: `accounts/${accountId}/containers/${containerId}/versions/0`,
        accountId: `${accountId}`,
        containerId: `${containerId}`,
        containerVersionId: ConfigManager.CONTAINER_VERSION_ID,
        container: {
          path: `accounts/${accountId}/containers/${containerId}`,
          accountId: `${accountId}`,
          containerId: `${containerId}`,
          name: containerName,
          publicId: gtmId,
          usageContext: [...ConfigManager.USAGE_CONTEXT],
          fingerprint: ConfigManager.CONTAINER_FINGERPRINT,
          tagManagerUrl: `${ConfigManager.TAG_MANAGER_BASE_URL}/${accountId}/containers/${containerId}/workspaces?apiLink=container`,
          features: { ...ConfigManager.DEFAULT_FEATURES },
          tagIds: [gtmId]
        },
        variable: variables,
        builtInVariable: builtInVariables,
        trigger: triggers,
        tag: tags,
        fingerprint: ConfigManager.VERSION_FINGERPRINT,
        tagManagerUrl: `https://tagmanager.google.com/#/versions/accounts/${accountId}/containers/${containerId}/versions/0?apiLink=version`
      }
    };
  }
}
