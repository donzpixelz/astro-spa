import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  // Your code + assets live under app/astro
  srcDir: 'app/astro/src',
  publicDir: 'app/astro/public',
  // Build output (matches what you had)
  outDir: 'app/astro/dist',
  // Local dev server settings (only used if you run "npm run dev")
  server: { port: 4321, strictPort: true }
});
