import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "fs";
import { resolve } from "path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig(({ command, mode }) => {
  const isContentBuild = mode === "content";

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

          console.log("✅ Extension files copied to dist/");
        },
      },
      // 🎯 NEW: Extract CSS content to a variable for manual injection
      {
        name: "extract-css-content",
        generateBundle(options, bundle) {
          if (isContentBuild) {
            // Find the CSS asset that Vite generated
            const cssAssets = Object.keys(bundle).filter((key) =>
              key.endsWith(".css")
            );

            if (cssAssets.length > 0) {
              const cssAsset = bundle[cssAssets[0]];
              if (
                cssAsset.type === "asset" &&
                typeof cssAsset.source === "string"
              ) {
                const cssContent = cssAsset.source;

                // Create a JS file that exports the CSS content
                const cssExportContent = `
                  // Generated CSS content for manual injection
                  export const CSS_CONTENT = \`${cssContent.replace(
                    /`/g,
                    "\\`"
                  )}\`;
                `;

                // Write the CSS content as a JS module
                this.emitFile({
                  type: "asset",
                  fileName: "tailwind-css-content.js",
                  source: cssExportContent,
                });

                console.log("✅ CSS content extracted for manual injection");
              }

              // Remove the CSS file since we'll inject it manually
              delete bundle[cssAssets[0]];
            }
          }
        },
      },
    ],

    css: {
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    },

    build: {
      rollupOptions: {
        input: isContentBuild
          ? { content: "src/content-script.tsx" }
          : { popup: "index.html" },
        output: {
          entryFileNames: isContentBuild
            ? "assets/content.js"
            : "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
          format: "es",
          name: undefined,
        },
      },
      outDir: "dist",
      emptyOutDir: !isContentBuild,
      // 🎯 IMPORTANT: Don't bundle CSS into JS, we'll handle it manually
      cssCodeSplit: true,
      minify: false,
      cssMinify: false,
    },
  };
});
