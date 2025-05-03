import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      usePolling: true,
    },
    port: 8089,
    proxy: {
      '/back': {
        target: 'http://azhemon.azh:8099',
        changeOrigin: true,
      }
    }
  }
});