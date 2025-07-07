import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    https: {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./certificate.pem'),
    },
    host: true,
    port: 8080,
  },
})
