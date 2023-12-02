import { fixJsonString } from '../gtm/utilities/json-string-utils';

export class SpecParser {
  // TODO: example usage of the class
  fixJson(json: string): string {
    return fixJsonString(json);
  }
}
