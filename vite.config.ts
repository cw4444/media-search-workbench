import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base:
    command === 'serve'
      ? '/'
      : process.env.VERCEL
        ? '/'
        : '/media-search-workbench/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
}));
