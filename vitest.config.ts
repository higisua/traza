import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "features/analytics/**/*.test.ts",
      "features/insights/**/*.test.ts",
      "features/workout/__tests__/prCompute.test.ts",
      "features/exercises/**/*.test.ts",
      "features/routines/**/*.test.ts",
      "features/data/**/*.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
