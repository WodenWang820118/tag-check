export function stripNpmPassthroughSeparator(args: string[]): string[] {
  return args[0] === '--' ? args.slice(1) : args;
}

export function hasFlag(args: ReadonlyArray<string>, flag: string): boolean {
  return args.includes(flag);
}

export function getFlagValue(
  args: ReadonlyArray<string>,
  flag: string
): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) {
    return undefined;
  }

  return args[index + 1];
}

export function stripFlagWithValue(
  args: ReadonlyArray<string>,
  flag: string
): string[] {
  const output: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flag) {
      index += 1;
      continue;
    }
    output.push(args[index]!);
  }
  return output;
}

export function readRequiredValue(
  argv: ReadonlyArray<string>,
  index: number,
  flag: string
): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
}

export function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return Promise.resolve('');
  }

  return new Promise((resolveInput, reject) => {
    let buffer = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      buffer += chunk;
    });
    process.stdin.on('end', () => resolveInput(buffer));
    process.stdin.on('error', reject);
  });
}
