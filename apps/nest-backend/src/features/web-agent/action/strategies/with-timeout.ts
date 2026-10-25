/**
 * Settles like `operation`, or rejects with `new Error(message)` once `ms`
 * have passed. The timer is cleared as soon as either happens.
 *
 * The operation itself is not cancelled: a click or a typed value that
 * times out may still land on the page afterwards.
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([operation, timedOut]);
  } finally {
    clearTimeout(timer);
  }
}
