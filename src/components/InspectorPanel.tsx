import React, { useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  LayoutTemplate,
  Palette,
  Plus,
  RotateCcw,
  Shapes,
  Sparkles,
  Trash2,
  Type,
  Wand2,
} from 'lucide-react';
import type {
  CanvasResolution,
  InspectorTab,
  LogoElement,
  LowerThirdDesign,
  SelectableElementRef,
  ShapeElement,
  ShapeKind,
  TextElement,
} from '../types/studio';
import { sanitizeSvgString } from '../utils/svgSanitizer';
import { loadImageElement } from '../utils/canvasRenderer';

interface InspectorPanelProps {
  activeTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  design: LowerThirdDesign;
  resolution: CanvasResolution;
  selectedElement: SelectableElementRef;
  onSelectElement: (ref: SelectableElementRef) => void;
  onUpdateDesign: (updater: (prev: LowerThirdDesign) => LowerThirdDesign, commit?: boolean) => void;
  onResetSection: (tab: InspectorTab) => void;
  onLogoLoaded: (logo: LogoElement, img: HTMLImageElement) => void;
  onNotify: (msg: string, tone?: 'success' | 'error' | 'info') => void;
}

const FONT_FAMILIES = [
  'Plus Jakarta Sans',
  'DM Sans',
  'Montserrat',
  'Playfair Display',
  'Inter',
];

const CURATED_PALETTES = [
  {
    name: 'BOLT Signature',
    primary: '#092c25',
    secondary: '#0f3d33',
    accent: '#d9b66d',
    textPrimary: '#f5edda',
    textSecondary: '#d9b66d',
  },
  {
    name: 'UKIN PPG Navy',
    primary: '#102b48',
    secondary: '#e1eaf4',
    accent: '#d6b66f',
    textPrimary: '#ffffff',
    textSecondary: '#102b48',
  },
  {
    name: 'Broadcast Crimson',
    primary: '#0b132b',
    secondary: '#ffffff',
    accent: '#dc2626',
    textPrimary: '#ffffff',
    textSecondary: '#0b132b',
  },
  {
    name: 'Corporate Slate',
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#2563eb',
    textPrimary: '#f8fafc',
    textSecondary: '#93c5fd',
  },
  {
    name: 'Islamic Alabaster',
    primary: '#f7f4ed',
    secondary: '#1b4332',
    accent: '#c8a45d',
    textPrimary: '#1b4332',
    textSecondary: '#4a6b5b',
  },
];

