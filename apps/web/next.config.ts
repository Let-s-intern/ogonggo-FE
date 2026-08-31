import type { NextConfig } from 'next';

const USER_API_ORIGIN = process.env.OGONGGO_USER_API_ORIGIN ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  transpilePackages: ['@ogonggo/ui', '@ogonggo/api'],
  // Same-origin from the browser avoids CORS and keeps packages/api free of
  // any base-URL config — see packages/api/src/lib/http-client.ts.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${USER_API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
