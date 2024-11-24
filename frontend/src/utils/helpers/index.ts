// index.ts
export * from './format';
export * from './validation';

// Common utility functions
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) break;
      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), wait);
    });
  };
};

export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  ttl = 5000
): T => {
  const cache = new Map<string, { value: any; timestamp: number }>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && now - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = func(...args);
    cache.set(key, { value: result, timestamp: now });
    return result;
  }) as T;
};

export const createLogger = (prefix: string) => ({
  log: (...args: any[]) => console.log(`[${prefix}]`, ...args),
  error: (...args: any[]) => console.error(`[${prefix}]`, ...args),
  warn: (...args: any[]) => console.warn(`[${prefix}]`, ...args),
  info: (...args: any[]) => console.info(`[${prefix}]`, ...args),
});