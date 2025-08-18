export type AvatarOptions = {
  minSize?: number; // 256
  maxSize?: number; // 512
  maxBytes?: number; // 1 MB
  preferFormat?: 'auto' | 'png' | 'jpeg' | 'webp';
  quality?: number; // For jpeg/webp
};

const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type SupportedType = typeof SUPPORTED_TYPES[number];

export function isSupportedType(type: string): type is SupportedType {
  return (SUPPORTED_TYPES as readonly string[]).includes(type);
}

export async function processAvatarFile(
  file: File,
  opts: AvatarOptions = {}
): Promise<{ blob: Blob; previewUrl: string; width: number; height: number; type: SupportedType } > {
  const {
    minSize = 256,
    maxSize = 512,
    maxBytes = 1_000_000,
    preferFormat = 'auto',
    quality = 0.82,
  } = opts;

  if (!isSupportedType(file.type)) {
    throw new Error('Formato no soportado. Usa PNG, JPEG o WebP.');
  }

  const imgUrl = URL.createObjectURL(file);
  const img = await loadImage(imgUrl);

  // Center-crop a square and then resize to fit in [minSize, maxSize]
  const { sx, sy, s } = squareCropSource(img.width, img.height);
  const target = chooseTargetSize(s, minSize, maxSize);

  const canvas = document.createElement('canvas');
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no soportado');

  // High quality scaling hints
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, s, s, 0, 0, target, target);

  const hasAlpha = detectAlpha(ctx, target, target);
  const outType = decideOutputType({ preferFormat, hasAlpha });

  let blob: Blob = await canvasToBlob(canvas, outType, outType === 'image/png' ? undefined : quality);

  // Try reduce quality if needed
  if ((outType === 'image/jpeg' || outType === 'image/webp') && blob.size > maxBytes) {
    let q = quality;
    while (q > 0.5 && blob.size > maxBytes) {
      q -= 0.08;
      blob = await canvasToBlob(canvas, outType, q);
    }
  }

  // If still too big and we used maxSize, try minSize
  if (blob.size > maxBytes && target !== minSize) {
    const canvas2 = document.createElement('canvas');
    canvas2.width = minSize;
    canvas2.height = minSize;
    const ctx2 = canvas2.getContext('2d');
    if (!ctx2) throw new Error('Canvas no soportado');
    ctx2.imageSmoothingEnabled = true;
    ctx2.imageSmoothingQuality = 'high';
    ctx2.drawImage(img, sx, sy, s, s, 0, 0, minSize, minSize);
    blob = await canvasToBlob(canvas2, outType, outType === 'image/png' ? undefined : Math.max(quality - 0.1, 0.65));
  }

  URL.revokeObjectURL(imgUrl);
  const previewUrl = URL.createObjectURL(blob);
  return { blob, previewUrl, width: target, height: target, type: outType };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function squareCropSource(w: number, h: number) {
  if (w === h) return { sx: 0, sy: 0, s: w };
  if (w > h) {
    const s = h;
    const sx = Math.floor((w - h) / 2);
    return { sx, sy: 0, s };
  } else {
    const s = w;
    const sy = Math.floor((h - w) / 2);
    return { sx: 0, sy, s };
  }
}

function chooseTargetSize(sourceSquare: number, minSize: number, maxSize: number) {
  const clampedMax = Math.min(maxSize, sourceSquare);
  const clampedMin = Math.min(minSize, clampedMax);
  // Prefer max if we have enough resolution, otherwise fallback
  return sourceSquare >= maxSize ? maxSize : (sourceSquare >= minSize ? sourceSquare : clampedMin);
}

function detectAlpha(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  // Sample a small grid to detect any transparency
  const sampleW = Math.min(96, w);
  const sampleH = Math.min(96, h);
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
  for (let i = 3; i < imgData.length; i += 4) {
    if (imgData[i] < 255) return true;
  }
  return false;
}

function decideOutputType(params: {
  preferFormat: AvatarOptions['preferFormat'];
  hasAlpha: boolean;
}): SupportedType {
  const { preferFormat, hasAlpha } = params;
  if (preferFormat && preferFormat !== 'auto') {
    if (preferFormat === 'png') return 'image/png';
    if (preferFormat === 'jpeg') return 'image/jpeg';
    return 'image/webp';
  }
  if (hasAlpha) return 'image/png';
  // Favor WebP for photos
  return 'image/webp';
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((res, rej) => {
    canvas.toBlob((blob) => {
      if (!blob) return rej(new Error('No se pudo generar la imagen.'));
      res(blob);
    }, type, quality);
  });
}
