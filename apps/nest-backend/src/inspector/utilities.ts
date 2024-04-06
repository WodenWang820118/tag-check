import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseDataLayerEvent, StrictDataLayerEvent } from '@utils';

export enum ValidationStrategyType {
  ECOMMERCE = 'ecommerce',
  OLDGA4EVENTS = 'oldGA4Events',
}

export function collectKeys(obj: any, currentPath = '', keys: string[] = []) {
  for (const key of Object.keys(obj)) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (Array.isArray(obj[key])) {
        for (let i = 0; i < obj[key].length; i++) {
          const arrayPath = `${newPath}[${i}]`;
          collectKeys(obj[key][i], arrayPath, keys);
        }
      } else {
        collectKeys(obj[key], newPath, keys);
      }
    } else {
      keys.push(newPath);
    }
  }
  return keys;
}

export function compareKeys(specKeys: string[], implKeys: string[]) {
  if (specKeys.length === 0) return [];
  const missingKeys = [];

  for (const key of specKeys) {
    if (!implKeys.includes(key)) {
      missingKeys.push(key);
    }
  }

  return missingKeys;
}

export function determineStrategy(spec: StrictDataLayerEvent) {
  try {
    if (spec.event[ValidationStrategyType.ECOMMERCE]) {
      return ValidationStrategyType.ECOMMERCE;
    } else {
      return ValidationStrategyType.OLDGA4EVENTS;
    }
  } catch (error) {
    const errorMessage = `There is no spec available for determining strategy.`;
    Logger.error(errorMessage, 'Utilities.determineStrategy');
    throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
