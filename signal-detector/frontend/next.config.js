/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api`
      : 'http://localhost:4000'
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // In the browser, we want to externalize certain native packages
      // since they can't be bundled in the frontend environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    // Only exclude native modules in client builds
    if (!isServer) {
      if (!config.externals) {
        config.externals = {};
      }
      config.externals = {
        ...config.externals,
        'pg': 'commonjs pg',
        'sqlite3': 'commonjs sqlite3',
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:4000 https:;"
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return [];
    }

    // In development, only proxy specific routes to the external backend
    // Exclude routes that should be handled by Next.js API routes
    return [
      {
        source: '/api/analyze/:path*',
        destination: 'http://localhost:4000/analyze/:path*'
      },
      {
        source: '/api/activities/:path*',
        destination: 'http://localhost:4000/activities/:path*'
      },
      {
        source: '/api/patterns/:path*',
        destination: 'http://localhost:4000/patterns/:path*'
      }
    ];
  }
};

module.exports = nextConfig;
