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
      name: 'template-import',
      enforce: 'pre',
      transform(code, id) {
        // Only process .template files
        if (id.endsWith('.template')) {
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: null
          };
        }
      }
    }
  ],
  build: {
    sourcemap: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
});