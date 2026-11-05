interface ServeConfig {
  /** The local DNN site URL to proxy. */
  dnnUrl: string;
  /** Port for the Browser-Sync dev server. */
  port: number;
  /** Glob patterns Browser-Sync watches for browser reload. */
  watchPaths: string[];
  /** Directories or files chokidar watches to trigger a Vite rebuild (no globs: chokidar 4+ doesn't expand them). */
  sourcePaths: string[];
  /** Debounce delay in milliseconds before rebuilding after a file change. */
  debounce: number;
}

const config: ServeConfig = {
  dnnUrl: 'https://mysite.loc',
  port: 3000,
  watchPaths: ['containers/**/*', '*.ascx'],
  sourcePaths: ['src'],
  debounce: 300,
};

export default config;