import { Trigger } from '../../../../interfaces/gtm-config-generator';
import { isBuiltInEvent } from '../../utilities/event-utils';

export class TriggerManager {
  triggers: Trigger[] = [];

  formatSingleTrigger(eventName: string) {
    if (isBuiltInEvent(eventName)) {
      return;
    }

    this.addTriggerIfNotExists(eventName);
  }

  addTriggerIfNotExists(eventName: string) {
    if (!this.triggers.some((trigger) => trigger.name === eventName)) {
      this.triggers.push({
        name: eventName,
        triggerId: (this.triggers.length + 1).toString(),
      });
    }
  }

  getTriggers() {
    return this.triggers;
  }
}
