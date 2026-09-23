import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function ipaDownloadPlugin(): Plugin {
  return {
    name: 'ipa-download-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const parsedUrl = (req.url || '').split('?')[0];
        if (parsedUrl === '/RetinaArcade.ipa') {
          const filePath = path.resolve(__dirname, 'public/RetinaArcade.ipa');
          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            res.writeHead(200, {
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': 'attachment; filename="RetinaArcade.ipa"',
              'Content-Length': stat.size,
            });
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        if (parsedUrl === '/RetinaArcade-Xcode-iOS6.zip') {
          const filePath = path.resolve(__dirname, 'public/RetinaArcade-Xcode-iOS6.zip');
          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            res.writeHead(200, {
              'Content-Type': 'application/zip',
              'Content-Disposition': 'attachment; filename="RetinaArcade-Xcode-iOS6.zip"',
              'Content-Length': stat.size,
            });
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), ipaDownloadPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
