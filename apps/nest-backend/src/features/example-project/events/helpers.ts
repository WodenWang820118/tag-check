import {
  GTMConfiguration,
  Spec,
  TriggerConfig,
  getParameterValue
} from '@utils';

function findTriggersByIds(
  triggers: TriggerConfig[],
  firingTriggerIds: string[]
): TriggerConfig[] {
  const triggerIds = new Set(firingTriggerIds);

  return triggers.filter(
    (trigger) =>
      typeof trigger.triggerId === 'string' && triggerIds.has(trigger.triggerId)
  );
}

export function buildExampleEventSpec(
  configuration: GTMConfiguration,
  eventName: string
): Spec {
  const tag = configuration.containerVersion.tag.find(
    (candidate) =>
      getParameterValue(candidate.parameter, 'eventName') === eventName
  );

  if (!tag) {
    throw new Error(
      `Tag with eventName "${eventName}" not found in exampleGtmJson`
    );
  }

  return {
    tag,
    trigger: findTriggersByIds(
      configuration.containerVersion.trigger,
      tag.firingTriggerId ?? []
    )
  };
}
