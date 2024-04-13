import {
  Tag,
  TagConfig,
  Trigger,
  TriggerConfig,
  VariableConfig,
} from '../../../interfaces/gtm-config-generator';
import { TagManager } from '../gtm-json-manager/managers/tag-manager';
import { VariableManger } from '../gtm-json-manager/managers/variable-manager';
import { getTriggers } from '../gtm-json-manager/triggers/trigger-utilities';
import { outputTime } from './date-utils';

const variableManager = new VariableManger();
const tagManager = new TagManager();

export function getGTMFinalConfiguration(
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
    exportTime: outputTime(),
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
          supportTransformations: false,
        },
        tagIds: [gtmId],
      },
      builtInVariable,
      variable: variables,
      trigger: triggers,
      tag: tags,
      fingerprint: '1690374452646',
      tagManagerUrl: `https://tagmanager.google.com/#/versions/accounts/${accountId}/containers/${containerId}/versions/0?apiLink=version`,
    },
  };
}

export function exportGtmJSON(
  googleTagName: string,
  measurementId: string,
  data: Record<string, string>[],
  accountId: string,
  containerId: string,
  containerName: string,
  gtmId: string,
  tags: Tag[],
  dataLayers: string[],
  triggers: Trigger[]
) {
  const _variable = variableManager.getVariables(
    accountId,
    containerId,
    dataLayers
  );
  const _triggers = getTriggers(accountId, containerId, data, triggers);
  const _tags = tagManager.getAllTags(
    googleTagName,
    measurementId,
    accountId,
    containerId,
    data,
    _triggers,
    tags,
    dataLayers
  );
  const builtInVariable = variableManager.getBuiltInVariables(
    accountId,
    containerId,
    data
  );

  return getGTMFinalConfiguration(
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
