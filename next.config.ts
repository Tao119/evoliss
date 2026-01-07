/** @type {import('next').NextConfig} */
const withVideos = require('next-videos');

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'evoliss-s3.s3.ap-northeast-1.amazonaws.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // パフォーマンス最適化
  experimental: {
    optimizeCss: true,
    // Next.js 14のキャッシュを無効化
    ppr: false, // Partial Prerenderingを無効化
  },
  // ビルド最適化
  productionBrowserSourceMaps: false,
  compress: true,
  // キャッシュ無効化設定
  generateBuildId: async () => {
    // ビルドごとに一意のIDを生成し、キャッシュを無効化
    return `build-${Date.now()}`;
  },
  // APIレスポンスのキャッシュを無効化とCORS設定
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: "/api/socket",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Upgrade",
            value: "websocket",
          },
          {
            key: "Connection",
            value: "Upgrade",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

module.exports = withVideos(nextConfig);