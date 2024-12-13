import { Injectable } from '@angular/core';
import { EventSettingsVariable, Parameter, VariableConfig } from '@utils';
import { DataLayerVariable } from '../variables/data-layer-variable.service';
import { RegexVariable } from '../variables/regex-variable.service';
import { ScrollVariable } from '../variables/scroll-variable.service';
import { VideoVariable } from '../variables/video-variable.service';
import { EventUtils } from '../../utils/event-utils.service';

@Injectable({
  providedIn: 'root'
})
export class VariableManger {
  constructor(
    private dataLayerVariable: DataLayerVariable,
    private regexVariable: RegexVariable,
    private scrollVariable: ScrollVariable,
    private videoVariable: VideoVariable,
    private eventUtils: EventUtils
  ) {}
  getBuiltInVariables(
    accountId: string,
    containerId: string,
    data: {
      formattedParameters: Parameter[];
      eventName: string;
    }[]
  ): VariableConfig[] {
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
    data: {
      formattedParameters: Parameter[];
      eventName: string;
    }[],
    dataLayers: string[],
    esvConent: EventSettingsVariable[]
  ): VariableConfig[] {
    const dataLayerVariables = dataLayers.map((dL, i) => {
      return this.dataLayerVariable.createDataLayerVariable(
        accountId,
        containerId,
        dL
      );
    });

    const regexMeasurementIdVariable =
      this.regexVariable.createRegexMeasurementIdVariable(
        accountId,
        containerId
      );

    const eventSettingsVariable =
      this.dataLayerVariable.createEventSettingsVariable(
        accountId,
        containerId,
        data,
        esvConent
      );

    return [
      ...dataLayerVariables,
      regexMeasurementIdVariable,
      ...eventSettingsVariable
    ].map((data, index) => ({
      ...data,
      variableId: (index + 1).toString()
    }));
  }
}
