import { Injectable } from '@angular/core';
import { DataLayer, EventSettingsVariable, VariableConfig } from '@utils';
import { DataLayerVariable } from '../variables/data-layer-variable.service';
import { RegexVariable } from '../variables/regex-variable.service';
import { ScrollVariable } from '../variables/scroll-variable.service';
import { VideoVariable } from '../variables/video-variable.service';
import { EventUtils } from '../../utils/event-utils.service';

@Injectable({
  providedIn: 'root'
})
export class VariableManager {
  constructor(
    private dataLayerVariable: DataLayerVariable,
    private regexVariable: RegexVariable,
    private scrollVariable: ScrollVariable,
    private videoVariable: VideoVariable,
    private eventUtils: EventUtils
  ) {}
  getBuiltInVariables(
    accountId: string,
    containerId: string
  ): VariableConfig[] {
    // TODO: get the data from the UI
    const data = [] as any;
    return [
      ...(this.eventUtils.isIncludeVideo(data)
        ? [
            ...this.videoVariable.videoBuiltInVariable({
              accountId,
              containerId
            })
          ]
        : []),
      ...(this.eventUtils.isIncludeScroll(data)
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

    console.log('uniqueVariables: ', uniqueVariables);
    const regexMeasurementIdVariable =
      this.regexVariable.createRegexMeasurementIdVariable(
        accountId,
        containerId
      );

    const eventSettingsVariable =
      this.dataLayerVariable.createEventSettingsVariable(
        accountId,
        containerId,
        esvConent
      );

    const builtInVariables = this.getBuiltInVariables(accountId, containerId);

    return [
      ...uniqueVariables,
      regexMeasurementIdVariable,
      ...eventSettingsVariable,
      ...builtInVariables
    ].map((data, index) => ({
      ...data,
      variableId: (index + 1).toString()
    }));
  }
}
