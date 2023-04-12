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
      external: ["umi", "umi/plugin-utils"],
      output: {
        globals: {
          umi: "umi",
          "umi/plugin-utils": "umi/plugin-utils",
        },
      },
    },
  },
});
