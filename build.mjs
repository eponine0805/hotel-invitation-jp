import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

const files = ['index.html','app.js','content.js','style.css','icon.svg','manifest.webmanifest','sw.js','_headers','README.md','netlify.toml'];
const publishFiles = new Set(files.filter(f => f !== 'README.md' && f !== 'netlify.toml'));
const expandToRoot = process.argv.includes('--expand-to-root');
const destination = expandToRoot ? '.' : 'dist';
mkdirSync(destination, { recursive: true });
if (!expandToRoot && existsSync('index.html') && existsSync('app.js') && existsSync('content.js')) {
  for (const file of files) if (publishFiles.has(file) && existsSync(file)) copyFileSync(file, join(destination, file));
} else {
  const parts = Array.from({ length: 7 }, (_, n) => readFileSync('archive/part-' + String(n).padStart(2,'0') + '.txt', 'utf8').trim());
  const bundle = JSON.parse(gunzipSync(Buffer.from(parts.join(''), 'base64')).toString('utf8'));
  for (const [name, content] of Object.entries(bundle)) {
    if (!files.includes(name)) throw new Error('Unexpected output file: ' + name);
    if (!expandToRoot && !publishFiles.has(name)) continue;
    writeFileSync(join(destination, name), content, 'utf8');
  }
}
if (!existsSync(join(destination,'index.html'))) throw new Error('Missing index.html');
console.log('Netlify publish directory ready: ' + destination);
