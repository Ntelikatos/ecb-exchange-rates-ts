import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: false,
  minify: "terser",
  splitting: false,
  treeshake: true,
  outDir: "dist",
  terserOptions: {
    compress: {
      drop_console: true,
      passes: 2,
    },
    mangle: true,
  },
});
