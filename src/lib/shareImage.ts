// FILE: src/lib/shareImage.ts
import type { Product } from './types';

const CANVAS_W = 1080;
const CANVAS_H = 1920;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  let line = '';
  let lines: string[] = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines = lines.slice(0, 2);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}

export async function buildShareImage(
  product: Product,
  money: (n: number) => string,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.fillStyle = '#0b0b0c';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const src = product.images?.[0];
  if (src) {
    try {
      const img = await loadImage(src);
      const boxH = CANVAS_H * 0.72;
      const scale = Math.max(CANVAS_W / img.width, boxH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (CANVAS_W - w) / 2;
      const y = (boxH - h) / 2;
      ctx.drawImage(img, x, y, w, h);
    } catch {
      // No CORS / network failure: fall back to plain background rather than blocking the share.
    }
  }

  const gradY = CANVAS_H * 0.55;
  const grad = ctx.createLinearGradient(0, gradY, 0, CANVAS_H);
  grad.addColorStop(0, 'rgba(11,11,12,0)');
  grad.addColorStop(1, 'rgba(11,11,12,0.96)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, gradY, CANVAS_W, CANVAS_H - gradY);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 52px system-ui, sans-serif';
  ctx.textAlign = 'left';
  wrapText(ctx, product.name, 60, CANVAS_H - 260, CANVAS_W - 120, 62);

  ctx.font = '800 88px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(money(product.price), 60, CANVAS_H - 110);

  if (product.compareAtPrice > product.price) {
    const priceW = ctx.measureText(money(product.price)).width;
    const oldLabel = money(product.compareAtPrice);
    ctx.font = '500 44px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(oldLabel, 60 + priceW + 28, CANVAS_H - 110);
    const oldW = ctx.measureText(oldLabel).width;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60 + priceW + 28, CANVAS_H - 128);
    ctx.lineTo(60 + priceW + 28 + oldW, CANVAS_H - 128);
    ctx.stroke();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png', 0.95);
  });
}

export async function shareProductToStatus(
  product: Product,
  money: (n: number) => string,
): Promise<'shared' | 'downloaded'> {
  const blob = await buildShareImage(product, money);
  const file = new File([blob], `${product.slug || product.id}.png`, { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: product.name,
      text: `${product.name} — ${money(product.price)}`,
    });
    return 'shared';
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${product.slug || product.id}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return 'downloaded';
}