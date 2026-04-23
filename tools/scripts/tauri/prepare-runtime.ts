import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { main } from './lib/runtime-main.ts';

export {
  buildBackendApplication,
  getBackendRuntimeInstallPlan,
  prepareBackendRuntime,
  type BackendRuntimeInstallPlan,
  type BuildBackendApplicationDependencies,
  type PrepareBackendRuntimeDependencies
} from './lib/backend-runtime.ts';
export { type PrepareRuntimeMainDependencies, main } from './lib/runtime-main.ts';
export {
  getRustTargetTriple,
  prepareNodeSidecar,
  type PrepareNodeSidecarDependencies,
  type RustTargetTripleDependencies
} from './lib/node-sidecar.ts';
export {
  buildStopExistingDesktopSidecarsScript,
  getDefaultDesktopNodePaths,
  stopExistingDesktopSidecars,
  type WindowsCleanupDependencies
} from './lib/windows-cleanup.ts';

function isExecutedDirectly(moduleUrl: string) {
  const entrypoint = process.argv[1];
  if (!entrypoint) {
    return false;
  }

  return resolve(fileURLToPath(moduleUrl)) === resolve(entrypoint);
}

if (isExecutedDirectly(import.meta.url)) {
  main();
}
