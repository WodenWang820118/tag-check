import type { Page } from 'puppeteer';
import type { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';

export async function preloadApplicationLocalStorage(
  page: Page,
  application: EventInspectionPresetDto['application']
): Promise<void> {
  if (!application?.localStorage?.data?.length) {
    return;
  }

  await page.evaluateOnNewDocument((appLocalStorage) => {
    for (const setting of appLocalStorage.data) {
      let value = setting.value;
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      localStorage.setItem(setting.key, value);
    }
  }, application.localStorage);
}
