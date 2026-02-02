import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Usar './' torna os caminhos dos assets relativos ao index.html.
  // Isto resolve o problema de 404 no GitHub Pages e funciona em qualquer subpasta.
  base: './',
});