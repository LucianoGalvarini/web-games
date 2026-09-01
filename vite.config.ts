import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { unoPlugin } from './uno.plugin.ts'

export default defineConfig({
  plugins: [react(), unoPlugin()],
  base: process.env.GITHUB_PAGES === 'true' ? '/web-games/' : '/',
  server: {
    host: true,
  },
})
