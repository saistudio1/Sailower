import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampResolution,
  computeAnimationFrameState,
  createHistory,
  pushHistory,
  redoHistory,
  sanitizeFilename,
  scaleDesignForResolution,
  undoHistory,
  validateImportedProjectJson,
} from './layoutMath';
import { sanitizeSvgString } from './svgSanitizer';
import { STUDIO_TEMPLATES, getTemplateById } from '../data/templates';

test('template library contains all 5 categories and 26 distinct templates', () => {
  assert.equal(STUDIO_TEMPLATES.length, 26);
  const categories = new Set(STUDIO_TEMPLATES.map((t) => t.category));
  assert.deepEqual(
    [...categories].sort(),
    ['bolt', 'corporate', 'islamic', 'news', 'ukin']
  );

  // Verify UKIN PPG has all 7 required templates
  const ukinTemplates = STUDIO_TEMPLATES.filter((t) => t.category === 'ukin');
  assert.equal(ukinTemplates.length, 7);
});

test('sanitizeFilename formats lower-third PNG filenames safely', () => {
  assert.equal(sanitizeFilename('Kajian Utama 2026'), 'lower-third-kajian-utama-2026.png');
  assert.equal(sanitizeFilename('   '), 'lower-third-untitled.png');
  assert.equal(sanitizeFilename('UKIN PPG / Guru!'), 'lower-third-ukin-ppg-guru.png');
});

test('clampResolution respects min/max boundaries', () => {
  assert.deepEqual(clampResolution(1920, 1080), { width: 1920, height: 1080 });
  assert.deepEqual(clampResolution(100, 100), { width: 320, height: 240 });
  assert.deepEqual(clampResolution(8000, 5000), { width: 3840, height: 3840 });
});

test('scaleDesignForResolution adapts anchor and scale for vertical 1080x1920', () => {
  const bolt = getTemplateById('bolt-classic').design;
  const scaled = scaleDesignForResolution(bolt, { width: 1920, height: 1080 }, { width: 1080, height: 1920 });
  assert.ok(scaled.layout.anchorX >= 50 && scaled.layout.anchorX <= 1080);
  assert.ok(scaled.layout.anchorY >= 100 && scaled.layout.anchorY <= 1920);
  assert.ok(scaled.layout.scale > 0 && scaled.layout.scale <= 1.2);
});

test('undo/redo history stack reverts and reapplies design changes accurately', () => {
  const t1 = getTemplateById('bolt-classic').design;
  const t2 = { ...t1, colors: { ...t1.colors, accent: '#ffffff' } };
  const t3 = { ...t2, colors: { ...t2.colors, primary: '#111111' } };

  let hist = createHistory(t1);
  hist = pushHistory(hist, t2);
  hist = pushHistory(hist, t3);

  assert.equal(hist.present.colors.primary, '#111111');
  hist = undoHistory(hist);
  assert.equal(hist.present.colors.accent, '#ffffff');
  assert.equal(hist.present.colors.primary, '#092c25');

  hist = undoHistory(hist);
  assert.equal(hist.present.colors.accent, '#d9b66d');

  hist = redoHistory(hist);
  assert.equal(hist.present.colors.accent, '#ffffff');
});

test('computeAnimationFrameState transitions through delay -> in -> hold -> out -> done', () => {
  const cfg = {
    type: 'line-reveal' as const,
    inDuration: 600,
    holdDuration: 1000,
    outDuration: 400,
    delay: 200,
    easing: 'ease-out-expo' as const,
  };

  const atDelay = computeAnimationFrameState(100, cfg);
  assert.equal(atDelay.phase, 'delay');
  assert.equal(atDelay.opacity, 0);

  const atMidIn = computeAnimationFrameState(500, cfg);
  assert.equal(atMidIn.phase, 'in');
  assert.ok(atMidIn.lineProgress > 0 && atMidIn.lineProgress <= 1);

  const atHold = computeAnimationFrameState(1000, cfg);
  assert.equal(atHold.phase, 'hold');
  assert.equal(atHold.opacity, 1);
  assert.equal(atHold.clipProgress, 1);

  const atDone = computeAnimationFrameState(2300, cfg);
  assert.equal(atDone.phase, 'done');
  assert.equal(atDone.opacity, 0);
});

test('sanitizeSvgString strips scripts, event handlers, and unsafe URIs while preserving valid SVG', () => {
  const malicious = `<?xml version="1.0"?><svg viewBox="0 0 100 100" onload="alert(1)"><script>steal()</script><foreignObject><div>bad</div></foreignObject><circle cx="50" cy="50" r="40" fill="#d9b66d" onclick="evil()"/><a xlink:href="javascript:alert(2)"><rect width="10" height="10"/></a></svg>`;
  const res = sanitizeSvgString(malicious);
  assert.equal(res.ok, true);
  assert.ok(res.sanitizedSvg);
  assert.equal(res.sanitizedSvg!.includes('<script'), false);
  assert.equal(res.sanitizedSvg!.includes('foreignObject'), false);
  assert.equal(res.sanitizedSvg!.includes('onload'), false);
  assert.equal(res.sanitizedSvg!.includes('onclick'), false);
  assert.equal(res.sanitizedSvg!.includes('javascript:'), false);
  assert.ok(res.sanitizedSvg!.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(res.dataUrl?.startsWith('data:image/svg+xml'));
});

test('validateImportedProjectJson accepts valid project JSON and rejects malformed input', () => {
  const bolt = getTemplateById('bolt-classic').design;
  const payload = JSON.stringify({
    name: 'Uji Proyek',
    resolution: { preset: '1920x1080', width: 1920, height: 1080 },
    design: bolt,
  });
  const ok = validateImportedProjectJson(payload);
  assert.equal(ok.ok, true);
  assert.equal(ok.project?.name, 'Uji Proyek');

  const bad = validateImportedProjectJson('{"foo":"bar"}');
  assert.equal(bad.ok, false);
});
