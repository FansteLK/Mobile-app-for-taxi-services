import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30_000,
    hookTimeout: 120_000, // first run downloads a MongoDB binary
  },
});
