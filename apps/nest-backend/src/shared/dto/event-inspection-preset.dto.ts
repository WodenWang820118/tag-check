// Re-export EventInspection preset DTOs from the shared utils library
// This file used to contain a duplicate definition which caused Swagger to
// generate duplicate schemas. Re-exporting ensures a single source of truth.
export {
  EventInspectionPresetDto,
  ApplicationDto,
  LocalStorageDto,
  CookieDto
} from '@utils';
