import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'KanWidget',
      formats: ['umd', 'es'],
      fileName: (format) => `kan-widget.${format}.js`,
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    target: 'es2020',
    sourcemap: true,
  },
});
