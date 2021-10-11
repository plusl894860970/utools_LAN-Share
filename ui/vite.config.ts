import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { join } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: join(__dirname, '../utools/gui'),
  build: {
    outDir: '../utools/gui/',
  },
  plugins: [
    vue(),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ]
})
