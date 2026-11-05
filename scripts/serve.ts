/**
 * DNN Theme Development Server
 *
 * Starts a Browser-Sync proxy server that:
 * 1. Proxies your local DNN site
 * 2. Watches source files and rebuilds automatically
 * 3. Auto-refreshes the browser when files change
 */

import { spawn } from 'child_process';
import { relative, sep } from 'path';
import browserSync, { type Options as BrowserSyncOptions } from 'browser-sync';
import chokidar from 'chokidar';
import { logInfo, logSuccess, logError } from './helpers.js';
import config from '../serve.config.js';

const bs = browserSync.create();

// ============================================================================
// BROWSER-SYNC
// ============================================================================

/** Start the Browser-Sync proxy server. */
function startBrowserSync(): void {
  const options: BrowserSyncOptions = {
    proxy: config.dnnUrl,
    port: config.port,
    open: true,
    // @ts-expect-error — @types/browser-sync does not type notify.styles correctly
    notify: {
      styles: {
        top: 'auto',
        bottom: '0',
        borderRadius: '5px 0 0 0',
      },
    },
    logPrefix: 'DNN Theme',
    files: config.watchPaths,
    ghostMode: {
      clicks: false,
      forms: false,
      scroll: false,
    },
    middleware: [
      (_req, _res, next) => {
        // Add any custom middleware here, e.g. CORS headers:
        // res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      },
    ],
  };

  bs.init(options);

  console.log('');
  logSuccess('Browser-Sync started!');
  logInfo(`Local:    http://localhost:${config.port}`);
  logInfo(`Proxying: ${config.dnnUrl}`);

  const networkIp = bs.getOption('urls')?.get('external') as string | undefined;
  if (networkIp) {
    logInfo(`Network:  ${networkIp}`);
  }

  console.log('');
}

// ============================================================================
// VITE BUILD (child process)
// ============================================================================

/**
 * Run one Vite build in its own process, with a timeout so a hang can't
 * block later rebuilds. THEME_SERVE=1 tells vite.config.ts to skip the
 * type/lint checker, which npm run build/package already run separately.
 */
function runViteBuild(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['vite', 'build'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, THEME_SERVE: '1' },
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Build timed out after 60s'));
    }, 60_000);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`vite build exited with code ${code}`));
    });
  });
}

// ============================================================================
// FILE WATCHER
// ============================================================================

/**
 * Returns true for dotfiles/dot-directories (e.g. .git) inside the project.
 * Paths are made relative to the cwd first so a dot-folder higher up the
 * filesystem doesn't cause everything to be ignored.
 */
function isDotPath(p: string): boolean {
  const rel = relative(process.cwd(), p);
  return rel.split(sep).some((seg) => seg.startsWith('.') && seg !== '.' && seg !== '..');
}

/** Watch source files and trigger a debounced Vite rebuild on changes. */
function watchSourceFiles(): void {
  // NOTE: chokidar 4+ does not support globs. sourcePaths must be directories or files.
  const watcher = chokidar.watch(config.sourcePaths, {
    ignored: isDotPath,
    persistent: true,
    ignoreInitial: true,
  });

  let buildTimeout: ReturnType<typeof setTimeout> | undefined;
  let isBuilding = false;
  let pending = false;
  let lastFile = '';

  const runBuild = async (filePath: string): Promise<void> => {
    const shortPath = filePath.replace(process.cwd(), '.');

    // A build is already running: remember that something changed and
    // re-run once it finishes, instead of silently dropping the change.
    if (isBuilding) {
      pending = true;
      lastFile = filePath;
      logInfo(`Change queued (build in progress): ${shortPath}`);
      return;
    }

    logInfo(`Changed: ${shortPath}`);

    isBuilding = true;
    const startTime = Date.now();

    try {
      await runViteBuild();
      // Reload once, after everything is written to dist/. Browser-Sync no
      // longer watches dist/ itself (see watchPaths in serve.config.ts).
      bs.reload();
      logSuccess(`Rebuilt in ${Date.now() - startTime}ms`);
      console.log('');
    } catch (error) {
      logError('Build failed', error as Error);
      console.log('');
    } finally {
      isBuilding = false;
      if (pending) {
        pending = false;
        void runBuild(lastFile);
      }
    }
  };

  const debouncedBuild = (filePath: string): void => {
    clearTimeout(buildTimeout);
    buildTimeout = setTimeout(() => {
      void runBuild(filePath);
    }, config.debounce);
  };

  watcher
    .on('change', debouncedBuild)
    .on('add', debouncedBuild)
    .on('unlink', debouncedBuild)
    .on('error', (error) => logError('Watcher error', error as Error));

  watcher.on('ready', () => {
    const watchedDirs = Object.keys(watcher.getWatched()).length;
    logInfo(`Watching: ${config.sourcePaths.join(', ')} (${watchedDirs} directories)`);
    if (watchedDirs === 0) {
      logError('Watcher found nothing to watch. Check sourcePaths in serve.config.ts (no globs allowed).');
    }
    console.log('');
  });
}

// ============================================================================
// ENTRY POINT
// ============================================================================

console.log('');
logInfo('Starting DNN theme development server...');
console.log('');

try {
  startBrowserSync();
  watchSourceFiles();

  logInfo('Ready! Edit files in src/ and browser will auto-refresh.');
  logInfo('Press Ctrl+C to stop.');
  console.log('');
} catch (error) {
  console.log('');
  logError('Failed to start development server', error as Error);
  console.log('');
  console.log('💡 Troubleshooting:');
  console.log(`  - Is your DNN site running at ${config.dnnUrl}?`);
  console.log(`  - Is port ${config.port} already in use?`);
  console.log(`  - Check serve.config.ts for correct settings`);
  console.log('');
  process.exit(1);
}
