import {
  collectRepoChangedFiles as collectSharedRepoChangedFiles,
  collectRepoDiffText as collectSharedRepoDiffText,
  collectRepoHasUntrackedFiles as collectSharedRepoHasUntrackedFiles
} from '../../../shared/git.ts';

export function collectRepoChangedFiles(repoRoot: string): string[] {
  return collectSharedRepoChangedFiles({ repoRoot });
}

export function collectRepoHasUntrackedFiles(repoRoot: string): boolean {
  return collectSharedRepoHasUntrackedFiles({ repoRoot });
}

export function collectRepoDiffText(repoRoot: string): string {
  return collectSharedRepoDiffText({ repoRoot });
}
