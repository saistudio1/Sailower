const DANGEROUS_TAGS = [
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'applet',
  'link',
  'meta',
  'base',
];

export interface SvgSanitizeResult {
  ok: boolean;
  sanitizedSvg?: string;
  dataUrl?: string;
  width?: number;
  height?: number;
  error?: string;
}

function parseNumericDimension(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const match = raw.trim().match(/^([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return undefined;
  const val = Number(match[1]);
  return Number.isFinite(val) && val > 0 ? val : undefined;
}

/**
 * Sanitizes an uploaded SVG string by removing executable scripts, foreignObjects,
 * inline event handlers (on*), and unsafe javascript:/data:text/html URIs.
 * Works safely in both browser DOMParser environments and headless unit tests.
 */
export function sanitizeSvgString(rawSvg: string): SvgSanitizeResult {
  if (!rawSvg || typeof rawSvg !== 'string') {
    return { ok: false, error: 'File SVG kosong atau tidak valid.' };
  }

  let cleaned = rawSvg
    .replace(/^\uFEFF/, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<\?xml[^>]*\?>/gi, '')
    .trim();

  if (!/<svg[\s>]/i.test(cleaned)) {
    return { ok: false, error: 'Elemen root <svg> tidak ditemukan.' };
  }

  // Strip dangerous tags (both paired and self-closing)
  for (const tag of DANGEROUS_TAGS) {
    const pairedRegex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    cleaned = cleaned.replace(pairedRegex, '').replace(selfClosingRegex, '');
  }

  // Strip inline event handler attributes (e.g. onclick="...", onload='...')
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Strip javascript: or vbscript: or data:text/html in href / xlink:href / src
  cleaned = cleaned.replace(
    /\s+(?:xlink:)?(?:href|src)\s*=\s*(?:"\s*(?:javascript|vbscript|data:text\/html)[^"]*"|'\s*(?:javascript|vbscript|data:text\/html)[^']*')/gi,
    ''
  );

  // Strip CSS expressions / javascript url() inside style attributes
  cleaned = cleaned.replace(/expression\s*\([^)]*\)/gi, '');
  cleaned = cleaned.replace(/url\(\s*['"]?\s*javascript:[^)]*\)/gi, 'none');

  // Ensure xmlns="http://www.w3.org/2000/svg" is present on root <svg>
  cleaned = cleaned.replace(/<svg\b([^>]*)>/i, (_full, attrs: string) => {
    if (/xmlns\s*=/i.test(attrs)) {
      return `<svg${attrs}>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg"${attrs}>`;
  });

  // Extract intrinsic dimensions if available
  const svgOpenMatch = cleaned.match(/<svg\b([^>]*)>/i);
  const attrs = svgOpenMatch ? svgOpenMatch[1] : '';
  const widthAttr = attrs.match(/\bwidth\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;
  const heightAttr = attrs.match(/\bheight\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;
  const viewBoxAttr = attrs.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;

  let width = parseNumericDimension(widthAttr);
  let height = parseNumericDimension(heightAttr);

  if ((!width || !height) && viewBoxAttr) {
    const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      width = width || parts[2];
      height = height || parts[3];
    }
  }

  const encoded = encodeURIComponent(cleaned)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`;

  return {
    ok: true,
    sanitizedSvg: cleaned,
    dataUrl,
    width: width || 240,
    height: height || 240,
  };
}
