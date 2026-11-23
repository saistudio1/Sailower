import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Crosshair,
  Grid3x3,
  Maximize2,
  Move,
  RotateCcw,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  CanvasResolution,
  ElementBounds,
  LowerThirdDesign,
  ResolutionPreset,
  SelectableElementRef,
} from '../types/studio';
import {
  computeGroupLocalBounds,
  renderLowerThirdToCanvas,
} from '../utils/canvasRenderer';
import type { AnimationFrameState } from '../utils/layoutMath';
import { RESOLUTION_PRESETS, clampResolution } from '../utils/layoutMath';

interface CanvasStageProps {
  design: LowerThirdDesign;
  resolution: CanvasResolution;
  loadedImages: Map<string, HTMLImageElement>;
  animFrame?: AnimationFrameState;
  selectedElement: SelectableElementRef;
  onSelectElement: (ref: SelectableElementRef) => void;
  onResolutionChange: (next: CanvasResolution) => void;
  onDragGroup: (anchorX: number, anchorY: number, commit: boolean) => void;
  onDragSingleElement: (
    ref: Exclude<SelectableElementRef, { kind: 'group' }>,
    dx: number,
    dy: number,
    commit: boolean
  ) => void;
  onResetPosition: () => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  design,
  resolution,
  loadedImages,
  animFrame,
  selectedElement,
  onSelectElement,
  onResolutionChange,
  onDragGroup,
  onDragSingleElement,
  onResetPosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoomMode, setZoomMode] = useState<'fit' | 'manual'>('fit');
  const [manualZoom, setManualZoom] = useState(0.55);
  const [fitZoom, setFitZoom] = useState(0.5);

  const [showSafeZone, setShowSafeZone] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showCenterGuide, setShowCenterGuide] = useState(false);

  const [customW, setCustomW] = useState(String(resolution.width));
  const [customH, setCustomH] = useState(String(resolution.height));

  const [elementBoxes, setElementBoxes] = useState<ElementBounds[]>([]);
  const [groupBox, setGroupBox] = useState({ x: 0, y: 0, width: 600, height: 120 });

  const dragStateRef = useRef<{
    active: boolean;
    mode: SelectableElementRef;
    startClientX: number;
    startClientY: number;
    origAnchorX: number;
    origAnchorY: number;
    origElemX: number;
    origElemY: number;
  } | null>(null);

  useEffect(() => {
    setCustomW(String(resolution.width));
    setCustomH(String(resolution.height));
  }, [resolution.width, resolution.height]);

  // Compute fit zoom smoothly when container or resolution resizes
  useEffect(() => {
    const updateFit = () => {
      const el = containerRef.current;
      if (!el) return;
      const availW = Math.max(200, el.clientWidth - 48);
      const availH = Math.max(180, el.clientHeight - 48);
      const scale = Math.min(availW / resolution.width, availH / resolution.height, 1);
      setFitZoom(Number(Math.max(0.12, scale).toFixed(3)));
    };
    updateFit();
    const ro = new ResizeObserver(updateFit);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [resolution.width, resolution.height]);

  const effectiveZoom = zoomMode === 'fit' ? fitZoom : manualZoom;

  // Render preview canvas whenever design, resolution, images, or animation frame updates
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, resolution.width, resolution.height);
    renderLowerThirdToCanvas(
      ctx,
      resolution.width,
      resolution.height,
      design,
      loadedImages,
      animFrame
    );

    const bounds = computeGroupLocalBounds(ctx, design);
    const scale = design.layout.scale;
    const ox = design.layout.anchorX + design.layout.marginX;
    const oy = design.layout.anchorY + design.layout.marginY;

    setGroupBox({
      x: ox + bounds.minX * scale,
      y: oy + bounds.minY * scale,
      width: bounds.width * scale,
      height: bounds.height * scale,
    });
    setElementBoxes(
      bounds.elements.map((eb) => ({
        ...eb,
        x: ox + eb.x * scale,
        y: oy + eb.y * scale,
        width: eb.width * scale,
        height: eb.height * scale,
      }))
    );
  }, [design, resolution.width, resolution.height, loadedImages, animFrame]);

  useEffect(() => {
    drawPreview();
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => drawPreview()).catch(() => {});
    }
  }, [drawPreview]);

  const handlePresetChange = (val: ResolutionPreset) => {
    if (val === 'custom') {
      const clamped = clampResolution(Number(customW), Number(customH));
      onResolutionChange({ preset: 'custom', ...clamped });
    } else {
      const p = RESOLUTION_PRESETS[val];
      onResolutionChange({ preset: val, width: p.width, height: p.height });
    }
  };

  const applyCustomDimensions = () => {
    const clamped = clampResolution(Number(customW), Number(customH));
    setCustomW(String(clamped.width));
    setCustomH(String(clamped.height));
    onResolutionChange({ preset: 'custom', ...clamped });
  };

  // Pointer drag-and-drop on canvas
  const toCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / Math.max(1, rect.width)) * resolution.width;
    const y = ((clientY - rect.top) / Math.max(1, rect.height)) * resolution.height;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const pt = toCanvasCoords(e.clientX, e.clientY);

    // Check if user clicked inside an element or the group
    const hitGroup =
      pt.x >= groupBox.x - 24 &&
      pt.x <= groupBox.x + groupBox.width + 24 &&
      pt.y >= groupBox.y - 24 &&
      pt.y <= groupBox.y + groupBox.height + 24;

    if (!hitGroup) {
      onSelectElement({ kind: 'group' });
      return;
    }

    // If a specific individual element is already selected and clicked inside it, drag that element;
    // otherwise drag the entire lower-third group cleanly!
    let dragMode: SelectableElementRef = { kind: 'group' };
    let origElemX = 0;
    let origElemY = 0;

    if (selectedElement.kind !== 'group') {
      const targetBox = elementBoxes.find(
        (b) => b.kind === selectedElement.kind && b.id === selectedElement.id
      );
      if (
        targetBox &&
        pt.x >= targetBox.x - 10 &&
        pt.x <= targetBox.x + targetBox.width + 10 &&
        pt.y >= targetBox.y - 10 &&
        pt.y <= targetBox.y + targetBox.height + 10
      ) {
        dragMode = selectedElement;
        if (selectedElement.kind === 'text') {
          const t = design.texts.find((item) => item.id === selectedElement.id);
          origElemX = t?.offsetX || 0;
          origElemY = t?.offsetY || 0;
        } else if (selectedElement.kind === 'shape') {
          const s = design.shapes.find((item) => item.id === selectedElement.id);
          origElemX = s?.x || 0;
          origElemY = s?.y || 0;
        } else if (selectedElement.kind === 'logo') {
          const l = design.logos.find((item) => item.id === selectedElement.id);
          origElemX = l?.x || 0;
          origElemY = l?.y || 0;
        }
      }
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      active: true,
      mode: dragMode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origAnchorX: design.layout.anchorX,
      origAnchorY: design.layout.anchorY,
      origElemX,
      origElemY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (!st || !st.active) return;

    const dxCanvas = (e.clientX - st.startClientX) / effectiveZoom;
    const dyCanvas = (e.clientY - st.startClientY) / effectiveZoom;

    if (st.mode.kind === 'group') {
      onDragGroup(
        Math.round(st.origAnchorX + dxCanvas),
        Math.round(st.origAnchorY + dyCanvas),
        false
      );
    } else {
      const localDx = Math.round(dxCanvas / Math.max(0.1, design.layout.scale));
      const localDy = Math.round(dyCanvas / Math.max(0.1, design.layout.scale));
      onDragSingleElement(
        st.mode,
        st.origElemX + localDx,
        st.origElemY + localDy,
        false
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (!st || !st.active) return;
    dragStateRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const dxCanvas = (e.clientX - st.startClientX) / effectiveZoom;
    const dyCanvas = (e.clientY - st.startClientY) / effectiveZoom;
    if (Math.abs(dxCanvas) < 1 && Math.abs(dyCanvas) < 1) return;

    if (st.mode.kind === 'group') {
      onDragGroup(
        Math.round(st.origAnchorX + dxCanvas),
        Math.round(st.origAnchorY + dyCanvas),
        true
      );
    } else {
      const localDx = Math.round(dxCanvas / Math.max(0.1, design.layout.scale));
      const localDy = Math.round(dyCanvas / Math.max(0.1, design.layout.scale));
      onDragSingleElement(
        st.mode,
        st.origElemX + localDx,
        st.origElemY + localDy,
        true
      );
    }
  };

  const stageWidth = Math.round(resolution.width * effectiveZoom);
  const stageHeight = Math.round(resolution.height * effectiveZoom);

  const selectedBox =
    selectedElement.kind === 'group'
      ? groupBox
      : elementBoxes.find(
          (b) => b.kind === selectedElement.kind && b.id === selectedElement.id
        ) || groupBox;

  return (
    <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#0b0e14]">
      {/* Canvas Toolbar */}
      <div className="min-h-11 px-3 py-1.5 bg-[#11151d] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        {/* Resolution Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="resolution-select" className="text-[11px] font-medium text-slate-400">
            Canvas:
          </label>
          <select
            id="resolution-select"
            value={resolution.preset}
            onChange={(e) => handlePresetChange(e.target.value as ResolutionPreset)}
            className="h-7 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs text-slate-100 font-medium focus:outline-none focus:border-[#d9b66d] cursor-pointer"
          >
            <option value="1920x1080">Full HD (1920 × 1080)</option>
            <option value="1280x720">HD (1280 × 720)</option>
            <option value="1080x1920">Vertical (1080 × 1920)</option>
            <option value="1080x1080">Square (1080 × 1080)</option>
            <option value="custom">Custom Resolution</option>
          </select>

          {resolution.preset === 'custom' && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                aria-label="Custom Width"
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                onBlur={applyCustomDimensions}
                onKeyDown={(e) => e.key === 'Enter' && applyCustomDimensions()}
                min={320}
                max={3840}
                className="w-16 h-7 px-1.5 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
              />
              <span className="text-xs text-slate-500">×</span>
              <input
                type="number"
                aria-label="Custom Height"
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                onBlur={applyCustomDimensions}
                onKeyDown={(e) => e.key === 'Enter' && applyCustomDimensions()}
                min={240}
                max={3840}
                className="w-16 h-7 px-1.5 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
              />
              <button
                type="button"
                onClick={applyCustomDimensions}
                className="h-7 px-2 rounded bg-[#1f2633] hover:bg-[#2b3446] text-[11px] font-medium text-slate-200 cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          )}

          <span className="text-[11px] font-mono tabular-nums text-slate-400 hidden sm:inline">
            {resolution.width} × {resolution.height}px
          </span>
        </div>

        {/* Guides & Zoom Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Drag Mode Indicator */}
          <div className="flex items-center rounded bg-[#0b0e14] border border-white/10 p-0.5 mr-1">
            <button
              type="button"
              onClick={() => onSelectElement({ kind: 'group' })}
              title="Mode Geser Seluruh Lower Third"
              className={`h-6 px-2 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                selectedElement.kind === 'group'
                  ? 'bg-[#1f2633] text-[#d9b66d]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Move className="w-3 h-3" />
              <span className="hidden md:inline">Group</span>
            </button>
            <button
              type="button"
              onClick={onResetPosition}
              title="Kembalikan posisi ke default safe zone"
              className="h-6 px-2 rounded text-[11px] font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden xl:inline">Reset Pos</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSafeZone((v) => !v)}
            aria-pressed={showSafeZone}
            title="Tampilkan / sembunyikan TV Safe Zone (hanya panduan editor)"
            className={`h-7 px-2 rounded border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
              showSafeZone
                ? 'bg-[#1a2230] border-[#d9b66d]/50 text-[#f5edda]'
                : 'bg-[#171c26] border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Safe Zone</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCenterGuide((v) => !v)}
            aria-pressed={showCenterGuide}
            title="Garis bantu tengah (Center Guide)"
            className={`h-7 px-2 rounded border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
              showCenterGuide
                ? 'bg-[#1a2230] border-[#d9b66d]/50 text-[#f5edda]'
                : 'bg-[#171c26] border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            aria-pressed={showGrid}
            title="Grid bantu komposisi"
            className={`h-7 px-2 rounded border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
              showGrid
                ? 'bg-[#1a2230] border-[#d9b66d]/50 text-[#f5edda]'
                : 'bg-[#171c26] border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid3x3 className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center rounded border border-white/10 bg-[#171c26] overflow-hidden">
            <button
              type="button"
              aria-label="Zoom Out"
              title="Perkecil tampilan canvas"
              onClick={() => {
                setZoomMode('manual');
                setManualZoom(Math.max(0.15, Number((effectiveZoom - 0.1).toFixed(2))));
              }}
              className="h-7 px-2 hover:bg-[#1f2633] text-slate-300 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono tabular-nums text-slate-200 border-x border-white/10">
              {Math.round(effectiveZoom * 100)}%
            </span>
            <button
              type="button"
              aria-label="Zoom In"
              title="Perbesar tampilan canvas"
              onClick={() => {
                setZoomMode('manual');
                setManualZoom(Math.min(1.5, Number((effectiveZoom + 0.1).toFixed(2))));
              }}
              className="h-7 px-2 hover:bg-[#1f2633] text-slate-300 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomMode('fit')}
              title="Fit to Screen"
              className={`h-7 px-2 border-l border-white/10 text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                zoomMode === 'fit'
                  ? 'bg-[#222a38] text-[#d9b66d]'
                  : 'text-slate-300 hover:bg-[#1f2633]'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span>Fit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Checkerboard Viewport */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-4 lg:p-6 bg-[#090c11]"
      >
        <div
          className="relative checkerboard-bg shadow-2xl border border-white/15 select-none touch-none shrink-0"
          style={{ width: `${stageWidth}px`, height: `${stageHeight}px` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          data-testid="studio-canvas-stage"
        >
          {/* Real 1:1 Resolution Canvas scaled visually via CSS */}
          <canvas
            ref={canvasRef}
            width={resolution.width}
            height={resolution.height}
            data-testid="studio-preview-canvas"
            className="w-full h-full block"
          />

          {/* Editor-Only Guides Overlay (NEVER exported) */}
          <svg
            viewBox={`0 0 ${resolution.width} ${resolution.height}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            {showGrid && (
              <g stroke="rgba(255,255,255,0.14)" strokeWidth={1.5}>
                <line x1={resolution.width / 3} y1={0} x2={resolution.width / 3} y2={resolution.height} />
                <line
                  x1={(resolution.width * 2) / 3}
                  y1={0}
                  x2={(resolution.width * 2) / 3}
                  y2={resolution.height}
                />
                <line x1={0} y1={resolution.height / 3} x2={resolution.width} y2={resolution.height / 3} />
                <line
                  x1={0}
                  y1={(resolution.height * 2) / 3}
                  x2={resolution.width}
                  y2={(resolution.height * 2) / 3}
                />
              </g>
            )}

            {showCenterGuide && (
              <g stroke="rgba(56, 189, 248, 0.55)" strokeWidth={2} strokeDasharray="8 6">
                <line x1={resolution.width / 2} y1={0} x2={resolution.width / 2} y2={resolution.height} />
                <line x1={0} y1={resolution.height / 2} x2={resolution.width} y2={resolution.height / 2} />
              </g>
            )}

            {showSafeZone && (
              <g fill="none">
                {/* Action Safe (90%) */}
                <rect
                  x={resolution.width * 0.05}
                  y={resolution.height * 0.05}
                  width={resolution.width * 0.9}
                  height={resolution.height * 0.9}
                  stroke="rgba(217, 182, 109, 0.35)"
                  strokeWidth={2}
                  strokeDasharray="10 8"
                />
                {/* Title Safe (80%) */}
                <rect
                  x={resolution.width * 0.1}
                  y={resolution.height * 0.1}
                  width={resolution.width * 0.8}
                  height={resolution.height * 0.8}
                  stroke="rgba(217, 182, 109, 0.22)"
                  strokeWidth={1.5}
                  strokeDasharray="6 6"
                />
              </g>
            )}

            {/* Selection Box */}
            {!animFrame && (
              <rect
                x={selectedBox.x - 4}
                y={selectedBox.y - 4}
                width={selectedBox.width + 8}
                height={selectedBox.height + 8}
                fill="none"
                stroke={selectedElement.kind === 'group' ? 'rgba(217,182,109,0.55)' : 'rgba(56,189,248,0.8)'}
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Subtle Bottom Coordinate Hint */}
      <div className="h-7 px-3 bg-[#0e1219] border-t border-white/8 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate">
          Seret elemen di canvas untuk mengatur posisi · Checkerboard menandakan area transparan
        </span>
        <span className="font-mono tabular-nums shrink-0 ml-2">
          X: {design.layout.anchorX}px · Y: {design.layout.anchorY}px · Scale:{' '}
          {Math.round(design.layout.scale * 100)}%
        </span>
      </div>
    </section>
  );
};
