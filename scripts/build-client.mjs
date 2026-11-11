import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'dsh-device-deck';
const OUT = path.join(ROOT, 'lib/client.js');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

await build({
  entryPoints: [path.join(ROOT, 'src/client/index.js')],
  outfile: OUT,
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  external: ['react', 'react-dom'],
  sourcemap: 'external',
  sourcesContent: true,
  legalComments: 'none',
  logLevel: 'info',
  banner: {
    js: [
      'window.__ModuleLoader__.load({',
      `  id: '${ID}',`,
      '  factory(require) {',
      '    var module = { exports: {} };',
      '    var exports = module.exports;',
    ].join('\n'),
  },
  footer: {
    js: [
      '    return module.exports.default ?? module.exports;',
      '  },',
      '});',
    ].join('\n'),
  },
});

console.log(`built ${path.relative(ROOT, OUT)}`);
