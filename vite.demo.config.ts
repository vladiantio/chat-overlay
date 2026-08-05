import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist-demo",
    rollupOptions: { input: { demo: "demo.html", setup: "demo-setup.html" } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
