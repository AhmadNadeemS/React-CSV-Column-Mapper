import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'web-worker-loader-shim',
      async resolveId(id, importer) {
        if (id.startsWith('web-worker:')) {
          const plainId = id.slice('web-worker:'.length);
          const resolution = await this.resolve(plainId, importer);
          if (resolution) {
            return resolution.id + '?worker&inline';
          }
        }
      }
    }
  ],
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  }
})
