const fs = require('fs');
const path = require('path');

console.log('Creating standalone HTML file...');

// Read the built HTML
const htmlPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

// Find the JS file reference
const jsMatch = html.match(/src="\/assets\/(index-[^"]+\.js)"/);
if (!jsMatch) {
  console.error('Could not find JS file reference in HTML');
  process.exit(1);
}

const jsFileName = jsMatch[1];
const jsPath = path.join(__dirname, 'dist', 'assets', jsFileName);
const jsContent = fs.readFileSync(jsPath, 'utf-8');

// Replace the script tag with inline script
html = html.replace(
  /<script type="module" crossorigin src="\/assets\/[^"]+\.js"><\/script>/,
  `<script type="module">${jsContent}</script>`
);

// Write standalone file
const standalonePath = path.join(__dirname, 'standalone.html');
fs.writeFileSync(standalonePath, html, 'utf-8');

console.log('✓ Created standalone.html');
console.log(`  Size: ${(fs.statSync(standalonePath).size / 1024).toFixed(2)} KB`);
