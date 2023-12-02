import { VariableConfig } from 'src/app/interfaces/gtm-config-generator';
import {
  createBooleanParameter,
  createIntegerParameter,
  createTemplateParameter,
} from '../parameter-utils';

export function createVariable(
  accountId: string,
  containerId: string,
  dataLayerName: string
): VariableConfig {
  return {
    name: `DLV - ${dataLayerName}`,
    type: 'v',
    accountId,
    containerId,
    parameter: [
      createIntegerParameter('dataLayerVersion', '2'),
      createBooleanParameter('setDefaultValue', 'false'),
      createTemplateParameter('name', dataLayerName),
    ],
  };
}
