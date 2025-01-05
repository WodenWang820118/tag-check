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
    private dataLayerVariable: DataLayerVariable,
    private scrollVariable: ScrollVariable,
    private videoVariable: VideoVariable,
    private constantVariable: ConstantVariable,
    private eventSettingsVariable: EventSettingsVariableService,
    private eventUtils: EventUtils
  ) {}
  getBuiltInVariables(
    accountId: string,
    containerId: string,
    dataLayers: DataLayer[]
  ): VariableConfig[] {
    return [
      ...(this.eventUtils.isIncludeVideo(dataLayers)
        ? [
            ...this.videoVariable.videoBuiltInVariable({
              accountId,
              containerId
            })
          ]
        : []),
      ...(this.eventUtils.isIncludeScroll(dataLayers)
        ? [
            ...this.scrollVariable.scrollBuiltInVariable({
              accountId,
              containerId
            })
          ]
        : [])
    ];
  }

  getVariables(
    accountId: string,
    containerId: string,
    measurementId: string,
    dataLayers: DataLayer[],
    esvConent: EventSettingsVariable[]
  ): VariableConfig[] {
    const dataLayerVariables = dataLayers
      .map((dL, i) => {
        return this.dataLayerVariable.createDataLayerVariable(
          accountId,
          containerId,
          dL.paths
        );
      })
      .flat();

    const seen = new Set();
    const uniqueVariables = dataLayerVariables.filter((variable) => {
      const duplicate = seen.has(variable.name);
      seen.add(variable.name);
      return !duplicate;
    });

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
        esvConent
      );

    return [
      ...uniqueVariables,
      constantMeasurementIdVariable,
      ...eventSettingsVariable
    ].map((data, index) => ({
      ...data,
      variableId: (index + 1).toString()
    }));
  }
}
