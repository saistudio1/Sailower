import type {
  ElementBounds,
  LogoElement,
  LowerThirdDesign,
  ShapeElement,
  TextElement,
} from '../types/studio';
import type { AnimationFrameState } from './layoutMath';

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace('#', '').trim();
  let r = 0;
  let g = 0;
  let b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length >= 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  }
  const a = Math.max(0, Math.min(1, opacity));
  return `rgba(${Number.isNaN(r) ? 0 : r}, ${Number.isNaN(g) ? 0 : g}, ${Number.isNaN(b) ? 0 : b}, ${a})`;
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.max(0, Math.min(r, Math.min(Math.abs(w), Math.abs(h)) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function measureLineWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number
): number {
  if (!text) return 0;
  if (Math.abs(letterSpacing) < 0.05) {
    return ctx.measureText(text).width;
  }
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    total += ctx.measureText(text[i]).width;
    if (i < text.length - 1) total += letterSpacing;
  }
  return total;
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number,
  letterSpacing: number
): string[] {
  const paragraphs = rawText.split(/\r?\n/);
  const lines: string[] = [];
  const limit = maxWidth > 40 ? maxWidth : 1400;

  for (const para of paragraphs) {
    const trimmed = para;
    if (!trimmed) {
      lines.push('');
      continue;
    }
    const words = trimmed.split(/\s+/);
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measureLineWithSpacing(ctx, candidate, letterSpacing) <= limit || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length > 0 ? lines : [''];
}

function drawTextLineWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
  align: CanvasTextAlign
): void {
  if (Math.abs(letterSpacing) < 0.05) {
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    return;
  }

  const totalWidth = measureLineWithSpacing(ctx, text, letterSpacing);
  let cursorX = x;
  if (align === 'center') cursorX = x - totalWidth / 2;
  else if (align === 'right') cursorX = x - totalWidth;

  ctx.textAlign = 'left';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    ctx.fillText(ch, cursorX, y);
    cursorX += ctx.measureText(ch).width + letterSpacing;
  }
}

