import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/',

  server: {
    proxy: {
      // everything starting with /commoditic goes to the real API
      '/commoditic': {
        target: 'https://api.commoditic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/commoditic/, '')
      }
    }
  },

  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        loader: resolve(__dirname, 'src/index.html'),
        homepage: resolve(__dirname, 'src/homepage.html'),
        geologie: resolve(__dirname, 'src/geologie/index.html'),
        vindplaatsen: resolve(__dirname, 'src/vindplaatsen/index.html'),
        productie: resolve(__dirname, 'src/productie/index.html'),
        mining: resolve(__dirname, 'src/mining/index.html'),
        verwerking:resolve(__dirname, 'src/verwerking/index.html'),
        toepassing: resolve(__dirname, 'src/toepassingen/index.html'),
        price:resolve(__dirname, 'src/price/index.html'),
        questions: resolve(__dirname, 'src/questions/index.html'),
        thankyou: resolve(__dirname, 'src/thankyou/index.html')
      }
    }
  }
});
