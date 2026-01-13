import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@mantine/core', '@mantine/hooks', '@mantine/carousel', '@mantine/dates', '@mantine/notifications', '@mantine/modals'],
  },
  resolve: {
    dedupe: ['@mantine/core', 'react', 'react-dom'],
  },
})
