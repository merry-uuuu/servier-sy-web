/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      { source: '/s', destination: '/' },
      { source: '/w', destination: '/' },
    ];
  },
  webpack: (config, { isServer }) => {
    // 클라이언트 번들에서 프롬프트 파일 제외 (보안)
    // libs/server/prompts 디렉토리는 서버에서만 사용되어야 함
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/libs/server/prompts': false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

