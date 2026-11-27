export function isValidLatitude(value: string | null | undefined): boolean {
  if (value === null || value === undefined || value === '') {
    return true;
  }
  const latitude = Number.parseFloat(value);
  return !Number.isNaN(latitude) && latitude >= -90 && latitude <= 90;
}

export function isValidLongitude(value: string | null | undefined): boolean {
  if (value === null || value === undefined || value === '') {
    return true;
  }
  const longitude = Number.parseFloat(value);
  return !Number.isNaN(longitude) && longitude >= -180 && longitude <= 180;
}
