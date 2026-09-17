// Cloudflare Pages silently drops any uploaded path containing a
// "node_modules" segment. `expo export --platform web` puts vendor assets
// (the Ionicons font, expo-router's built-in icons, etc.) under
// dist/assets/node_modules/..., mirroring their real package path — those
// files 200 with an HTML body instead of the real asset once deployed,
// which for the font specifically means every icon in the app silently
// renders as a tofu box. Run this after every `expo export --platform web`
// and before deploying to Cloudflare Pages: renames dist/assets/node_modules
// to dist/assets/vendor and rewrites the matching string literals baked
// into the exported JS/CSS/HTML.
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const from = path.join(distDir, 'assets', 'node_modules');
const to = path.join(distDir, 'assets', 'vendor');

if (!fs.existsSync(from)) {
  console.log('No dist/assets/node_modules found — nothing to patch.');
  process.exit(0);
}

fs.renameSync(from, to);

const exts = new Set(['.js', '.css', '.html']);
let patchedFiles = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (exts.has(path.extname(entry.name))) {
      const contents = fs.readFileSync(full, 'utf8');
      if (contents.includes('assets/node_modules')) {
        fs.writeFileSync(full, contents.split('assets/node_modules').join('assets/vendor'));
        patchedFiles += 1;
      }
    }
  }
}

walk(distDir);

console.log(`Renamed dist/assets/node_modules -> dist/assets/vendor, patched ${patchedFiles} file(s).`);
