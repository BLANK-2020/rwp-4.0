import { NextRequest, NextResponse } from 'next/server';
import { getTenantByDomain } from './src/lib/tenants';
import type { Tenant } from './src/payload-types';

// List of path prefixes to skip (admin and API routes)
const SKIP_PATHS = [
  /^\/api\//,
  /^\/_next\//,
  /^\/static\//,
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
  /^\/admin(\/|$)/,
];

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;

  // Skip processing for admin and API routes
  if (
    SKIP_PATHS.some((re) => re.test(pathname)) ||
    hostname.startsWith('admin.') // e.g., admin.example.com
  ) {
    return NextResponse.next();
  }

  // Look up tenant by domain
  let tenant: Tenant | null = null;
  try {
    tenant = await getTenantByDomain(hostname);
  } catch (err) {
    console.error('Error looking up tenant:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  if (!tenant) {
    // Domain not found: return 404
    return new NextResponse('Tenant Not Found', { status: 404 });
  }

  // Set tenant context in headers for downstream requests
  const res = NextResponse.next();
  res.headers.set('x-tenant-id', String(tenant.id));
  res.headers.set('x-tenant-slug', tenant.slug);
  res.headers.set('x-tenant-domain', tenant.customDomain || '');
  // Add more headers as needed for downstream context

  return res;
}

// Specify which paths the middleware should run on (optional, for Next.js 15+)
export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};