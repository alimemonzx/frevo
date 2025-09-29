import { defineConfig, loadEnv, build as viteBuild } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync, writeFileSync } from "fs";
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
              let content = readFileSync(srcPath, "utf-8");

              // Replace isDev flag based on build mode
              const isDev = mode === "development";
              content = content.replace(
                /const isDev = false;/g,
                `const isDev = ${isDev};`
              );

              writeFileSync(destPath, content);
              // File copied and processed successfully
            }
          });
        },
      },
      // Custom plugin to build content scripts separately
      isContentBuild && {
        name: "build-content-scripts",
        async buildStart() {
          // Skip the normal build process and build each content script separately
          const scripts = [
            { input: "src/content-script.tsx", output: "assets/content.js" },
            { input: "src/content-script-2.tsx", output: "assets/content2.js" },
          ];

          for (const script of scripts) {
            await viteBuild({
              mode,
              configFile: false,
              base: "./",
              define: {
                "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
                  env.VITE_API_BASE_URL
                ),
                "import.meta.env.VITE_APP_ENV": JSON.stringify(
                  env.VITE_APP_ENV || mode
                ),
              },
              plugins: [react()],
              build: {
                outDir: "dist",
                emptyOutDir: false,
                cssCodeSplit: false,
                minify: true,
                assetsInlineLimit: 999999,
                rollupOptions: {
                  input: script.input,
                  output: {
                    entryFileNames: script.output,
                    assetFileNames: (assetInfo) => {
                      if (assetInfo.name?.endsWith(".css")) {
                        return "assets/[name]";
                      }
                      return "assets/[name].[ext]";
                    },
                    format: "iife",
                    inlineDynamicImports: true,
                  },
                },
              },
              css: {
                modules: {
                  generateScopedName: "[name]__[local]___[hash:base64:5]",
                  localsConvention: "camelCase",
                },
              },
            });
          }

          // Exit after building all content scripts
          process.exit(0);
        },
      },
    ].filter(Boolean),
    build: {
      rollupOptions: {
        input: isContentBuild
          ? "src/content-script.tsx" // Dummy input, won't be used
          : ({ popup: "index.html" } as Record<string, string>),
        output: {
          entryFileNames: "assets/[name].js",
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
        assetsInlineLimit: 999999,
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
