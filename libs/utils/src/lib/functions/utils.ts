export function getCurrentTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // JavaScript months are 0-indexed
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
}

export function extractEventNameFromId(eventId: string) {
  const eventName = eventId.replace(
    /_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    ''
  );
  return eventName;
}

// export function createMock<T extends object>(
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   type: new (...args: any[]) => T,
//   overrides?: Partial<T>
// ): jest.Mocked<T> {
//   const mock = {} as jest.Mocked<T>;

//   Object.getOwnPropertyNames(type.prototype).forEach((methodName) => {
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
//     const method = type.prototype[methodName as keyof T];
//     if (typeof method === 'function') {
//       (mock[methodName as keyof T] as unknown) = jest.fn();
//     }
//   });

//   return { ...mock, ...overrides };
// }
