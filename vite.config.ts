import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "fs";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), "");
  const isContentBuild = mode === "content";
  const isAllContentBuild = mode === "all-content"; // New mode for building all content scripts

  return {
    base: "./",
    define: {
      // Make environment variables available to the client
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        env.VITE_API_BASE_URL
      ),
      "import.meta.env.VITE_APP_ENV": JSON.stringify(env.VITE_APP_ENV || mode),
    },
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
            } as Record<string, string>;
          } else if (isAllContentBuild) {
            // Build multiple content scripts at once
            return {
              content: "src/content-script.tsx",
              content2: "src/content-script-2.tsx",
              // Add more content scripts here as needed
              // content3: "src/content-script-3.tsx",
            } as Record<string, string>;
          } else {
            return { popup: "index.html" } as Record<string, string>;
          }
        })(),
        output: {
          entryFileNames: (chunkInfo) => {
            if (isContentBuild && chunkInfo.name === "content") {
              return "assets/content.js";
            } else if (isAllContentBuild) {
              // Map content script names to their output files
              const contentScriptMap: Record<string, string> = {
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
          assetFileNames: (assetInfo) => {
            // Handle CSS modules for extensions
            if (assetInfo.name?.endsWith(".css")) {
              return "assets/[name]";
            }
            return "assets/[name].[ext]";
          },
          format: "es",
          name: undefined,
        },
      },
      outDir: "dist",
      emptyOutDir: !(isContentBuild || isAllContentBuild),
      // CSS modules support for extensions
      cssCodeSplit: false, // Bundle CSS with JS for extensions
      minify: true,
      // Inline CSS for content scripts to work in shadow DOM
      ...(isContentBuild || isAllContentBuild
        ? {
            cssInlineLimit: 999999, // Force all CSS to be inlined
          }
        : {}),
    },
    css: {
      modules: {
        // Generate scoped class names for CSS modules
        generateScopedName: "[name]__[local]___[hash:base64:5]",
        // Enable CSS modules for .module.css files
        localsConvention: "camelCase",
      },
      // For content scripts, inject CSS as JS
      ...(isContentBuild || isAllContentBuild
        ? {
            preprocessorOptions: {},
          }
        : {}),
    },
  };
});
