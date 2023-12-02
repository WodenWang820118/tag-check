import {
  Trigger,
  TriggerConfig,
} from '../../../../interfaces/gtm-config-generator';
import { createVideoTrigger } from './video-trigger';
import { createScrollTrigger } from './scroll-trigger';
import { createTrigger } from './event-trigger';

export function getTriggers(
  accountId: string,
  containerId: string,
  data: Record<string, string>[],
  triggers: Trigger[]
): TriggerConfig[] {
  return [
    ...triggers.map(({ name: trigger }) => {
      return createTrigger(accountId, containerId, trigger);
    }),
    ...createVideoTrigger(accountId, containerId, data),
    ...createScrollTrigger(accountId, containerId, data),
  ].map((_trigger, index) => ({
    ..._trigger,
    triggerId: (index + 1).toString(),
  }));
}
