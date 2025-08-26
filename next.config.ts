/** @type {import('next').NextConfig} */
const withVideos = require('next-videos');

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["user-icon-bucket.s3.ap-northeast-1.amazonaws.com"],
  },
  // パフォーマンス最適化
  experimental: {
    optimizeCss: true,
    // Next.js 14のキャッシュを無効化
    ppr: false, // Partial Prerenderingを無効化
  },
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
        source: "/socket.io/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
    ];
  },
};

module.exports = withVideos(nextConfig);