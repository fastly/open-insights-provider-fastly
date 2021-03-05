// type PromiseGenerator = () => Promise<T>;

const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY = 100;

const wait = (delay: number): Promise<void> =>
  new Promise((resolve): number => setTimeout(resolve, delay));

function retry<T>(
  func: () => Promise<T>,
  times: number = DEFAULT_RETRY_ATTEMPTS,
  delay: number = DEFAULT_RETRY_DELAY
): Promise<T> {
  return new Promise<T>((resolve, reject): void => {
    func()
      .then(resolve)
      .catch((err: Error): Promise<any> | void => {
        if (--times > 0) {
          return wait(delay)
            .then((): Promise<T> => retry<T>(func, times, delay))
            .then(resolve)
            .catch(reject);
        }
        return reject(err);
      });
  });
}

export default retry;
