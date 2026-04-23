import {
  buildBackendApplication,
  prepareBackendRuntime
} from './backend-runtime.ts';
import { prepareNodeSidecar } from './node-sidecar.ts';
import { stopExistingDesktopSidecars } from './windows-cleanup.ts';

export interface PrepareRuntimeMainDependencies {
  buildBackendApplicationFn?: () => void;
  prepareBackendRuntimeFn?: () => void;
  prepareNodeSidecarFn?: () => unknown;
  stopExistingDesktopSidecarsFn?: () => unknown;
}

export function main(dependencies: PrepareRuntimeMainDependencies = {}) {
  const buildBackendApplicationFn =
    dependencies.buildBackendApplicationFn ?? buildBackendApplication;
  const stopExistingDesktopSidecarsFn =
    dependencies.stopExistingDesktopSidecarsFn ?? stopExistingDesktopSidecars;
  const prepareNodeSidecarFn =
    dependencies.prepareNodeSidecarFn ?? prepareNodeSidecar;
  const prepareBackendRuntimeFn =
    dependencies.prepareBackendRuntimeFn ?? prepareBackendRuntime;

  buildBackendApplicationFn();
  stopExistingDesktopSidecarsFn();
  prepareNodeSidecarFn();
  prepareBackendRuntimeFn();
}
