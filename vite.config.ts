import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // relativní cesty — build funguje i v podadresáři (GitHub Pages) i na Netlify
  base: './',
  plugins: [react()],
});
