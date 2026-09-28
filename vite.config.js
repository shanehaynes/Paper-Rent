import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { rename, mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// dist/paper-rent.html is one self-contained file that opens from file:// with no network.
// docs/index.html is the same file, served by GitHub Pages.
const renameOutput = () => ({
  name: 'rename-output',
  apply: 'build',
  async closeBundle() {
    await rename(resolve('dist/index.html'), resolve('dist/paper-rent.html'));
    await mkdir(resolve('docs'), { recursive: true });
    await copyFile(resolve('dist/paper-rent.html'), resolve('docs/index.html'));
  },
});

export default defineConfig({
  base: './',
  plugins: [viteSingleFile({ removeViteModuleLoader: true }), renameOutput()],
  build: { target: 'es2022', assetsInlineLimit: 100_000_000, cssCodeSplit: false },
});
