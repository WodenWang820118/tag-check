export function collectKeys(obj, currentPath = '', keys = []) {
  for (const key in obj) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    if (
      typeof obj[key] === 'object' &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      this.collectKeys(obj[key], newPath, keys);
    } else {
      keys.push(newPath);
    }
  }
  return keys;
}

export function compareKeys(specKeys: string[], implKeys: string[]) {
  const missingKeys = [];

  for (const key of specKeys) {
    if (!implKeys.includes(key)) {
      missingKeys.push(key);
    }
  }

  return missingKeys;
}
