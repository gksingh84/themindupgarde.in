import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/feed',
        destination: '/sitemap.xml',
        permanent: true,
      },
      {
        source: '/feed/',
        destination: '/sitemap.xml',
        permanent: true,
      },
      {
        source: '/category/:slug*',
        destination: '/categories/:slug*',
        permanent: true,
      },
      {
        source: '/author/:path*',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/wp-content/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/tag/:path*',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
