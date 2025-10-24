import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Production build optimized for Cloudflare Pages
export default defineConfig({
  plugins: [react()],
  
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps for production
    minify: 'terser',
    
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          'date-vendor': ['date-fns'],
          'chart-vendor': ['recharts']
        }
      }
    },
    
    // Optimize for Cloudflare limits
    chunkSizeWarningLimit: 1000,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },

  define: {
    'process.env.NODE_ENV': '"production"',
  },

  // Optimize assets
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],

  // Server configuration for development
  server: {
    port: 5173,
    host: true,
  },

  // Preview configuration
  preview: {
    port: 4173,
    host: true,
  },
});
