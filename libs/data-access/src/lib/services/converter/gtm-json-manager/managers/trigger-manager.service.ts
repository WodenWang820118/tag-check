import { Trigger } from '@utils';
import { EventUtils } from '../../utils/event-utils.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TriggerManager {
  constructor(private eventUtils: EventUtils) {}
  triggers: Trigger[] = [];

  formatSingleTrigger(eventName: string) {
    if (this.eventUtils.isBuiltInEvent(eventName)) {
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
