import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "fs";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), "");

  // Determine build type based on npm script
  const isContentBuild =
    process.env.npm_lifecycle_event?.includes("all-content");

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

          // Copy extension files to dist
          const filesToCopy = [
            { src: "public/extension/manifest.json", dest: "manifest.json" },
            { src: "public/extension/background.js", dest: "background.js" },
            { src: "public/extension/inject.js", dest: "inject.js" },
            { src: "public/extension/interceptor.js", dest: "interceptor.js" },
          ];

          filesToCopy.forEach(({ src, dest }) => {
            const srcPath = resolve(__dirname, src);
            const destPath = resolve(outDir, dest);
            if (existsSync(srcPath)) {
              copyFileSync(srcPath, destPath);
              console.log(`✅ ${dest} copied to dist/`);
            }
          });
        },
      },
    ],
    build: {
      rollupOptions: {
        input: isContentBuild
          ? {
              content: "src/content-script.tsx",
              content2: "src/content-script-2.tsx",
            }
          : { popup: "index.html" },
        output: {
          entryFileNames: (chunkInfo) => {
            if (isContentBuild) {
              const contentScriptMap: Record<string, string> = {
                content: "assets/content.js",
                content2: "assets/content2.js",
              };
              return contentScriptMap[chunkInfo.name] || "assets/[name].js";
            }
            return "assets/[name].js";
          },
          chunkFileNames: "assets/[name].js",
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith(".css")) {
              return "assets/[name]";
            }
            return "assets/[name].[ext]";
          },
          format: "es",
        },
      },
      outDir: "dist",
      emptyOutDir: !isContentBuild,
      cssCodeSplit: false,
      minify: true,
      ...(isContentBuild && {
        cssInlineLimit: 999999, // Force all CSS to be inlined for content scripts
      }),
    },
    css: {
      modules: {
        generateScopedName: "[name]__[local]___[hash:base64:5]",
        localsConvention: "camelCase",
      },
    },
  };
});
