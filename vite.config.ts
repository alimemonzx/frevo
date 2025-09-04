import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "fs";
import { resolve } from "path";

export default defineConfig(({ command, mode }) => {
  const isContentBuild = mode === "content";
  const isAllContentBuild = mode === "all-content"; // New mode for building all content scripts

  return {
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

          // Copy background.js to root of dist
          const backgroundSrc = resolve(
            __dirname,
            "public/extension/background.js"
          );
          const backgroundDest = resolve(outDir, "background.js");
          if (existsSync(backgroundSrc)) {
            copyFileSync(backgroundSrc, backgroundDest);
            console.log("✅ background.js copied to dist/");
          }

          // Copy inject.js to root of dist
          const injectSrc = resolve(__dirname, "public/extension/inject.js");
          const injectDest = resolve(outDir, "inject.js");
          if (existsSync(injectSrc)) {
            copyFileSync(injectSrc, injectDest);
            console.log("✅ inject.js copied to dist/");
          }

          const interceptorSrc = resolve(
            __dirname,
            "public/extension/interceptor.js"
          );
          const interceptorDest = resolve(outDir, "interceptor.js");
          if (existsSync(interceptorSrc)) {
            copyFileSync(interceptorSrc, interceptorDest);
            console.log("✅ interceptor.js copied to dist/");
          }

          console.log("✅ Extension files copied to dist/");
        },
      },
    ],

    build: {
      rollupOptions: {
        input: (() => {
          if (isContentBuild) {
            return {
              content: "src/content-script.tsx",
              content2: "src/content-script-2.tsx",
            };
          } else if (isAllContentBuild) {
            // Build multiple content scripts at once
            return {
              content: "src/content-script.tsx",
              content2: "src/content-script-2.tsx",
              // Add more content scripts here as needed
              // content3: "src/content-script-3.tsx",
            };
          } else {
            return { popup: "index.html" };
          }
        })(),
        output: {
          entryFileNames: (chunkInfo) => {
            if (isContentBuild && chunkInfo.name === "content") {
              return "assets/content.js";
            } else if (isAllContentBuild) {
              // Map content script names to their output files
              const contentScriptMap = {
                content: "assets/content.js",
                content2: "assets/content2.js",
                // 'content3': 'assets/content3.js',
              };
              return contentScriptMap[chunkInfo.name] || "assets/[name].js";
            } else {
              return "assets/[name].js";
            }
          },
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
          format: "es",
          name: undefined,
        },
      },
      outDir: "dist",
      emptyOutDir: !(isContentBuild || isAllContentBuild),
      // Now using styled-components, so normal CSS handling is fine
      cssCodeSplit: true,
      minify: true,
    },
  };
});
