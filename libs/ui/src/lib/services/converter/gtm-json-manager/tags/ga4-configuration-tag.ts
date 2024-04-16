import { TagConfig } from '../../../../interfaces/tag-build.interface';
import {
  createBooleanParameter,
  createTemplateParameter,
} from '../parameter-utils';

export function createGA4Configuration(
  googleTagName: string,
  measurementId: string,
  accountId: string,
  containerId: string
): TagConfig {
  const measurementIdParameter = measurementId
    ? measurementId
    : '{{Measurement ID}}';
  return {
    name: googleTagName,
    type: 'gaawc',
    accountId,
    containerId,
    parameter: [
      createBooleanParameter('sendPageView', 'false'),
      createBooleanParameter('enableSendToServerContainer', 'false'),
      createTemplateParameter('measurementId', `${measurementIdParameter}`),
    ],
    firingTriggerId: ['2147479553'],
    tagFiringOption: 'ONCE_PER_EVENT',
    monitoringMetadata: {
      type: 'MAP',
    },
    consentSettings: {
      consentStatus: 'NOT_SET',
    },
  };
}
