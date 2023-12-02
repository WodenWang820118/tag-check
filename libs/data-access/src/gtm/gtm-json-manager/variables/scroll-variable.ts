import { VariableConfig } from 'src/app/interfaces/gtm-config-generator';

export function scrollBuiltInVariable({
  accountId,
  containerId,
}: {
  accountId: string;
  containerId: string;
}): VariableConfig[] {
  return [
    {
      accountId,
      containerId,
      type: 'SCROLL_DEPTH_THRESHOLD',
      name: 'Scroll Depth Threshold',
    },
  ];
}
