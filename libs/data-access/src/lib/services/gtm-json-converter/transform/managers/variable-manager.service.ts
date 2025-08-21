import { Injectable } from '@angular/core';
import { DataLayer, EventSettingsVariable, VariableConfig } from '@utils';
import { DataLayerVariable } from '../variables/data-layer-variable.service';
import { ScrollVariable } from '../variables/scroll-variable.service';
import { VideoVariable } from '../variables/video-variable.service';
import { EventUtils } from '../../utils/event-utils.service';
import { ConstantVariable } from '../variables/constant-variable.service';
import { EventSettingsVariableService } from '../variables/event-settings-variable.service';

@Injectable({
  providedIn: 'root'
})
export class VariableManager {
  constructor(
    private readonly dataLayerVariable: DataLayerVariable,
    private readonly scrollVariable: ScrollVariable,
    private readonly videoVariable: VideoVariable,
    private readonly constantVariable: ConstantVariable,
    private readonly eventSettingsVariable: EventSettingsVariableService,
    private readonly eventUtils: EventUtils
  ) {}
  /**
   * Returns built-in variables based on presence of matching events in data layers.
   */
  getBuiltInVariables(options: {
    accountId: string;
    containerId: string;
    dataLayers: DataLayer[];
  }): VariableConfig[] {
    const { accountId, containerId, dataLayers } = options;
    const videoVars = this.eventUtils.isIncludeVideo(dataLayers)
      ? this.videoVariable.videoBuiltInVariable({ accountId, containerId })
      : [];
    const scrollVars = this.eventUtils.isIncludeScroll(dataLayers)
      ? this.scrollVariable.scrollBuiltInVariable({ accountId, containerId })
      : [];

    return [...videoVars, ...scrollVars];
  }

  /**
   * Builds all variables needed for the container from data layers and settings.
   */
  getVariables(options: {
    accountId: string;
    containerId: string;
    measurementId: string;
    dataLayers: DataLayer[];
    esvContent: EventSettingsVariable[];
  }): VariableConfig[] {
    const { accountId, containerId, measurementId, dataLayers, esvContent } =
      options;

    const dataLayerVariables = this.buildDataLayerVariables(
      accountId,
      containerId,
      dataLayers
    );
    const uniqueVariables = this.dedupeByName(dataLayerVariables);

    const constantMeasurementIdVariable =
      this.constantVariable.createMeasurementIdConstantVariable(
        accountId,
        containerId,
        measurementId
      );

    const eventSettingsVariable =
      this.eventSettingsVariable.createEventSettingsVariable(
        accountId,
        containerId,
        esvContent
      );

    return this.assignVariableIds([
      ...uniqueVariables,
      constantMeasurementIdVariable,
      ...eventSettingsVariable
    ]);
  }

  /**
   * Create variables from data layer paths.
   */
  private buildDataLayerVariables(
    accountId: string,
    containerId: string,
    dataLayers: DataLayer[]
  ): VariableConfig[] {
    return dataLayers.flatMap((dL) =>
      this.dataLayerVariable.createDataLayerVariable(
        accountId,
        containerId,
        dL.paths
      )
    );
  }

  /**
   * Remove duplicate variables by name (stable order).
   */
  private dedupeByName(variables: VariableConfig[]): VariableConfig[] {
    const seen = new Set<string>();
    return variables.filter((v) => {
      const dup = seen.has(v.name);
      if (!dup) seen.add(v.name);
      return !dup;
    });
  }

  /**
   * Assigns sequential string IDs starting at 1.
   */
  private assignVariableIds(variables: VariableConfig[]): VariableConfig[] {
    return variables.map((v, idx) => ({ ...v, variableId: String(idx + 1) }));
  }
}
