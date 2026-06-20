const sharp = require('sharp');
const path = require('path');

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2E0510" rx="80"/>
  <text x="256" y="350" font-family="Georgia, serif" font-size="300" fill="#FAF0F2" text-anchor="middle" dominant-baseline="auto">L</text>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  const buf = Buffer.from(svgIcon);
  for (const size of sizes) {
    await sharp(buf).resize(size, size).png()
      .toFile(path.join(__dirname, '..', 'public', `icon-${size}.png`));
    console.log(`icon-${size}.png`);
  }
  await sharp(buf).resize(180, 180).png()
    .toFile(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'));
  console.log('apple-touch-icon.png');
}

generate().catch(console.error);
