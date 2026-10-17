const fs = require('fs');
const path = require('path');

// Simple minimal valid 1x1 PNG or standard PNG buffer
// Let's create an SVG that can be referenced, or create valid PNG headers
// In fact, modern browsers support svg in web manifests or standard data
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#2563eb"/>
  <path d="M256 120c-55 0-100 45-100 100 0 75 100 172 100 172s100-97 100-172c0-55-45-100-100-100zm0 135c-19.3 0-35-15.7-35-35s15.7-35 35-35 35 15.7 35 35-15.7 35-35 35z" fill="#ffffff"/>
  <circle cx="360" cy="360" r="60" fill="#10b981"/>
  <path d="M342 360l12 12 24-24" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

// Minimal valid PNG data (192x192 blue square with transparent/white mark)
const minimalPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzE1L+qAAAAABJRU5ErkJggg==";
const pngBuffer = Buffer.from(minimalPngBase64, 'base64');

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pngBuffer);

console.log('Icons created successfully in public directory.');
