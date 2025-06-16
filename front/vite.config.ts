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
  },
  plugins: [
    {
      name: 'html-import',
      transform(code, id) {
        if (id.endsWith('.html') && !id.endsWith('index.html')) {
          return `export default ${JSON.stringify(code)};`;
        }
      }
    }
  ]
});