import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Removed proxy configuration since we're using direct API calls to external services
    // Evolution API calls go directly to https://cloudsaas.geni.chat
    // Supabase Edge Functions are called directly via the Supabase client
  },
  plugins: [
    react(),
    // Remove lovable-tagger for production builds to avoid ESM compatibility issues
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['axios'],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
}));
