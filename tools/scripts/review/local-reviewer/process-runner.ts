import { spawn } from 'node:child_process';

export async function runJsonWorker<T>(input: {
  args: string[];
  cwd: string;
  scriptPath: string;
}): Promise<T> {
  const result = await runNodeWorker({
    args: [input.scriptPath, ...input.args],
    cwd: input.cwd
  });

  try {
    return JSON.parse(result.stdout) as T;
  } catch (error) {
    throw new Error(
      `Worker returned non-JSON output: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function runNodeWorker(input: {
  args: string[];
  cwd: string;
}): Promise<{ stderr: string; stdout: string }> {
  return new Promise((resolveResult, reject) => {
    const child = spawn('node', input.args, {
      cwd: input.cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolveResult({
          stderr: stderr.trim(),
          stdout: stdout.trim()
        });
        return;
      }

      reject(
        new Error(
          stderr.trim() || stdout.trim() || `Worker exited with code ${code}.`
        )
      );
    });
  });
}

export async function mapLimit<TItem, TResult>(
  items: ReadonlyArray<TItem>,
  limit: number,
  mapper: (item: TItem, index: number) => Promise<TResult>
): Promise<TResult[]> {
  if (items.length === 0) {
    return [];
  }

  const results = new Array<TResult>(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(
          items[currentIndex]!,
          currentIndex
        );
      }
    })
  );

  return results;
}
