import { defineConfig } from 'vite';

export default defineConfig({
  // Use relative paths in the built index.html, so the game works wherever it's hosted —
  // including GitHub Pages, which serves it from a sub-folder (/KAT/), not the site root.
  base: './',
});
