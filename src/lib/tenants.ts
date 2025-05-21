import payload from 'payload';
import type { Tenant } from '../payload-types';

/**
 * In-memory cache for tenant lookups by domain.
 * Key: customDomain, Value: Tenant object
 */
const tenantCache = new Map<string, Tenant | null>();
const CACHE_TTL = 60 * 1000; // 1 minute
const cacheTimestamps = new Map<string, number>();

/**
 * Get a tenant by their custom domain.
 * @param domain The domain to look up (hostname, e.g. "www.client.com")
 * @returns The tenant object or null if not found
 */
export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  const now = Date.now();
  // Check cache
  const cached = tenantCache.get(domain);
  const cachedAt = cacheTimestamps.get(domain);
  if (cached !== undefined && cachedAt !== undefined && now - cachedAt < CACHE_TTL) {
    return cached;
  }

  // Query Payload CMS for tenant with matching customDomain
  try {
    const { docs } = await payload.find({
      collection: 'tenants',
      where: {
        customDomain: {
          equals: domain,
        },
      },
      limit: 1,
    });

    const tenant = docs[0] as Tenant | undefined;
    tenantCache.set(domain, tenant ?? null);
    cacheTimestamps.set(domain, now);
    return tenant ?? null;
  } catch (err) {
    // On error, do not cache result
    console.error('Error in getTenantByDomain:', err);
    return null;
  }
}