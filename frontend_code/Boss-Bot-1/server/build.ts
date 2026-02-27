import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

build({
  entryPoints: [path.resolve(__dirname, 'index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: path.resolve(__dirname, '../dist/index.js'),
  format: 'esm',
  external: [
    'express', 
    'vite', 
    'http', 
    'path', 
    'fs', 
    'nanoid',
    'pino',
    'pino-pretty',
    'firebase',
    'firebase/app',
    'firebase/auth',
    'firebase/firestore',
    '@babel/core',
    '@babel/preset-typescript'
  ],
}).catch(() => process.exit(1));
