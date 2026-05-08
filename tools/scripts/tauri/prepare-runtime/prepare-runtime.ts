import { isDirectEntrypoint } from '../../shared/paths.ts';
import { main } from '../runtime-main/runtime-main.ts';

export {
  buildBackendApplication,
  buildBackendRuntimeInstallStamp,
  getBackendRuntimeStampPath,
  getBackendRuntimeInstallPlan,
  hashFile,
  prepareBackendRuntime,
  type BackendRuntimeInstallStamp,
  type BackendRuntimeInstallPlan,
  type BuildBackendApplicationDependencies,
  type HashFileFunction,
  type PrepareBackendRuntimeDependencies
} from '../backend-runtime/backend-runtime.ts';
export {
  type PrepareRuntimeMainDependencies,
  main
} from '../runtime-main/runtime-main.ts';
export {
  getNodeSidecarStampPath,
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
