import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Define a base URL para o deploy no GitHub Pages.
  // O valor deve ser o nome do teu repositório, entre barras.
  base: '/sportBet-App/',
});