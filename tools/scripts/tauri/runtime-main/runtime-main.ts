import {
  buildBackendApplication,
  prepareBackendRuntime
} from '../backend-runtime/backend-runtime.ts';
import { prepareNodeSidecar } from '../node-sidecar/node-sidecar.ts';
import { stopExistingDesktopSidecars } from '../windows-cleanup/windows-cleanup.ts';

// Tauri build hooks call this orchestrator directly; keep the sequence explicit
// so sidecar cleanup, backend build, and runtime install remain easy to audit.
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
