import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "fs";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "copy-extension-files",
      writeBundle() {
        const outDir = resolve(__dirname, "dist");

        // Copy manifest.json to root of dist
        const manifestSrc = resolve(
          __dirname,
          "public/extension/manifest.json"
        );
        const manifestDest = resolve(outDir, "manifest.json");
        if (existsSync(manifestSrc)) {
          copyFileSync(manifestSrc, manifestDest);
          console.log("✅ manifest.json copied to dist/");
        }

        // Copy content.js to root of dist
        const contentSrc = resolve(__dirname, "public/extension/content.js");
        const contentDest = resolve(outDir, "content.js");
        if (existsSync(contentSrc)) {
          copyFileSync(contentSrc, contentDest);
          console.log("✅ content.js copied to dist/");
        }

        console.log("✅ Extension files copied to dist/");
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        popup: "index.html",
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: false,
    cssMinify: false,
  },
});
