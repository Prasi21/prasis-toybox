import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// `base: './'` emits relative asset paths, so the built site works whether it is
// served from a GitHub Pages project path (https://user.github.io/repo/), a
// user/organisation page, or a custom domain — no config changes needed when
// you rename the repo.
export default defineConfig({
  base: './',
  plugins: [react()],
})
