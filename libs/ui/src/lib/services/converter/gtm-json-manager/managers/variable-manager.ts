import { VariableConfig } from '../../../../interfaces/gtm-config-generator';
import { isIncludeScroll, isIncludeVideo } from '../../utilities/event-utils';
import { createVariable } from '../variables/data-layer-variable';
import { createRegexMeasurementIdVariable } from '../variables/regex-measurement-id-variable';
import { scrollBuiltInVariable } from '../variables/scroll-variable';
import { videoBuiltInVariable } from '../variables/video-variable';

export class VariableManger {
  getBuiltInVariables(
    accountId: string,
    containerId: string,
    data: Record<string, string>[]
  ): VariableConfig[] {
    return [
      ...(isIncludeVideo(data)
        ? [...videoBuiltInVariable({ accountId, containerId })]
        : []),
      ...(isIncludeScroll(data)
        ? [...scrollBuiltInVariable({ accountId, containerId })]
        : []),
    ];
  }

  getVariables(
    accountId: string,
    containerId: string,
    dataLayers: string[]
  ): VariableConfig[] {
    const variables = dataLayers.map((dL, i) => {
      return createVariable(accountId, containerId, dL);
    });

    const regexMeasurementIdVariable = createRegexMeasurementIdVariable(
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
