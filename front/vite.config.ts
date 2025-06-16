import { defineConfig } from 'vite';
import { resolve } from 'path';

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
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  plugins: [
    {
      name: 'html-import',
      enforce: 'pre',
      transform(code, id) {
        // Only process HTML files inside the views folder
        if (id.includes('/views/') && id.endsWith('.html')) {
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: null
          };
        }
      }
    }
  ],
  build: {
    // Generate source maps for easier debugging
    sourcemap: true,
    // Ensure assets are processed correctly
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
});