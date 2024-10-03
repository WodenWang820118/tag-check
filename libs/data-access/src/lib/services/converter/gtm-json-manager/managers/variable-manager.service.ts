import { Injectable } from '@angular/core';
import { VariableConfig } from '@utils';
import { DataLayerVariable } from '../variables/data-layer-variable.service';
import { RegexVariable } from '../variables/regex-variable.service';
import { ScrollVariable } from '../variables/scroll-variable.service';
import { VideoVariable } from '../variables/video-variable.service';
import { EventUtils } from '../../utils/event-utils.service';

@Injectable({
  providedIn: 'root',
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
    data: Record<string, string>[]
  ): VariableConfig[] {
    return [
      ...(this.eventUtils.isIncludeVideo(data)
        ? [
            ...this.videoVariable.videoBuiltInVariable({
              accountId,
              containerId,
            }),
          ]
        : []),
      ...(this.eventUtils.isIncludeScroll(data)
        ? [
            ...this.scrollVariable.scrollBuiltInVariable({
              accountId,
              containerId,
            }),
          ]
        : []),
    ];
  }

  getVariables(
    accountId: string,
    containerId: string,
    dataLayers: string[]
  ): VariableConfig[] {
    const variables = dataLayers.map((dL, i) => {
      return this.dataLayerVariable.createVariable(accountId, containerId, dL);
    });

    const regexMeasurementIdVariable =
      this.regexVariable.createRegexMeasurementIdVariable(
        accountId,
        containerId
      );

    variables.push(regexMeasurementIdVariable);

    return variables.map((data, index) => ({
      ...data,
      variableId: (index + 1).toString(),
    }));
  }
}
