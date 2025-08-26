import { TagConfig } from './tag.type';
import { TriggerConfig } from './trigger.type';
import { VariableConfig } from './variable.type';

export type GTMFeatures = {
  supportUserPermissions: boolean;
  supportEnvironments: boolean;
  supportWorkspaces: boolean;
  supportGtagConfigs: boolean;
  supportBuiltInVariables: boolean;
  supportClients: boolean;
  supportFolders: boolean;
  supportTags: boolean;
  supportTemplates: boolean;
  supportTriggers: boolean;
  supportVariables: boolean;
  supportVersions: boolean;
  supportZones: boolean;
  supportTransformations: boolean;
};

export type GTMContainer = {
  path: string;
  accountId: string;
  containerId: string;
  name: string;
  publicId: string;
  usageContext: string[];
  fingerprint: string;
  tagManagerUrl: string;
  features: GTMFeatures;
  tagIds: string[];
};

export type GTMContainerVersion = {
  path: string;
  accountId: string;
  containerId: string;
  containerVersionId: string;
  container: GTMContainer;
  variable: VariableConfig[];
  builtInVariable: VariableConfig[];
  trigger: TriggerConfig[];
  tag: TagConfig[];
  fingerprint: string;
  tagManagerUrl: string;
  // Present in exports when using community templates
  // Keep it loose, as we don't currently introspect templateData
  customTemplate?: unknown[];
};

export interface GTMConfiguration {
  exportFormatVersion: number;
  exportTime: string;
  containerVersion: GTMContainerVersion;
}
