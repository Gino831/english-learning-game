import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    // GitHub Pages 部署路徑設定
    base: '/english-learning-game/',
    plugins: [
        react(),
        tailwindcss(),
    ],
})
