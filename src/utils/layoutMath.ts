import type {
  AnimationConfig,
  CanvasResolution,
  EasingOption,
  LowerThirdDesign,
  ProjectRecord,
  ResolutionPreset,
} from '../types/studio';

export const RESOLUTION_PRESETS: Record<
  Exclude<ResolutionPreset, 'custom'>,
  { label: string; width: number; height: number }
> = {
  '1920x1080': { label: 'Full HD (1920 × 1080)', width: 1920, height: 1080 },
  '1280x720': { label: 'HD (1280 × 720)', width: 1280, height: 720 },
  '1080x1920': { label: 'Vertical (1080 × 1920)', width: 1080, height: 1920 },
  '1080x1080': { label: 'Square (1080 × 1080)', width: 1080, height: 1080 },
};

export function clampResolution(width: number, height: number): { width: number; height: number } {
  const safeW = Math.round(Math.min(3840, Math.max(320, Number.isFinite(width) ? width : 1920)));
  const safeH = Math.round(Math.min(3840, Math.max(240, Number.isFinite(height) ? height : 1080)));
  return { width: safeW, height: safeH };
}

export function sanitizeFilename(projectName: string): string {
  const slug = projectName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `lower-third-${slug || 'untitled'}.png`;
}

export function cloneDesign<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

/**
 * Adapts lower third anchor position and group scale cleanly when switching
 * between aspect ratios (e.g. 1920x1080 -> 1080x1920 or 1280x720) so graphics
 * remain visible inside the safe zone and never clip unexpectedly.
 */
export function scaleDesignForResolution(
  design: LowerThirdDesign,
  oldRes: { width: number; height: number },
  newRes: { width: number; height: number }
): LowerThirdDesign {
  const next = cloneDesign(design);
  const oldW = Math.max(1, oldRes.width);
  const oldH = Math.max(1, oldRes.height);
  const newW = Math.max(1, newRes.width);
  const newH = Math.max(1, newRes.height);

  // Relative anchor ratios from the previous canvas
  const relX = design.layout.anchorX / oldW;
  const relY = design.layout.anchorY / oldH;

  // Deterministic scale based on target canvas width so toggling presets returns cleanly to 1.0 on 1920x1080
  const baseArtworkWidth = 860;
  const maxSafeWidth = newW * 0.86;
  const targetScale =
    newW >= 1600
      ? 1
      : newW < newH
      ? Math.min(1, maxSafeWidth / baseArtworkWidth)
      : Math.max(0.62, Math.min(1, newW / 1600));

  next.layout.scale = Number(targetScale.toFixed(3));
  next.layout.anchorX = Math.round(Math.max(newW * 0.05, Math.min(newW * 0.72, relX * newW)));
  next.layout.anchorY = Math.round(Math.max(newH * 0.08, Math.min(newH * 0.88, relY * newH)));

  return next;
}

export function applyEasing(t: number, easing: EasingOption): number {
  const x = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'linear':
      return x;
    case 'ease-out-cubic':
      return 1 - Math.pow(1 - x, 3);
    case 'ease-in-out':
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    case 'spring-soft': {
      const c1 = 1.35;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }
    case 'ease-out-expo':
    default:
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }
}

export interface AnimationFrameState {
  phase: 'delay' | 'in' | 'hold' | 'out' | 'done';
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  clipProgress: number; // 0..1 horizontal or vertical mask
  lineProgress: number; // 0..1 accent line draw progress
}

