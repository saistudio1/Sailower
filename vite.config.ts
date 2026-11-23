import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

const ROOT_DIR = import.meta.dirname;

function singleFileHtmlPlugin(): Plugin {
  return {
    name: 'single-file-html-bundle',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlKey = Object.keys(bundle).find((k) => k.endsWith('.html'));
      if (!htmlKey) return;
      const htmlAsset = bundle[htmlKey];
      if (htmlAsset.type !== 'asset') return;

      let html = String(htmlAsset.source);

      // Inline all CSS assets
      for (const [fileName, item] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && item.type === 'asset') {
          const cssText = String(item.source);
          const escapedName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const linkRegex = new RegExp(
            `<link[^>]+href=["'][^"']*${escapedName}["'][^>]*>`,
            'gi'
          );
          html = html.replace(linkRegex, '');
          html = html.replace('</head>', () => `<style>${cssText}</style>\n  </head>`);
          delete bundle[fileName];
        }
      }

      // Inline all JS chunks as classic <script> before </body> for file:// and Netlify compatibility
      for (const [fileName, item] of Object.entries(bundle)) {
        if (fileName.endsWith('.js') && item.type === 'chunk') {
          const safeJs = item.code.replace(/<\/script/gi, '<\\/script');
          const escapedName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const scriptRegex = new RegExp(
            `<script[^>]+src=["'][^"']*${escapedName}["'][^>]*>\\s*</script>`,
            'gi'
          );
          html = html.replace(scriptRegex, '');
          html = html.replace('</body>', () => `<script>${safeJs}</script>\n  </body>`);
          delete bundle[fileName];
        }
      }

      htmlAsset.source = html;
    },
    closeBundle(error?: Error): void {
      if (error) return;
      const distDir = path.resolve(ROOT_DIR, 'dist');
      const distIndex = path.resolve(distDir, 'index.html');
      const distRedirects = path.resolve(distDir, '_redirects');

      if (fs.existsSync(distIndex)) {
        // 1. Standalone single HTML file at root
        fs.copyFileSync(distIndex, path.resolve(ROOT_DIR, 'lower-third-studio.html'));

        // 2. Ready-to-drag Netlify Drop folder (contains index.html + _redirects)
        const netlifyDropDir = path.resolve(ROOT_DIR, 'netlify-drop');
        fs.mkdirSync(netlifyDropDir, {recursive: true});
        fs.copyFileSync(distIndex, path.resolve(netlifyDropDir, 'index.html'));
        if (fs.existsSync(distRedirects)) {
          fs.copyFileSync(distRedirects, path.resolve(netlifyDropDir, '_redirects'));
        }
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(ROOT_DIR, 'dist');
          const srcAssets = path.resolve(ROOT_DIR, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
      singleFileHtmlPlugin(),
    ],
    build: {
      assetsInlineLimit: 100000000,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          format: 'iife' as const,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(ROOT_DIR, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
