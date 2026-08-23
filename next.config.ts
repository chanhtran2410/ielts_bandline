import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /*
   * Dev-only. The dev server 403s asset requests from an origin it does not
   * recognise, which silently breaks hydration rather than erroring — add any
   * host you open the dev server from (a LAN IP for phone testing, a tunnel).
   * Has no effect on a production build.
   */
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  typedRoutes: false,
  experimental: {
    optimizePackageImports: ['@tanstack/react-query'],
  },
};

export default nextConfig;
