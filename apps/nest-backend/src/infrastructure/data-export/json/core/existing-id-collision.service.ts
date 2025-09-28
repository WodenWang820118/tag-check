import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ExistingIdCollisionService {
  private readonly logger = new Logger(ExistingIdCollisionService.name);

  private readonly upsertEligible = new Set([
    'ApplicationSettingEntity',
    'AuthenticationSettingEntity',
    'BrowserSettingEntity',
    'RecordingEntity',
    'SpecEntity',
    'ItemDefEntity'
  ]);

  /**
   * Returns true when caller should skip persisting due to existing id collision
   * (and not upsert-eligible). When skipping, it will optionally record id map
   * and increment the skipped stat via the provided callbacks/state.
   */
  handleCollision(params: {
    metaName: string;
    pkVal: unknown;
    rawPkVal: unknown;
    idMap: ((oldPk: unknown, newPk: unknown) => void) | null | undefined;
    incrementSkipStat?: () => void;
    importDebug?: boolean;
  }): boolean {
    const { metaName, pkVal, rawPkVal, idMap, incrementSkipStat, importDebug } =
      params;

    if (pkVal == null) return false;

    if (!this.upsertEligible.has(metaName)) {
      if (rawPkVal != null && idMap) idMap(rawPkVal, pkVal);
      if (incrementSkipStat) incrementSkipStat();
      if (importDebug) {
        this.logger.debug(
          `[IMPORT_DEBUG] Early skip due to existingId collision for ${metaName} pkVal=${String(pkVal)}`
        );
      }
      return true;
    }

    if (importDebug) {
      this.logger.debug(
        `[IMPORT_DEBUG] Collision on pk for upsert-eligible ${metaName} pkVal=${String(pkVal)} allowing through to persistence.`
      );
    }

    return false; // allow persistence to perform upsert
  }
}
