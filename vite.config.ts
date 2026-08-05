import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  preview: {
    port: 4210,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
