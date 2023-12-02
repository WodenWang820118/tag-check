import { TagConfig } from 'src/app/interfaces/gtm-config-generator';
import {
  createBooleanParameter,
  createTemplateParameter,
} from '../parameter-utils';

export function createGA4Configuration(
  configurationName: string,
  accountId: string,
  containerId: string
): TagConfig {
  return {
    name: configurationName,
    type: 'gaawc',
    accountId,
    containerId,
    parameter: [
      createBooleanParameter('sendPageView', 'false'),
      createBooleanParameter('enableSendToServerContainer', 'false'),
      createTemplateParameter('measurementId', '{{Measurement ID}}'),
    ],
    firingTriggerId: ['2147479553'],
  };
}
