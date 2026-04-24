import { isDirectEntrypoint } from '../../shared/paths.ts';
import { main } from '../runtime-main/runtime-main.ts';

export {
  buildBackendApplication,
  getBackendRuntimeInstallPlan,
  prepareBackendRuntime,
  type BackendRuntimeInstallPlan,
  type BuildBackendApplicationDependencies,
  type PrepareBackendRuntimeDependencies
} from '../backend-runtime/backend-runtime.ts';
export {
  type PrepareRuntimeMainDependencies,
  main
} from '../runtime-main/runtime-main.ts';
export {
  getRustTargetTriple,
  prepareNodeSidecar,
  type PrepareNodeSidecarDependencies,
  type RustTargetTripleDependencies
} from '../node-sidecar/node-sidecar.ts';
export {
  buildStopExistingDesktopSidecarsScript,
  getDefaultDesktopNodePaths,
  stopExistingDesktopSidecars,
  type WindowsCleanupDependencies
} from '../windows-cleanup/windows-cleanup.ts';

if (isDirectEntrypoint(import.meta.url)) {
  main();
}
