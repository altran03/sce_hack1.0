import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'extension',
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/content.js'),
        'captcha-overlay': resolve(__dirname, 'src/components/CaptchaOverlay.jsx')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    target: 'es2015',
    emptyOutDir: false // Don't clear extension folder
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
