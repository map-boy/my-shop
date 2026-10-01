import sharp from 'sharp';
for (const s of [192, 512]) {
  await sharp('public/favicon.svg', { density: 600 })
    .resize(s, s, { fit: 'contain', background: '#0b0b0f' })
    .flatten({ background: '#0b0b0f' })
    .png()
    .toFile(`public/icon-${s}.png`);
}
console.log('icons ok');