import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { visualizer } from 'rollup-plugin-visualizer';
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
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'graph-vendor': ['@xyflow/react'],
                    'chart-vendor': ['recharts'],
                    'animation-vendor': ['framer-motion'],
                    'ui-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority', 'lucide-react'],
                },
            },
        },
        chunkSizeWarningLimit: 500,
        sourcemap: false,
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
});
//# sourceMappingURL=vite.config.js.map