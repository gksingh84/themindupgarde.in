import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'tmu_blogs',
    APP_AWS_REGION: process.env.APP_AWS_REGION || 'ap-south-1',
    APP_AWS_ACCESS_KEY_ID: process.env.APP_AWS_ACCESS_KEY_ID || '',
    APP_AWS_SECRET_ACCESS_KEY: process.env.APP_AWS_SECRET_ACCESS_KEY || '',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
