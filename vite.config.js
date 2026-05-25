import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  
  return {
    plugins: [vue()],
    define: isBuild ? {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify("")
    } : {},
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
  }
})
