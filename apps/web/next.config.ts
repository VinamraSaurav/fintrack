import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

const createConfig = (phase: string): NextConfig => ({
  // Keep dev output separate so `next build` doesn't corrupt a running dev server.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  transpilePackages: ['@fintrack/shared'],
});

export default createConfig;