export function computeAnimationFrameState(
  elapsedMs: number,
  config: AnimationConfig
): AnimationFrameState {
  const delay = Math.max(0, config.delay);
  const inDur = Math.max(100, config.inDuration);
  const holdDur = Math.max(0, config.holdDuration);
  const outDur = Math.max(100, config.outDuration);

  if (elapsedMs < delay) {
    return {
      phase: 'delay',
      opacity: 0,
      translateX: 0,
      translateY: 0,
      scale: config.type === 'scale-in' ? 0.88 : 1,
      clipProgress: config.type === 'reveal' || config.type === 'line-reveal' ? 0 : 1,
      lineProgress: 0,
    };
  }

  const tAfterDelay = elapsedMs - delay;
  let phase: AnimationFrameState['phase'] = 'hold';
  let p = 1; // 0 = hidden, 1 = fully visible

  if (tAfterDelay < inDur) {
    phase = 'in';
    p = applyEasing(tAfterDelay / inDur, config.easing);
  } else if (tAfterDelay < inDur + holdDur) {
    phase = 'hold';
    p = 1;
  } else if (tAfterDelay < inDur + holdDur + outDur) {
    phase = 'out';
    const outRatio = (tAfterDelay - inDur - holdDur) / outDur;
    p = 1 - applyEasing(outRatio, config.easing);
  } else {
    phase = 'done';
    p = 0;
  }

  const inv = 1 - p;

  switch (config.type) {
    case 'slide-left':
      return {
        phase,
        opacity: Math.max(0, Math.min(1, p * 1.15)),
        translateX: -140 * inv,
        translateY: 0,
        scale: 1,
        clipProgress: 1,
        lineProgress: 1,
      };
    case 'slide-right':
      return {
        phase,
        opacity: Math.max(0, Math.min(1, p * 1.15)),
        translateX: 140 * inv,
        translateY: 0,
        scale: 1,
        clipProgress: 1,
        lineProgress: 1,
      };
    case 'slide-up':
      return {
        phase,
        opacity: Math.max(0, Math.min(1, p * 1.15)),
        translateX: 0,
        translateY: 72 * inv,
        scale: 1,
        clipProgress: 1,
        lineProgress: 1,
      };
    case 'fade-in':
      return {
        phase,
        opacity: Math.max(0, Math.min(1, p)),
        translateX: 0,
        translateY: 0,
        scale: 1,
        clipProgress: 1,
        lineProgress: 1,
      };
    case 'reveal':
      return {
        phase,
        opacity: p > 0.02 ? 1 : 0,
        translateX: -18 * inv,
        translateY: 0,
        scale: 1,
        clipProgress: Math.max(0, Math.min(1, p)),
        lineProgress: Math.max(0, Math.min(1, p)),
      };
    case 'scale-in':
      return {
        phase,
        opacity: Math.max(0, Math.min(1, p)),
        translateX: 0,
        translateY: 0,
        scale: 0.86 + 0.14 * p,
        clipProgress: 1,
        lineProgress: 1,
      };
    case 'smooth-motion':
      return {
        phase,
        opacity: Math.max(0, Math.min(1, p)),
        translateX: -48 * inv,
        translateY: 20 * inv,
        scale: 0.96 + 0.04 * p,
        clipProgress: 1,
        lineProgress: Math.max(0, Math.min(1, p)),
      };
    case 'line-reveal':
    default: {
      const lineP = Math.min(1, p * 1.6);
      const bodyP = Math.max(0, Math.min(1, (p - 0.18) / 0.82));
      return {
        phase,
        opacity: Math.max(0, Math.min(1, bodyP > 0 ? bodyP : lineP * 0.4)),
        translateX: -24 * (1 - bodyP),
        translateY: 0,
        scale: 1,
        clipProgress: bodyP,
        lineProgress: lineP,
      };
    }
  }
}

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createHistory<T>(initial: T): HistoryState<T> {
  return {
    past: [],
    present: cloneDesign(initial),
    future: [],
  };
}

export function pushHistory<T>(
  history: HistoryState<T>,
  nextPresent: T,
  maxSteps = 40
): HistoryState<T> {
  const nextPast = [...history.past, cloneDesign(history.present)].slice(-maxSteps);
  return {
    past: nextPast,
    present: cloneDesign(nextPresent),
    future: [],
  };
}

export function undoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  const nextPast = history.past.slice(0, -1);
  return {
    past: nextPast,
    present: cloneDesign(previous),
    future: [cloneDesign(history.present), ...history.future],
  };
}

export function redoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  const nextFuture = history.future.slice(1);
  return {
    past: [...history.past, cloneDesign(history.present)],
    present: cloneDesign(next),
    future: nextFuture,
  };
}

export function validateImportedProjectJson(rawText: string): {
  ok: boolean;
  project?: ProjectRecord;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawText) as Partial<ProjectRecord>;
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Format JSON tidak valid.' };
    }
    if (!parsed.design || !Array.isArray(parsed.design.texts) || !Array.isArray(parsed.design.shapes)) {
      return { ok: false, error: 'Struktur desain Lower Third tidak lengkap.' };
    }
    const res: CanvasResolution = parsed.resolution && parsed.resolution.width && parsed.resolution.height
      ? {
          preset: parsed.resolution.preset || '1920x1080',
          ...clampResolution(parsed.resolution.width, parsed.resolution.height),
        }
      : { preset: '1920x1080', width: 1920, height: 1080 };

    const now = new Date().toISOString();
    return {
      ok: true,
      project: {
        id: parsed.id || `proj-${Date.now()}`,
        name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'Imported Lower Third',
        createdAt: parsed.createdAt || now,
        updatedAt: now,
        resolution: res,
        design: {
          ...parsed.design,
          logos: Array.isArray(parsed.design.logos) ? parsed.design.logos : [],
        },
      },
    };
  } catch {
    return { ok: false, error: 'File JSON rusak atau tidak dapat dibaca.' };
  }
}
