import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/',

  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        mining: resolve(__dirname, 'src/mining/index.html'),
        toepassing: resolve(__dirname, 'src/toepassing/index.html'),
        questions: resolve(__dirname, 'src/questions/index.html'),
        thankyou: resolve(__dirname, 'src/thankyou/index.html'),
      },
    },
  },
});
