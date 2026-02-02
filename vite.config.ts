import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  // For GitHub Pages deployment
  const isGitHubPages = process.env.GITHUB_PAGES === 'true';
  
  return {
    base: isGitHubPages ? '/Staubfaenger/' : './',
    build: {
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js'
        }
      }
    },
    test: {
      globals: true,
      environment: 'jsdom'
    }
  };
});
