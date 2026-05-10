import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/DevSecOps1/', // CRITICAL: Must match your repo name with slashes
})