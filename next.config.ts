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
  },
  async headers() {
    return [
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