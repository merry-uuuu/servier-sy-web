type Bucket = {
  timestamps: number[];
};

const keyToBucket: Map<string, Bucket> = new Map();

function getBucket(key: string): Bucket {
  let bucket = keyToBucket.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    keyToBucket.set(key, bucket);
  }
  return bucket;
}

export function allowAttempt(
  key: string,
  options?: { windowMs?: number; max?: number }
): boolean {
  const windowMs = options?.windowMs ?? 5 * 60 * 1000; // 5 minutes
  const max = options?.max ?? 5; // 5 attempts

  const bucket = getBucket(key);
  const now = Date.now();
  const cutoff = now - windowMs;

  // Drop old timestamps
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= max) {
    return false;
  }

  bucket.timestamps.push(now);
  return true;
}

export function resetAttempts(key: string): void {
  keyToBucket.delete(key);
}

