import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base './' keeps the built site working from any S3 or CloudFront path.
export default defineConfig({
  plugins: [react()],
  base: './',
})
