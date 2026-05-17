import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable source maps for debugging
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
  },

  // Environment variables
  define: {
    __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL || ''),
  },
});
