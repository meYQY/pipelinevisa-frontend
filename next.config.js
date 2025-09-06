/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Docker部署优化
  output: 'standalone',
  
  // 启用严格模式和类型检查
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  
  // 环境变量
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: '流水签',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: '**.zeabur.app',
      },
      {
        protocol: 'https', 
        hostname: '**.aliyun-zeabur.cn',
      },
    ],
  },
  
  // 实验性功能
  experimental: {
    typedRoutes: true,
  },
  
  // Webpack配置
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
  
  // 重定向配置
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
    ]
  },
}

module.exports = nextConfig