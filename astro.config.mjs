import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Le rendu serveur garde APP_SECRET hors du JavaScript envoyé au navigateur.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
