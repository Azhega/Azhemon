import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8089,
    // Supposons que ton API PHP est accessible sur localhost:80/api
    proxy: {
      '/back': {
        target: 'http://azhemon.azh:89',
        changeOrigin: true,
        // Optionnel: Si ton API n'a pas de préfixe '/api', tu peux le supprimer des requêtes
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});