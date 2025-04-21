import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["src/index.ts"],
  clean: true,
  format: ["esm"],
  sourcemap: "inline",
  env: {
    NODE_ENV: "development",
  },
  define: {
    __dev__: "true",
  },
});
