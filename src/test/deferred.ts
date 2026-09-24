/** A promise the test settles by hand, to hold a request in flight. */
export function deferred<T>() {
  // Assigned synchronously by the Promise executor below.
  let resolve!: (value: T) => void;
  // Promise.withResolvers is ES2024, which the project's TypeScript lib does not include.
  // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });

  return { promise, resolve };
}