export function buildFontString(el: Pick<TextElement, 'fontWeight' | 'fontSize' | 'fontFamily'>): string {
  const safeFamily = el.fontFamily.includes(' ') ? `"${el.fontFamily}"` : el.fontFamily;
  return `${el.fontWeight} ${el.fontSize}px ${safeFamily}, "Plus Jakarta Sans", "DM Sans", system-ui, sans-serif`;
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeElement,
  design: LowerThirdDesign,
  lineProgress: number
): void {
  if (!shape.visible || shape.width <= 0 || shape.height <= 0) return;

  ctx.save();
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  if (shape.rotation !== 0) {
    ctx.translate(cx, cy);
    ctx.rotate((shape.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  let drawW = shape.width;
  let drawH = shape.height;
  if (shape.kind === 'line' || shape.kind === 'accentBar') {
    if (shape.width >= shape.height) {
      drawW = Math.max(0, shape.width * lineProgress);
    } else {
      drawH = Math.max(0, shape.height * lineProgress);
    }
  }

  if (design.effects.shadowEnabled && (shape.kind === 'panel' || shape.kind === 'badgeBox' || shape.kind === 'frame')) {
    ctx.shadowColor = hexToRgba(design.effects.shadowColor, design.effects.shadowOpacity);
    ctx.shadowBlur = design.effects.shadowBlur;
    ctx.shadowOffsetX = design.effects.shadowOffsetX;
    ctx.shadowOffsetY = design.effects.shadowOffsetY;
  }

  if (shape.kind === 'circle') {
    const rx = drawW / 2;
    const ry = drawH / 2;
    ctx.beginPath();
    ctx.ellipse(shape.x + rx, shape.y + ry, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
    ctx.closePath();
  } else if (shape.kind === 'diamond') {
    const midX = shape.x + drawW / 2;
    const midY = shape.y + drawH / 2;
    ctx.beginPath();
    ctx.moveTo(midX, shape.y);
    ctx.lineTo(shape.x + drawW, midY);
    ctx.lineTo(midX, shape.y + drawH);
    ctx.lineTo(shape.x, midY);
    ctx.closePath();
  } else {
    drawRoundedRectPath(ctx, shape.x, shape.y, drawW, drawH, shape.borderRadius);
  }

  if (shape.fillOpacity > 0 && shape.kind !== 'frame') {
    ctx.fillStyle = hexToRgba(shape.fillColor, shape.fillOpacity);
    ctx.fill();
  } else if (shape.kind === 'frame' && shape.fillOpacity > 0) {
    ctx.fillStyle = hexToRgba(shape.fillColor, shape.fillOpacity);
    ctx.fill();
  }

  // Disable shadow before drawing stroke so border stays crisp
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  if (shape.strokeWidth > 0) {
    ctx.strokeStyle = hexToRgba(shape.strokeColor, Math.max(0.01, shape.fillOpacity > 0 ? 1 : 1));
    ctx.lineWidth = shape.strokeWidth;
    ctx.stroke();
  }

  ctx.restore();
}

function drawTextElement(
  ctx: CanvasRenderingContext2D,
  el: TextElement,
  paddingLeft: number,
  paddingTop: number
): void {
  if (!el.visible || !el.content.trim()) return;

  ctx.save();
  ctx.font = buildFontString(el);
  ctx.textBaseline = 'top';
  ctx.fillStyle = hexToRgba(el.color, el.opacity);

  const rawText = el.uppercase ? el.content.toUpperCase() : el.content;
  const lines = wrapTextLines(ctx, rawText, el.maxWidth, el.letterSpacing);
  const linePx = el.fontSize * el.lineHeight;

  const anchorX = paddingLeft + el.offsetX;
  const anchorY = paddingTop + el.offsetY;

  if (el.rotation !== 0) {
    ctx.translate(anchorX, anchorY);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.translate(-anchorX, -anchorY);
  }

  for (let i = 0; i < lines.length; i++) {
    drawTextLineWithSpacing(
      ctx,
      lines[i],
      anchorX,
      anchorY + i * linePx,
      el.letterSpacing,
      el.textAlign
    );
  }

  ctx.restore();
}

function drawLogoElement(
  ctx: CanvasRenderingContext2D,
  logo: LogoElement,
  img: HTMLImageElement | undefined
): void {
  if (!logo.visible || !img || !img.complete || img.naturalWidth === 0) return;

  ctx.save();
  ctx.globalAlpha *= Math.max(0, Math.min(1, logo.opacity));
  const cx = logo.x + logo.width / 2;
  const cy = logo.y + logo.height / 2;
  if (logo.rotation !== 0) {
    ctx.translate(cx, cy);
    ctx.rotate((logo.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, logo.x, logo.y, logo.width, logo.height);
  ctx.restore();
}

export function computeGroupLocalBounds(
  ctx: CanvasRenderingContext2D,
  design: LowerThirdDesign
): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  elements: ElementBounds[];
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const elements: ElementBounds[] = [];

  for (const s of design.shapes) {
    if (!s.visible) continue;
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x + s.width);
    maxY = Math.max(maxY, s.y + s.height);
    elements.push({
      kind: 'shape',
      id: s.id,
      label: s.name,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      zIndex: s.zIndex,
    });
  }

  for (const l of design.logos) {
    if (!l.visible) continue;
    minX = Math.min(minX, l.x);
    minY = Math.min(minY, l.y);
    maxX = Math.max(maxX, l.x + l.width);
    maxY = Math.max(maxY, l.y + l.height);
    elements.push({
      kind: 'logo',
      id: l.id,
      label: l.name,
      x: l.x,
      y: l.y,
      width: l.width,
      height: l.height,
      zIndex: l.zIndex,
    });
  }

  const padL = design.layout.paddingLeft;
  const padT = design.layout.paddingTop;

  for (const t of design.texts) {
    if (!t.visible || !t.content.trim()) continue;
    ctx.save();
    ctx.font = buildFontString(t);
    const raw = t.uppercase ? t.content.toUpperCase() : t.content;
    const lines = wrapTextLines(ctx, raw, t.maxWidth, t.letterSpacing);
    let maxLineW = 0;
    for (const line of lines) {
      maxLineW = Math.max(maxLineW, measureLineWithSpacing(ctx, line, t.letterSpacing));
    }
    ctx.restore();

    const totalH = Math.max(t.fontSize, lines.length * t.fontSize * t.lineHeight);
    let boxX = padL + t.offsetX;
    if (t.textAlign === 'center') boxX -= maxLineW / 2;
    else if (t.textAlign === 'right') boxX -= maxLineW;
    const boxY = padT + t.offsetY;

    minX = Math.min(minX, boxX);
    minY = Math.min(minY, boxY);
    maxX = Math.max(maxX, boxX + maxLineW);
    maxY = Math.max(maxY, boxY + totalH);
    elements.push({
      kind: 'text',
      id: t.id,
      label: t.fieldLabel,
      x: boxX,
      y: boxY,
      width: Math.max(24, maxLineW),
      height: totalH,
      zIndex: t.zIndex,
    });
  }

  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 600, maxY: 140, width: 600, height: 140, elements };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
    elements,
  };
}

export function renderLowerThirdToCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  design: LowerThirdDesign,
  loadedImages: Map<string, HTMLImageElement>,
  animState?: AnimationFrameState
): void {
  const anim: AnimationFrameState = animState || {
    phase: 'hold',
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scale: 1,
    clipProgress: 1,
    lineProgress: 1,
  };

  if (anim.opacity <= 0.002) return;

  const bounds = computeGroupLocalBounds(ctx, design);
  const scale = design.layout.scale * anim.scale;
  const originX = design.layout.anchorX + design.layout.marginX + anim.translateX;
  const originY = design.layout.anchorY + design.layout.marginY + anim.translateY;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, anim.opacity));

  // Scale around group center if scale-in is active
  const groupCenterX = originX + (bounds.minX + bounds.width / 2) * design.layout.scale;
  const groupCenterY = originY + (bounds.minY + bounds.height / 2) * design.layout.scale;

  if (anim.scale !== 1) {
    ctx.translate(groupCenterX, groupCenterY);
    ctx.scale(anim.scale, anim.scale);
    ctx.translate(-groupCenterX, -groupCenterY);
  }

  ctx.translate(originX, originY);
  ctx.scale(design.layout.scale, design.layout.scale);

  // Reveal clip mask if animating reveal/line-reveal
  if (anim.clipProgress < 0.999) {
    const pad = 40;
    const clipW = (bounds.width + pad * 2) * Math.max(0, anim.clipProgress);
    ctx.beginPath();
    ctx.rect(bounds.minX - pad, bounds.minY - pad, clipW, bounds.height + pad * 2);
    ctx.clip();
  }

  // Merge all renderables by zIndex so layer ordering works cleanly across shapes, logos, texts
  type DrawItem =
    | { kind: 'shape'; z: number; order: number; item: ShapeElement }
    | { kind: 'logo'; z: number; order: number; item: LogoElement }
    | { kind: 'text'; z: number; order: number; item: TextElement };

  const queue: DrawItem[] = [];
  let order = 0;
  for (const s of design.shapes) queue.push({ kind: 'shape', z: s.zIndex, order: order++, item: s });
  for (const l of design.logos) queue.push({ kind: 'logo', z: l.zIndex, order: order++, item: l });
  for (const t of design.texts) queue.push({ kind: 'text', z: t.zIndex, order: order++, item: t });

  queue.sort((a, b) => (a.z !== b.z ? a.z - b.z : a.order - b.order));

  for (const entry of queue) {
    if (entry.kind === 'shape') {
      drawShape(ctx, entry.item, design, anim.lineProgress);
    } else if (entry.kind === 'logo') {
      drawLogoElement(ctx, entry.item, loadedImages.get(entry.item.id));
    } else {
      drawTextElement(ctx, entry.item, design.layout.paddingLeft, design.layout.paddingTop);
    }
  }

  ctx.restore();

  // Keep reference to canvas dimensions to avoid unused parameter lint warnings
  void canvasWidth;
  void canvasHeight;
  void scale;
}

