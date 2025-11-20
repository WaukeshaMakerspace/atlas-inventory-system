import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Use standalone output for Docker, default for Amplify
  // Comment out for Amplify deployment, uncomment for Docker
  // output: 'standalone',

  // Enable compression
  compress: true,

  // Enable React strict mode
  reactStrictMode: true,

  // Optimize fonts
  optimizeFonts: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
