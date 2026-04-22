import { StrictDataLayerEvent } from './data-layer.type';

export type GTMContainerConfig = {
  accountId: string;
  containerId: string;
  containerName: string;
  gtmId: string;
  specs: StrictDataLayerEvent[];
};
