import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — loaded on every page
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Heavy graph library — only for studio
          'graph-vendor': ['@xyflow/react'],
          // Charts — only for dashboard/billing
          'chart-vendor': ['recharts'],
          // Animation — defer loading
          'animation-vendor': ['framer-motion'],
          // UI utilities
          'ui-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false, // Disable for production
    target: 'esnext',
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/health': 'http://localhost:3000',
      '/metrics': 'http://localhost:3000',
    },
  },
})
