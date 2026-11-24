import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    target: ['es2015', 'chrome70', 'edge79', 'safari13'],
    cssTarget: ['chrome70', 'es2015']
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/server-api': {
        target: 'https://kaswifi.my.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/server-api/, ''),
        cookieDomainRewrite: '',
        secure: false
      }
    }
  }
});
