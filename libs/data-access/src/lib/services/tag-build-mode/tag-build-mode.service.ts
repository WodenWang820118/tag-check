import { computed, Injectable, signal, WritableSignal } from '@angular/core';

/**
 * Semantic enum for the tag-build page mode.
 * The numeric values intentionally match the tab indices so the enum can be
 * two-way bound to MatTabGroup.selectedIndex.
 */
export enum TagBuildMode {
  TagBuild = 0,
  TagExtract = 1
}

@Injectable({ providedIn: 'root' })
export class TagBuildModeService {
  private readonly _mode: WritableSignal<TagBuildMode> = signal(
    TagBuildMode.TagBuild
  );

  // Store the computed signal as a class property
  private readonly _computedMode = computed(() => this._mode());

  // Read the current mode value
  get mode(): TagBuildMode {
    return this._computedMode();
  }

  // Set the current mode
  setMode(value: TagBuildMode) {
    this._mode.set(value);
  }

  // If a consumer wants the WritableSignal itself
  get modeSignal(): WritableSignal<TagBuildMode> {
    return this._mode;
  }
}
