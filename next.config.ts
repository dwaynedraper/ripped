import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default withSentryConfig(nextConfig, {
  // Suppress Sentry CLI output unless running in CI
  silent: !process.env.CI,
  // Upload source maps to Sentry for readable stack traces in production.
  // Requires SENTRY_AUTH_TOKEN in Vercel build settings.
  // Safe to omit locally — errors still surface, just show compiled output.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
