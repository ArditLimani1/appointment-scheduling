import sharp from 'sharp';
import { writeFileSync } from 'fs';

const appIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="108" fill="#f5f6f8"/>
  <g fill="none" stroke="#0E0E11" stroke-width="36" stroke-linecap="round" transform="translate(128 128) scale(4)">
    <circle cx="32" cy="32" r="27"/>
    <line x1="20" y1="46" x2="44" y2="18"/>
    <line x1="32" y1="11" x2="32" y2="14"/>
    <line x1="32" y1="50" x2="32" y2="53"/>
  </g>
</svg>`;

const source = Buffer.from(appIconSvg);

const outputs = [
    ['public/apple-touch-icon.png', 180],
    ['public/icon-192.png', 192],
    ['public/icon-512.png', 512],
];

for (const [file, size] of outputs) {
    await sharp(source).resize(size, size).png().toFile(file);
    console.log(`Wrote ${file}`);
}
