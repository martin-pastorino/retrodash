import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('google')) return 'google-ai';
            return 'vendor';
          }
        }
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none'
  }
})
