import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  server: {
    proxy: {
      // Proxy Browser Print requests during development
      '/browserprint': {
        target: 'https://localhost:9101',
        changeOrigin: true,
        secure: false, // Accept self-signed certificates
        rewrite: (path) => path.replace(/^\/browserprint/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      // Treat Browser Print SDK as external globals
      external: ['BrowserPrint', 'BrowserPrint.Zebra'],
    },
  },
});