export async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        if (typeof img.decode === 'function') {
          await img.decode();
        }
      } catch {
        // Fallback if decode rejects on SVG data URLs in some browsers
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error('Gagal memuat aset gambar logo.'));
    img.src = src;
  });
}

export async function ensureDesignFontsLoaded(design: LowerThirdDesign): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    const loads = design.texts
      .filter((t) => t.visible && t.content.trim())
      .map((t) => {
        const face = t.fontFamily.includes(' ') ? `"${t.fontFamily}"` : t.fontFamily;
        return document.fonts.load(`${t.fontWeight} ${Math.max(16, t.fontSize)}px ${face}`);
      });
    await Promise.allSettled(loads);
    await document.fonts.ready;
  } catch {
    // Graceful fallback if fonts API fails offline
  }
}

export async function exportDesignToPngBlob(
  design: LowerThirdDesign,
  width: number,
  height: number,
  existingImages?: Map<string, HTMLImageElement>
): Promise<{ blob: Blob; dataUrl: string; hasAlphaTransparency: boolean }> {
  await ensureDesignFontsLoaded(design);

  const imageMap = new Map<string, HTMLImageElement>();
  for (const logo of design.logos) {
    if (!logo.visible) continue;
    const cached = existingImages?.get(logo.id);
    if (cached && cached.complete && cached.naturalWidth > 0 && cached.src === logo.dataUrl) {
      imageMap.set(logo.id, cached);
    } else {
      try {
        const loaded = await loadImageElement(logo.dataUrl);
        imageMap.set(logo.id, loaded);
      } catch {
        // Skip broken image gracefully
      }
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
  if (!ctx) {
    throw new Error('Browser tidak mendukung Canvas 2D RGBA context.');
  }

  // Crucial: clear entire canvas to pure RGBA transparent (0, 0, 0, 0)
  ctx.clearRect(0, 0, width, height);

  renderLowerThirdToCanvas(ctx, width, height, design, imageMap);

  // Verify corner pixel alpha === 0 (or at least some transparent pixels exist)
  const sampleTL = ctx.getImageData(0, 0, 1, 1).data[3];
  const sampleTR = ctx.getImageData(Math.max(0, width - 1), 0, 1, 1).data[3];
  const hasAlphaTransparency = sampleTL === 0 || sampleTR === 0;

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Gagal mengonversi canvas ke PNG Blob.'));
    }, 'image/png');
  });

  return { blob, dataUrl, hasAlphaTransparency };
}
