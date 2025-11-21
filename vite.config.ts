import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use the PORT environment variable if available (Cloud Run and local previews set this).
// Fallback to 8080 for Cloud Run defaults if not set.
const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: port,
    // Allow the app to be accessed from any host/domain (essential for cloud previews)
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: port,
    allowedHosts: true,
  },
  define: {
    // Polyfill process.env to ensure `process.env.API_KEY` works in the browser
    'process.env': process.env
  }
});