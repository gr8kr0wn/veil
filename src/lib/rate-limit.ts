// Small in-memory fixed-window limiter. Per server instance, so treat it as a safety net and
// add Vercel Firewall rate limiting for hard guarantees.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 10_000;
const MAX_PER_WINDOW = 200;
const MAX_TRACKED = 5_000;

export function allow(id: string, now = Date.now()): boolean {
  if (buckets.size > MAX_TRACKED) {
    for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
    if (buckets.size > MAX_TRACKED) buckets.clear();
  }
  const bucket = buckets.get(id);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= MAX_PER_WINDOW;
}
