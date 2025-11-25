import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://pet-management-ro9c.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});