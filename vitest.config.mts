import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // server-only throws at import time in jsdom — stub it out for unit tests.
    alias: {
      "server-only": new URL("./src/__tests__/mocks/server-only.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/__tests__/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", ".next", "tests/**"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/**/*.test.*", "src/app/**"],
    },
  },
});
