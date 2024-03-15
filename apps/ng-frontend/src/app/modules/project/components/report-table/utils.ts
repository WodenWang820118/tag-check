// utils.ts or a similar file for utility functions
export function getNewPreventNavigationEvents(
  currentEvents: string[],
  events: string[]
): string[] {
  let newSettings: string[] = [...currentEvents];

  for (const receivedEvent of events) {
    const index = newSettings.indexOf(receivedEvent);

    if (index > -1) {
      // Event is found, remove it (toggle behavior)
      newSettings.splice(index, 1);
    } else {
      // Event is new, add it to the array
      newSettings.push(receivedEvent);
    }
  }

  // If original array was empty, just return the new events
  if (!currentEvents.length) {
    newSettings = [...events];
  }

  return newSettings;
}
