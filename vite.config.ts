import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // This tells Vite's build tool (Rollup) to not try and bundle 'pdfjs-dist'.
      // It assumes this module will be provided externally, which it is by the
      // importmap in your index.html file. This directly fixes the build error.
      external: [
        'pdfjs-dist'
      ]
    }
  }
});
