import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import checker from 'vite-plugin-checker';
import { postBuild } from './scripts/postbuild.js';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set by scripts/serve.ts. During serve we skip the type/lint checker:
// `npm run build` and `npm run package` already run typecheck + lint first.
const isServe = process.env.THEME_SERVE === '1';

/**
 * Vite Configuration for DNN Theme
 *
 * This file contains ONLY configuration.
 * All build logic lives in ./scripts/
 */
export default defineConfig({
  // Source directory
  root: './src',
  base: './',

  build: {
    outDir: '../dist',
    emptyOutDir: true,

    rollupOptions: {
      // Entry point(s) — TypeScript sources in src/js.
      // customMenu.ts is imported by custom.ts, so it is bundled into custom.min.js.
      input: {
        custom: resolve(__dirname, 'src/js/custom.ts'),
      },

      output: {
        entryFileNames: 'js/[name].min.js',
        chunkFileNames: 'js/[name].min.js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? assetInfo.name ?? '';

          // The compiled stylesheet takes its name from the JS entry that
          // imports it ("custom"), so rename it to style.min.css, which is
          // what _includes.ascx references.
          if (name === 'custom.css') {
            return 'css/style.min.css';
          }
          if (name.endsWith('.css')) {
            return 'css/[name].min[extname]';
          }
          if (/\.(woff2?|ttf|eot)$/.test(name)) {
            return 'fonts/[name][extname]';
          }
          if (/\.(png|jpe?g|gif|svg|webp)$/.test(name)) {
            return 'images/[name][extname]';
          }
          return '[name][extname]';
        },
      },
    },

    minify: 'terser',
    sourcemap: true,
    cssMinify: true,
  },

  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['./node_modules'],
      },
    },
  },

  plugins: [
    // Runs TypeScript and ESLint checks on every rebuild.
    // Errors appear in the terminal and as a browser overlay during serve/watch.
    // The checker handles one tsconfig, so it targets the theme's browser code
    // (src/js). The build scripts are covered by `npm run typecheck`.
    checker({
      typescript: {
        tsconfigPath: './src/js/tsconfig.json',
      },
      eslint: {
        // During serve, only lint the theme's browser code. A full
        // build/package still lints the build scripts too.
        lintCommand: isServe
          ? 'eslint "src/js/**/*.ts"'
          : 'eslint "scripts/**/*.ts" "src/js/**/*.ts" "*.ts"',
        // Report ESLint errors as build errors (not just warnings)
        useFlatConfig: true,
      },
    }),
    postBuild(),
  ],
});
