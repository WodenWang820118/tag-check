import { VariableConfig } from 'src/app/interfaces/gtm-config-generator';

export function videoBuiltInVariable({
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
      type: 'VIDEO_PROVIDER',
      name: 'Video Provider',
    },
    {
      accountId,
      containerId,
      type: 'VIDEO_URL',
      name: 'Video URL',
    },
    {
      accountId,
      containerId,
      type: 'VIDEO_TITLE',
      name: 'Video Title',
    },
    {
      accountId,
      containerId,
      type: 'VIDEO_DURATION',
      name: 'Video Duration',
    },
    {
      accountId,
      containerId,
      type: 'VIDEO_PERCENT',
      name: 'Video Percent',
    },
    {
      accountId,
      containerId,
      type: 'VIDEO_VISIBLE',
      name: 'Video Visible',
    },
    {
      accountId,
      containerId,
      type: 'VIDEO_STATUS',
      name: 'Video Status',
    },
    {
      accountId,
      containerId,
      type: 'VIDEO_CURRENT_TIME',
      name: 'Video Current Time',
    },
  ];
}
