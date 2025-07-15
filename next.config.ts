import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "frame-ancestors 'self' https://app.valoramix.com https://*.valoramix.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
