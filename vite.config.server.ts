import { defineConfig } from "vite";
import path from "path";

// Server build configuration for Cloudflare Workers
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/worker.ts"),
      name: "server",
      fileName: "worker",
      formats: ["es"],
    },
    outDir: "dist/server",
    target: "esnext",
    ssr: true,
    rollupOptions: {
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    minify: false,
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
