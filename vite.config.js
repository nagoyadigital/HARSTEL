import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libs into separate chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-tooltip', '@radix-ui/react-popover'],
          'chart-vendor': ['recharts'],
          'utils-vendor': ['date-fns', 'lodash', 'clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
    // Reduce sourcemap size (no sourcemaps for prod)
    sourcemap: false,
    // Minify aggressively
    minify: 'esbuild',
    target: 'es2020',
  },
})
