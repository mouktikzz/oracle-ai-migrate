
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Use esbuild for faster builds and less memory usage
    minify: 'esbuild',
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 2000,
    // Disable source maps to reduce memory usage
    sourcemap: false,
    // Optimize rollup options
    rollupOptions: {
      output: {
        // Split chunks to reduce memory usage
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
