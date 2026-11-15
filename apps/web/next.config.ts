import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok.app', 'localhost:3000'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
    '@coursecity/contracts',
    '@coursecity/design-tokens',
    '@coursecity/design-system',
    '@coursecity/api-client',
    '@coursecity/shared',
    '@coursecity/validation',
  ],
};

export default nextConfig;
