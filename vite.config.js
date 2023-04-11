import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      name: "@baolq/umi-ui-system",
      formats: ["es", "umd"],
      fileName: "umi-ui-system",
    },
    rollupOptions: {
      external: ["umi"],
      output: {
        globals: {
          umi: "umi",
        },
      },
    },
  },
});