const TABS: Array<{ id: InspectorTab; label: string; icon: React.ReactNode }> = [
  { id: 'text', label: 'Text', icon: <Type className="w-3.5 h-3.5" /> },
  { id: 'typography', label: 'Type', icon: <Wand2 className="w-3.5 h-3.5" /> },
  { id: 'colors', label: 'Colors', icon: <Palette className="w-3.5 h-3.5" /> },
  { id: 'shapes', label: 'Shapes', icon: <Shapes className="w-3.5 h-3.5" /> },
  { id: 'logos', label: 'Logos', icon: <ImagePlus className="w-3.5 h-3.5" /> },
  { id: 'layout', label: 'Layout', icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
  { id: 'effects', label: 'Effects', icon: <Sparkles className="w-3.5 h-3.5" /> },
];

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  activeTab,
  onTabChange,
  design,
  resolution,
  selectedElement,
  onSelectElement,
  onUpdateDesign,
  onResetSection,
  onLogoLoaded,
  onNotify,
}) => {
  const [activeTextId, setActiveTextId] = useState<string>(design.texts[0]?.id || '');
  const [activeShapeId, setActiveShapeId] = useState<string>(design.shapes[0]?.id || '');
  const [activeLogoId, setActiveLogoId] = useState<string>(design.logos[0]?.id || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedText =
    design.texts.find(
      (t) =>
        t.id ===
        (selectedElement.kind === 'text' ? selectedElement.id : activeTextId)
    ) || design.texts[0];

  const selectedShape =
    design.shapes.find(
      (s) =>
        s.id ===
        (selectedElement.kind === 'shape' ? selectedElement.id : activeShapeId)
    ) || design.shapes[0];

  const selectedLogo =
    design.logos.find(
      (l) =>
        l.id ===
        (selectedElement.kind === 'logo' ? selectedElement.id : activeLogoId)
    ) || design.logos[0];

  const updateTextById = (id: string, patch: Partial<TextElement>, commit = true) => {
    onUpdateDesign(
      (prev) => ({
        ...prev,
        texts: prev.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      }),
      commit
    );
  };

  const updateShapeById = (id: string, patch: Partial<ShapeElement>, commit = true) => {
    onUpdateDesign(
      (prev) => ({
        ...prev,
        shapes: prev.shapes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }),
      commit
    );
  };

  const updateLogoById = (id: string, patch: Partial<LogoElement>, commit = true) => {
    onUpdateDesign(
      (prev) => ({
        ...prev,
        logos: prev.logos.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      }),
      commit
    );
  };

  const addCustomText = () => {
    const newId = `t-custom-${Date.now()}`;
    const maxZ = Math.max(10, ...design.texts.map((t) => t.zIndex));
    const newText: TextElement = {
      id: newId,
      role: 'custom',
      fieldLabel: 'Custom Text',
      placeholder: 'Masukkan teks tambahan...',
      content: 'Informasi Tambahan',
      visible: true,
      fontFamily: 'DM Sans',
      fontSize: 18,
      fontWeight: 500,
      letterSpacing: 0,
      lineHeight: 1.25,
      textAlign: 'left',
      color: design.colors.textPrimary,
      opacity: 0.9,
      offsetX: 0,
      offsetY: 96,
      rotation: 0,
      uppercase: false,
      maxWidth: 700,
      zIndex: maxZ + 1,
    };
    onUpdateDesign((prev) => ({ ...prev, texts: [...prev.texts, newText] }), true);
    setActiveTextId(newId);
    onSelectElement({ kind: 'text', id: newId });
  };

  const addShape = (kind: ShapeKind) => {
    const newId = `shape-${Date.now()}`;
    const maxZ = Math.max(1, ...design.shapes.map((s) => s.zIndex));
    const defaults: Record<ShapeKind, Partial<ShapeElement>> = {
      panel: { name: 'Panel Baru', width: 320, height: 64, fillColor: design.colors.primary, borderRadius: 6 },
      accentBar: { name: 'Accent Bar', width: 8, height: 80, fillColor: design.colors.accent, borderRadius: 3 },
      line: { name: 'Garis Dekoratif', width: 240, height: 3, fillColor: design.colors.accent, borderRadius: 2 },
      badgeBox: { name: 'Badge Box', width: 180, height: 32, fillColor: design.colors.accent, borderRadius: 4 },
      frame: { name: 'Bingkai Frame', width: 420, height: 110, fillOpacity: 0, strokeColor: design.colors.accent, strokeWidth: 2, borderRadius: 6 },
      circle: { name: 'Lingkaran', width: 36, height: 36, fillColor: design.colors.accent, borderRadius: 0 },
      diamond: { name: 'Berlian', width: 28, height: 28, fillColor: design.colors.accent, borderRadius: 0 },
    };
    const preset = defaults[kind];
    const shape: ShapeElement = {
      id: newId,
      name: preset.name || 'Bentuk Baru',
      kind,
      visible: true,
      x: 20,
      y: 20,
      width: preset.width || 120,
      height: preset.height || 40,
      fillColor: preset.fillColor || design.colors.accent,
      fillOpacity: preset.fillOpacity ?? 1,
      strokeColor: preset.strokeColor || design.colors.accent,
      strokeWidth: preset.strokeWidth ?? 0,
      borderRadius: preset.borderRadius ?? 4,
      rotation: 0,
      zIndex: maxZ + 1,
    };
    onUpdateDesign((prev) => ({ ...prev, shapes: [...prev.shapes, shape] }), true);
    setActiveShapeId(newId);
    onSelectElement({ kind: 'shape', id: newId });
  };

  const handleUploadLogoFile = async (file: File) => {
    const isSvg =
      file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    const isRaster =
      file.type === 'image/png' ||
      file.type === 'image/jpeg' ||
      /\.(png|jpe?g)$/i.test(file.name);

    if (!isSvg && !isRaster) {
      onNotify('Format logo tidak didukung. Gunakan PNG, SVG, atau JPEG.', 'error');
      return;
    }

    try {
      let dataUrl = '';
      if (isSvg) {
        const rawText = await file.text();
        const sanitized = sanitizeSvgString(rawText);
        if (!sanitized.ok || !sanitized.dataUrl) {
          onNotify(sanitized.error || 'SVG tidak valid atau diblokir.', 'error');
          return;
        }
        dataUrl = sanitized.dataUrl;
      } else {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
          reader.readAsDataURL(file);
        });
      }

      const img = await loadImageElement(dataUrl);
      const natW = Math.max(1, img.naturalWidth || 200);
      const natH = Math.max(1, img.naturalHeight || 200);
      const hasReservedLeftSlot = design.shapes.some((s) => s.id === 'logo-slot-box');
      const targetH = hasReservedLeftSlot ? 84 : 76;
      const targetW = Math.round((natW / natH) * targetH);
      const maxZ = Math.max(12, ...design.logos.map((l) => l.zIndex));

      const mainPanel = design.shapes.find((s) => s.kind === 'panel');
      const defaultX = hasReservedLeftSlot
        ? 26
        : Math.max(480, (mainPanel ? mainPanel.x + mainPanel.width : 720) - targetW - 22);
      const defaultY = hasReservedLeftSlot ? 26 : 16;

      const logo: LogoElement = {
        id: `logo-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, ''),
        dataUrl,
        naturalWidth: natW,
        naturalHeight: natH,
        visible: true,
        x: defaultX,
        y: defaultY,
        width: targetW,
        height: targetH,
        opacity: 1,
        rotation: 0,
        zIndex: maxZ + 1,
      };

      onLogoLoaded(logo, img);
      setActiveLogoId(logo.id);
      onSelectElement({ kind: 'logo', id: logo.id });
      onNotify(`Logo "${logo.name}" berhasil ditambahkan.`, 'success');
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Gagal memproses file logo.',
        'error'
      );
    }
  };

  const applyGlobalPalette = (palette: typeof CURATED_PALETTES[number]) => {
    onUpdateDesign((prev) => {
      const oldPrimary = prev.colors.primary.toLowerCase();
      const oldAccent = prev.colors.accent.toLowerCase();
      const oldTextPrimary = prev.colors.textPrimary.toLowerCase();
      const oldTextSecondary = prev.colors.textSecondary.toLowerCase();

      return {
        ...prev,
        colors: {
          primary: palette.primary,
          secondary: palette.secondary,
          accent: palette.accent,
          textPrimary: palette.textPrimary,
          textSecondary: palette.textSecondary,
        },
        shapes: prev.shapes.map((s) => {
          const fc = s.fillColor.toLowerCase();
          const sc = s.strokeColor.toLowerCase();
          let nextFill = s.fillColor;
          let nextStroke = s.strokeColor;
          if (fc === oldPrimary || s.kind === 'panel') nextFill = palette.primary;
          else if (fc === oldAccent || s.kind === 'accentBar' || s.kind === 'line' || s.kind === 'badgeBox') {
            nextFill = palette.accent;
          }
          if (sc === oldAccent) nextStroke = palette.accent;
          return { ...s, fillColor: nextFill, strokeColor: nextStroke };
        }),
        texts: prev.texts.map((t) => {
          const tc = t.color.toLowerCase();
          let nextColor = t.color;
          if (tc === oldTextPrimary || t.role === 'title') nextColor = palette.textPrimary;
          else if (tc === oldTextSecondary || t.role === 'subtitle' || t.role === 'label') {
            nextColor = palette.textSecondary;
          }
          return { ...t, color: nextColor };
        }),
      };
    }, true);
  };

  return (
    <aside className="w-full lg:w-[336px] shrink-0 bg-[#11151d] border-l border-white/10 flex flex-col min-h-0 h-full">
      {/* Inspector Tab Bar */}
      <div className="p-2 border-b border-white/10 bg-[#0e1219]">
        <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-4 gap-1" role="tablist">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange(tab.id)}
                className={`h-8 px-2 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#1c2331] text-[#f5edda] border border-[#d9b66d]/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#171c26] border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Header + Reset */}
      <div className="px-3.5 py-2.5 border-b border-white/8 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {TABS.find((t) => t.id === activeTab)?.label} Settings
        </h2>
        <button
          type="button"
          onClick={() => onResetSection(activeTab)}
          title="Reset pengaturan panel ini ke template awal"
          className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:bg-white/10 flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* 1. TEXT SETTINGS */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            {design.texts.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-white/10 bg-[#151a23] p-2.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTextId(t.id);
                      onSelectElement({ kind: 'text', id: t.id });
                    }}
                    className="text-xs font-semibold text-slate-200 hover:text-[#d9b66d] text-left cursor-pointer"
                  >
                    {t.fieldLabel}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateTextById(t.id, { visible: !t.visible })}
                      aria-label={t.visible ? `Sembunyikan ${t.fieldLabel}` : `Tampilkan ${t.fieldLabel}`}
                      title={t.visible ? 'Sembunyikan teks' : 'Tampilkan teks'}
                      className="p-1 rounded hover:bg-white/10 text-slate-300 cursor-pointer"
                    >
                      {t.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                    </button>
                    {t.role === 'custom' && design.texts.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDesign(
                            (prev) => ({
                              ...prev,
                              texts: prev.texts.filter((item) => item.id !== t.id),
                            }),
                            true
                          )
                        }
                        aria-label={`Hapus ${t.fieldLabel}`}
                        title="Hapus lapisan teks"
                        className="p-1 rounded hover:bg-red-500/20 text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={t.content}
                  placeholder={t.placeholder}
                  aria-label={t.fieldLabel}
                  onChange={(e) => updateTextById(t.id, { content: e.target.value }, true)}
                  className="w-full min-h-[46px] px-2.5 py-1.5 rounded bg-[#0b0e14] border border-white/10 text-xs leading-snug text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#d9b66d] resize-y"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={addCustomText}
              className="w-full h-8 rounded-md border border-dashed border-white/20 hover:border-[#d9b66d]/60 hover:bg-[#171c26] text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#d9b66d]" />
              <span>Tambah Custom Text</span>
            </button>
          </div>
        )}

        {/* 2. TYPOGRAPHY */}
        {activeTab === 'typography' && selectedText && (
          <div className="space-y-3.5">
            <div>
              <label htmlFor="typo-target" className="block text-[11px] font-medium text-slate-400 mb-1">
                Pilih Elemen Teks
              </label>
              <select
                id="typo-target"
                value={selectedText.id}
                onChange={(e) => {
                  setActiveTextId(e.target.value);
                  onSelectElement({ kind: 'text', id: e.target.value });
                }}
                className="w-full h-8 px-2.5 rounded bg-[#0b0e14] border border-white/10 text-xs text-slate-100 cursor-pointer"
              >
                {design.texts.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fieldLabel} — {t.content.slice(0, 22) || '(kosong)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="font-family-select" className="block text-[11px] font-medium text-slate-400 mb-1">
                Font Family
              </label>
              <select
                id="font-family-select"
                value={selectedText.fontFamily}
                onChange={(e) => updateTextById(selectedText.id, { fontFamily: e.target.value })}
                className="w-full h-8 px-2.5 rounded bg-[#0b0e14] border border-white/10 text-xs text-slate-100 cursor-pointer"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Font Size ({selectedText.fontSize}px)
                </label>
                <input
                  type="range"
                  min={10}
                  max={84}
                  value={selectedText.fontSize}
                  onChange={(e) =>
                    updateTextById(selectedText.id, { fontSize: Number(e.target.value) }, false)
                  }
                  className="w-full accent-[#d9b66d]"
                />
              </div>

              <div>
                <label htmlFor="font-weight-select" className="block text-[11px] font-medium text-slate-400 mb-1">
                  Font Weight
                </label>
                <select
                  id="font-weight-select"
                  value={selectedText.fontWeight}
                  onChange={(e) =>
                    updateTextById(selectedText.id, { fontWeight: Number(e.target.value) })
                  }
                  className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs text-slate-100 cursor-pointer"
                >
                  <option value={400}>400 · Regular</option>
                  <option value={500}>500 · Medium</option>
                  <option value={600}>600 · SemiBold</option>
                  <option value={700}>700 · Bold</option>
                  <option value={800}>800 · ExtraBold</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Letter Spacing ({selectedText.letterSpacing}px)
                </label>
                <input
                  type="range"
                  min={-2}
                  max={10}
                  step={0.2}
                  value={selectedText.letterSpacing}
                  onChange={(e) =>
                    updateTextById(selectedText.id, { letterSpacing: Number(e.target.value) }, false)
                  }
                  className="w-full accent-[#d9b66d]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Line Height ({selectedText.lineHeight.toFixed(2)})
                </label>
                <input
                  type="range"
                  min={0.9}
                  max={2}
                  step={0.05}
                  value={selectedText.lineHeight}
                  onChange={(e) =>
                    updateTextById(selectedText.id, { lineHeight: Number(e.target.value) }, false)
                  }
                  className="w-full accent-[#d9b66d]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 items-end">
              <div>
                <span className="block text-[11px] font-medium text-slate-400 mb-1">
                  Text Alignment
                </span>
                <div className="grid grid-cols-3 rounded border border-white/10 bg-[#0b0e14] overflow-hidden">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      aria-label={`Align ${align}`}
                      onClick={() => updateTextById(selectedText.id, { textAlign: align })}
                      className={`h-8 flex items-center justify-center cursor-pointer ${
                        selectedText.textAlign === align
                          ? 'bg-[#1c2331] text-[#d9b66d]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                      {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                      {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() =>
                    updateTextById(selectedText.id, { uppercase: !selectedText.uppercase })
                  }
                  className={`w-full h-8 rounded border text-xs font-medium cursor-pointer ${
                    selectedText.uppercase
                      ? 'bg-[#1c2331] border-[#d9b66d]/50 text-[#d9b66d]'
                      : 'bg-[#0b0e14] border-white/10 text-slate-300'
                  }`}
                >
                  AA Uppercase
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedText.color}
                    onChange={(e) => updateTextById(selectedText.id, { color: e.target.value })}
                    className="w-9 h-8 rounded bg-transparent border border-white/10 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedText.color}
                    onChange={(e) => updateTextById(selectedText.id, { color: e.target.value })}
                    className="flex-1 min-w-0 h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Opacity ({Math.round(selectedText.opacity * 100)}%)
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.02}
                  value={selectedText.opacity}
                  onChange={(e) =>
                    updateTextById(selectedText.id, { opacity: Number(e.target.value) }, false)
                  }
                  className="w-full accent-[#d9b66d] mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Pos X</label>
                <input
                  type="number"
                  value={selectedText.offsetX}
                  onChange={(e) =>
                    updateTextById(selectedText.id, { offsetX: Number(e.target.value) || 0 })
                  }
                  className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Pos Y</label>
                <input
                  type="number"
                  value={selectedText.offsetY}
                  onChange={(e) =>
                    updateTextById(selectedText.id, { offsetY: Number(e.target.value) || 0 })
                  }
                  className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Rotate (°)</label>
                <input
                  type="number"
                  min={-45}
                  max={45}
                  value={selectedText.rotation}
                  onChange={(e) =>
                    updateTextById(selectedText.id, { rotation: Number(e.target.value) || 0 })
                  }
                  className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. COLORS */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {(
                [
                  { key: 'primary', label: 'Primary Panel Color' },
                  { key: 'secondary', label: 'Secondary Color' },
                  { key: 'accent', label: 'Accent & Line Color' },
                  { key: 'textPrimary', label: 'Primary Text Color' },
                  { key: 'textSecondary', label: 'Secondary Text Color' },
                ] as const
              ).map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-300">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      aria-label={item.label}
                      value={design.colors[item.key]}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        applyGlobalPalette({
                          name: 'Custom',
                          ...design.colors,
                          [item.key]: nextVal,
                        });
                      }}
                      className="w-8 h-7 rounded bg-transparent border border-white/10 cursor-pointer"
                    />
                    <span className="w-16 text-[11px] font-mono text-slate-400">
                      {design.colors[item.key]}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Palet Studio Siap Pakai
              </div>
              <div className="space-y-1.5">
                {CURATED_PALETTES.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyGlobalPalette(p)}
                    className="w-full px-2.5 py-2 rounded-md bg-[#151a23] hover:bg-[#1c2331] border border-white/8 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-medium text-slate-200">{p.name}</span>
                    <span className="flex items-center gap-1">
                      {[p.primary, p.accent, p.textPrimary].map((hex, idx) => (
                        <span
                          key={idx}
                          className="w-4 h-4 rounded-sm border border-white/20"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. SHAPES & GRAPHIC ELEMENTS */}
        {activeTab === 'shapes' && (
          <div className="space-y-3.5">
            {/* Add Shape Quick Buttons */}
            <div>
              <div className="text-[11px] font-medium text-slate-400 mb-1.5">
                Tambah Bentuk Geometris
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { kind: 'panel', label: '+ Panel' },
                    { kind: 'accentBar', label: '+ Bar' },
                    { kind: 'line', label: '+ Garis' },
                    { kind: 'frame', label: '+ Bingkai' },
                    { kind: 'circle', label: '+ Lingkaran' },
                    { kind: 'diamond', label: '+ Berlian' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.kind}
                    type="button"
                    onClick={() => addShape(item.kind)}
                    className="h-7 px-2 rounded bg-[#171c26] hover:bg-[#1f2633] border border-white/10 text-[11px] font-medium text-slate-200 cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer List */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-slate-400">
                Daftar Layer Bentuk ({design.shapes.length})
              </div>
              {design.shapes
                .slice()
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((s) => {
                  const isSel = selectedShape?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`px-2 py-1.5 rounded-md border flex items-center justify-between gap-2 ${
                        isSel
                          ? 'bg-[#1c2331] border-[#d9b66d]/60'
                          : 'bg-[#151a23] border-white/8'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveShapeId(s.id);
                          onSelectElement({ kind: 'shape', id: s.id });
                        }}
                        className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-sm border border-white/25 shrink-0"
                          style={{ backgroundColor: s.fillColor }}
                        />
                        <span className="text-xs font-medium text-slate-200 truncate">
                          {s.name}
                        </span>
                      </button>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateShapeById(s.id, { zIndex: s.zIndex + 1 })}
                          aria-label={`Naikkan layer ${s.name}`}
                          title="Naikkan Layer"
                          className="p-1 rounded hover:bg-white/10 text-slate-400 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateShapeById(s.id, { zIndex: Math.max(0, s.zIndex - 1) })}
                          aria-label={`Turunkan layer ${s.name}`}
                          title="Turunkan Layer"
                          className="p-1 rounded hover:bg-white/10 text-slate-400 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateShapeById(s.id, { visible: !s.visible })}
                          aria-label={`Toggle ${s.name}`}
                          className="p-1 rounded hover:bg-white/10 text-slate-300 cursor-pointer"
                        >
                          {s.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateDesign(
                              (prev) => ({
                                ...prev,
                                shapes: prev.shapes.filter((item) => item.id !== s.id),
                              }),
                              true
                            )
                          }
                          aria-label={`Hapus ${s.name}`}
                          className="p-1 rounded hover:bg-red-500/20 text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Selected Shape Properties */}
            {selectedShape && (
              <div className="pt-3 border-t border-white/10 space-y-2.5">
                <div className="text-[11px] font-semibold text-[#d9b66d]">
                  Properti: {selectedShape.name}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Width (px)</label>
                    <input
                      type="number"
                      min={1}
                      max={1900}
                      value={selectedShape.width}
                      onChange={(e) =>
                        updateShapeById(selectedShape.id, {
                          width: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Height (px)</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={selectedShape.height}
                      onChange={(e) =>
                        updateShapeById(selectedShape.id, {
                          height: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">X Position</label>
                    <input
                      type="number"
                      value={selectedShape.x}
                      onChange={(e) =>
                        updateShapeById(selectedShape.id, { x: Number(e.target.value) || 0 })
                      }
                      className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Y Position</label>
                    <input
                      type="number"
                      value={selectedShape.y}
                      onChange={(e) =>
                        updateShapeById(selectedShape.id, { y: Number(e.target.value) || 0 })
                      }
                      className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Border Radius ({selectedShape.borderRadius}px)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={64}
                      value={selectedShape.borderRadius}
                      onChange={(e) =>
                        updateShapeById(
                          selectedShape.id,
                          { borderRadius: Number(e.target.value) },
                          false
                        )
                      }
                      className="w-full accent-[#d9b66d]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Opacity ({Math.round(selectedShape.fillOpacity * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
                      value={selectedShape.fillOpacity}
                      onChange={(e) =>
                        updateShapeById(
                          selectedShape.id,
                          { fillOpacity: Number(e.target.value) },
                          false
                        )
                      }
                      className="w-full accent-[#d9b66d]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Fill Color</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selectedShape.fillColor}
                        onChange={(e) =>
                          updateShapeById(selectedShape.id, { fillColor: e.target.value })
                        }
                        className="w-8 h-7 rounded bg-transparent border border-white/10 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-slate-300">
                        {selectedShape.fillColor}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Stroke ({selectedShape.strokeWidth}px)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selectedShape.strokeColor}
                        onChange={(e) =>
                          updateShapeById(selectedShape.id, { strokeColor: e.target.value })
                        }
                        className="w-8 h-7 rounded bg-transparent border border-white/10 cursor-pointer"
                      />
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={selectedShape.strokeWidth}
                        onChange={(e) =>
                          updateShapeById(selectedShape.id, {
                            strokeWidth: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-14 h-7 px-1.5 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. IMAGES AND LOGOS */}
        {activeTab === 'logos' && (
          <div className="space-y-3.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,.png,.jpg,.jpeg,.svg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUploadLogoFile(file);
                  e.target.value = '';
                }
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 px-3 rounded-lg border border-dashed border-[#d9b66d]/50 bg-[#151a23] hover:bg-[#1a212e] text-center cursor-pointer transition-colors"
            >
              <ImagePlus className="w-5 h-5 text-[#d9b66d] mx-auto mb-1.5" />
              <div className="text-xs font-semibold text-slate-100">
                Upload Logo (PNG / SVG / JPEG)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Transparansi PNG & rasio asli logo otomatis dipertahankan
              </div>
            </button>

            {design.logos.length === 0 ? (
              <div className="rounded-lg border border-white/8 bg-[#151a23] p-3 text-xs text-slate-400 leading-relaxed">
                Belum ada logo terpasang. Unggah logo sekolah, universitas (LPTK), atau instansi
                Anda untuk ditampilkan bersama lower third.
              </div>
            ) : (
              <div className="space-y-2">
                {design.logos.map((logo) => (
                  <div
                    key={logo.id}
                    className={`p-2 rounded-md border flex items-center justify-between gap-2 ${
                      selectedLogo?.id === logo.id
                        ? 'bg-[#1c2331] border-[#d9b66d]/60'
                        : 'bg-[#151a23] border-white/8'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLogoId(logo.id);
                        onSelectElement({ kind: 'logo', id: logo.id });
                      }}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <img
                        src={logo.dataUrl}
                        alt={logo.name}
                        className="w-8 h-8 object-contain rounded checkerboard-bg border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-100 truncate">
                          {logo.name}
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-slate-400">
                          {logo.width} × {logo.height}px
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateLogoById(logo.id, { visible: !logo.visible })}
                        aria-label={`Toggle ${logo.name}`}
                        className="p-1 rounded hover:bg-white/10 text-slate-300 cursor-pointer"
                      >
                        {logo.visible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDesign(
                            (prev) => ({
                              ...prev,
                              logos: prev.logos.filter((item) => item.id !== logo.id),
                            }),
                            true
                          )
                        }
                        aria-label={`Hapus logo ${logo.name}`}
                        className="p-1 rounded hover:bg-red-500/20 text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {selectedLogo && (
                  <div className="pt-3 border-t border-white/10 space-y-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Ukuran Logo (Rasio Terkunci: {selectedLogo.width} × {selectedLogo.height}px)
                      </label>
                      <input
                        type="range"
                        min={24}
                        max={320}
                        value={selectedLogo.height}
                        onChange={(e) => {
                          const nextH = Number(e.target.value);
                          const ratio =
                            selectedLogo.naturalWidth / Math.max(1, selectedLogo.naturalHeight);
                          updateLogoById(
                            selectedLogo.id,
                            { height: nextH, width: Math.round(nextH * ratio) },
                            false
                          );
                        }}
                        className="w-full accent-[#d9b66d]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Posisi X</label>
                        <input
                          type="number"
                          value={selectedLogo.x}
                          onChange={(e) =>
                            updateLogoById(selectedLogo.id, { x: Number(e.target.value) || 0 })
                          }
                          className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Posisi Y</label>
                        <input
                          type="number"
                          value={selectedLogo.y}
                          onChange={(e) =>
                            updateLogoById(selectedLogo.id, { y: Number(e.target.value) || 0 })
                          }
                          className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Opacity ({Math.round(selectedLogo.opacity * 100)}%)
                      </label>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.02}
                        value={selectedLogo.opacity}
                        onChange={(e) =>
                          updateLogoById(
                            selectedLogo.id,
                            { opacity: Number(e.target.value) },
                            false
                          )
                        }
                        className="w-full accent-[#d9b66d]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. LAYOUT */}
        {activeTab === 'layout' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Anchor X (px)</label>
                <input
                  type="number"
                  value={design.layout.anchorX}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      layout: { ...prev.layout, anchorX: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Anchor Y (px)</label>
                <input
                  type="number"
                  value={design.layout.anchorY}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      layout: { ...prev.layout, anchorY: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Scale Keseluruhan ({Math.round(design.layout.scale * 100)}%)
              </label>
              <input
                type="range"
                min={0.4}
                max={1.8}
                step={0.02}
                value={design.layout.scale}
                onChange={(e) =>
                  onUpdateDesign(
                    (prev) => ({
                      ...prev,
                      layout: { ...prev.layout, scale: Number(e.target.value) },
                    }),
                    false
                  )
                }
                className="w-full accent-[#d9b66d]"
              />
            </div>

            <div>
              <div className="text-[11px] text-slate-400 mb-1.5">Posisi Cepat (Safe Zone)</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Bawah Kiri', x: Math.round(resolution.width * 0.06), y: Math.round(resolution.height * 0.74) },
                  { label: 'Bawah Tengah', x: Math.round(resolution.width * 0.25), y: Math.round(resolution.height * 0.74) },
                  { label: 'Atas Kiri', x: Math.round(resolution.width * 0.06), y: Math.round(resolution.height * 0.1) },
                  { label: 'Tengah Canvas', x: Math.round(resolution.width * 0.25), y: Math.round(resolution.height * 0.44) },
                ].map((pos) => (
                  <button
                    key={pos.label}
                    type="button"
                    onClick={() =>
                      onUpdateDesign((prev) => ({
                        ...prev,
                        layout: { ...prev.layout, anchorX: pos.x, anchorY: pos.y },
                      }))
                    }
                    className="h-7 px-2 rounded bg-[#151a23] hover:bg-[#1c2331] border border-white/10 text-[11px] font-medium text-slate-200 cursor-pointer"
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Padding Left</label>
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={design.layout.paddingLeft}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      layout: { ...prev.layout, paddingLeft: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Padding Top</label>
                <input
                  type="number"
                  min={0}
                  max={160}
                  value={design.layout.paddingTop}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      layout: { ...prev.layout, paddingTop: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Margin X</label>
                <input
                  type="number"
                  value={design.layout.marginX}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      layout: { ...prev.layout, marginX: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Margin Y</label>
                <input
                  type="number"
                  value={design.layout.marginY}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      layout: { ...prev.layout, marginY: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. EFFECTS */}
        {activeTab === 'effects' && (
          <div className="space-y-3.5">
            <label className="flex items-center justify-between p-2.5 rounded-md bg-[#151a23] border border-white/10 cursor-pointer">
              <span className="text-xs font-medium text-slate-200">Aktifkan Drop Shadow</span>
              <input
                type="checkbox"
                checked={design.effects.shadowEnabled}
                onChange={(e) =>
                  onUpdateDesign((prev) => ({
                    ...prev,
                    effects: { ...prev.effects, shadowEnabled: e.target.checked },
                  }))
                }
                className="w-4 h-4 accent-[#d9b66d]"
              />
            </label>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Shadow Blur ({design.effects.shadowBlur}px)
              </label>
              <input
                type="range"
                min={0}
                max={60}
                value={design.effects.shadowBlur}
                onChange={(e) =>
                  onUpdateDesign(
                    (prev) => ({
                      ...prev,
                      effects: { ...prev.effects, shadowBlur: Number(e.target.value) },
                    }),
                    false
                  )
                }
                className="w-full accent-[#d9b66d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Shadow Offset X</label>
                <input
                  type="number"
                  min={-40}
                  max={40}
                  value={design.effects.shadowOffsetX}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      effects: { ...prev.effects, shadowOffsetX: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Shadow Offset Y</label>
                <input
                  type="number"
                  min={-40}
                  max={40}
                  value={design.effects.shadowOffsetY}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      effects: { ...prev.effects, shadowOffsetY: Number(e.target.value) || 0 },
                    }))
                  }
                  className="w-full h-8 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Shadow Color</label>
                <input
                  type="color"
                  value={design.effects.shadowColor}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      effects: { ...prev.effects, shadowColor: e.target.value },
                    }))
                  }
                  className="w-full h-8 rounded bg-transparent border border-white/10 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Shadow Opacity ({Math.round(design.effects.shadowOpacity * 100)}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={design.effects.shadowOpacity}
                  onChange={(e) =>
                    onUpdateDesign(
                      (prev) => ({
                        ...prev,
                        effects: { ...prev.effects, shadowOpacity: Number(e.target.value) },
                      }),
                      false
                    )
                  }
                  className="w-full accent-[#d9b66d] mt-1.5"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
