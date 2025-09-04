/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'swr'],
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    optimizeCss: true,
    scrollRestoration: true,
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Enable SWC for better caching and performance
  swcMinify: true,
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // Bundle analyzer for production optimization
  webpack: (config, { dev, isServer }) => {
    // Performance optimizations
    config.optimization = {
      ...config.optimization,
      sideEffects: false,
      providedExports: true,
    };
    
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 10000,
        maxSize: 200000,
        maxAsyncRequests: 30,
        maxInitialRequests: 25,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: -10,
            enforce: true,
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide',
            chunks: 'all',
            priority: 5,
            enforce: true,
          },
          swr: {
            test: /[\\/]node_modules[\\/]swr[\\/]/,
            name: 'swr',
            chunks: 'all',
            priority: 5,
            enforce: true,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
            enforce: true,
          }
        }
      };
    }
    
    // Add module concatenation for better performance
    if (!dev) {
      config.optimization.concatenateModules = true;
    }
    
    return config;
  },
  
  // Image optimization
  images: {
    domains: ['images.pexels.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Compression and caching
  compress: true,
  
  // Performance monitoring
  poweredByHeader: false,
  generateEtags: false,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;