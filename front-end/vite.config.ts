// front-end/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './', // make all paths relative
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: '../dist-app', // <-- match where Electron looks
    emptyOutDir: true
  }
});

