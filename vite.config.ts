import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Define a base path para o GitHub Pages
  // Se a variável de ambiente VITE_BASE_PATH existir (definida no workflow), usa-a.
  // Caso contrário, usa '/' (para desenvolvimento local).
  base: process.env.VITE_BASE_PATH || '/',
});