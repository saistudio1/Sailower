import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { AnimationBar } from './components/AnimationBar';
import { CanvasStage } from './components/CanvasStage';
import { InspectorPanel } from './components/InspectorPanel';
import { ConfirmModal, ExportPreviewModal, RenameModal } from './components/Modals';
import { TemplateSidebar, type SidebarSection } from './components/TemplateSidebar';
import { TopBar } from './components/TopBar';
import { STUDIO_TEMPLATES, getTemplateById } from './data/templates';
import type {
  AnimationConfig,
  CanvasResolution,
  InspectorTab,
  LogoElement,
  LowerThirdDesign,
  ProjectRecord,
  SelectableElementRef,
  StudioTemplate,
} from './types/studio';
import { exportDesignToPngBlob, loadImageElement } from './utils/canvasRenderer';
import {
  type AnimationFrameState,
  type HistoryState,
  cloneDesign,
  computeAnimationFrameState,
  createHistory,
  pushHistory,
  redoHistory,
  sanitizeFilename,
  scaleDesignForResolution,
  undoHistory,
  validateImportedProjectJson,
} from './utils/layoutMath';
import {
  loadActiveDraft,
  loadSavedProjects,
  saveActiveDraft,
  saveProjectsList,
} from './utils/storage';

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

const DEFAULT_RESOLUTION: CanvasResolution = {
  preset: '1920x1080',
  width: 1920,
  height: 1080,
};

function createInitialProject(): ProjectRecord {
  const tpl = STUDIO_TEMPLATES[0];
  const now = new Date().toISOString();
  return {
    id: `proj-${Date.now()}`,
    name: 'BOLT Classic Project',
    createdAt: now,
    updatedAt: now,
    resolution: { ...DEFAULT_RESOLUTION },
    design: cloneDesign(tpl.design),
  };
}

export default function App() {
  const initialDraft = useRef<ProjectRecord>(loadActiveDraft() || createInitialProject());

  const [projectId, setProjectId] = useState<string>(initialDraft.current.id);
  const [projectName, setProjectName] = useState<string>(initialDraft.current.name);
  const [resolution, setResolution] = useState<CanvasResolution>(initialDraft.current.resolution);
  const [history, setHistory] = useState<HistoryState<LowerThirdDesign>>(() =>
    createHistory(initialDraft.current.design)
  );
  const design = history.present;

  const [savedProjects, setSavedProjects] = useState<ProjectRecord[]>(() => loadSavedProjects());
  const [sidebarSection, setSidebarSection] = useState<SidebarSection>(
    initialDraft.current.design.category || 'bolt'
  );
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('text');
  const [selectedElement, setSelectedElement] = useState<SelectableElementRef>({ kind: 'group' });
  const [mobilePane, setMobilePane] = useState<'templates' | 'canvas' | 'inspector'>('canvas');

  // Cached decoded logo images keyed by logo.id
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(
    () => new Map()
  );

  // Animation preview state
  const [isPlayingAnim, setIsPlayingAnim] = useState(false);
  const [animFrame, setAnimFrame] = useState<AnimationFrameState | undefined>(undefined);
  const animRafRef = useRef<number | null>(null);
  const animStartRef = useRef<number>(0);

  // Export & modals state
  const [isExporting, setIsExporting] = useState(false);
  const [exportModal, setExportModal] = useState<{
    open: boolean;
    dataUrl: string;
    blob: Blob | null;
    hasAlphaTransparency: boolean;
  }>({ open: false, dataUrl: '', blob: null, hasAlphaTransparency: true });

  const [deleteTarget, setDeleteTarget] = useState<ProjectRecord | null>(null);
  const [renameTarget, setRenameTarget] = useState<ProjectRecord | null>(null);
  const [confirmNewProjectOpen, setConfirmNewProjectOpen] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const notify = useCallback(
    (message: string, tone: 'success' | 'error' | 'info' = 'info') => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      setToast({ id: Date.now(), message, tone });
      toastTimerRef.current = window.setTimeout(() => setToast(null), 3200);
    },
    []
  );

  // Hydrate logo images whenever design.logos changes
  useEffect(() => {
    let cancelled = false;
    const syncLogos = async () => {
      const nextMap = new Map<string, HTMLImageElement>();
      for (const logo of design.logos) {
        const existing = loadedImages.get(logo.id);
        if (existing && existing.src === logo.dataUrl && existing.complete) {
          nextMap.set(logo.id, existing);
        } else {
          try {
            const img = await loadImageElement(logo.dataUrl);
            if (!cancelled) nextMap.set(logo.id, img);
          } catch {
            // Ignore failed logo load
          }
        }
      }
      if (!cancelled) {
        setLoadedImages((prev) => {
          if (
            prev.size === nextMap.size &&
            [...nextMap.keys()].every((k) => prev.get(k) === nextMap.get(k))
          ) {
            return prev;
          }
          return nextMap;
        });
      }
    };
    syncLogos();
    return () => {
      cancelled = true;
    };
  }, [design.logos]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save active draft to LocalStorage
  useEffect(() => {
    const now = new Date().toISOString();
    saveActiveDraft({
      id: projectId,
      name: projectName,
      createdAt: now,
      updatedAt: now,
      resolution,
      design,
    });
  }, [projectId, projectName, resolution, design]);

  // Design update helper with optional history commit (sliders pass commit=false, others true)
  const updateDesign = useCallback(
    (updater: (prev: LowerThirdDesign) => LowerThirdDesign, commit = true) => {
      setHistory((prevHist) => {
        const nextDesign = updater(prevHist.present);
        if (commit) {
          return pushHistory(prevHist, nextDesign);
        }
        return { ...prevHist, present: nextDesign };
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    setHistory((h) => undoHistory(h));
  }, []);

  const handleRedo = useCallback(() => {
    setHistory((h) => redoHistory(h));
  }, []);

  // Keyboard shortcuts for Undo / Redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');
      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // Animation playback loop
  const stopAnimation = useCallback(() => {
    if (animRafRef.current !== null) {
      cancelAnimationFrame(animRafRef.current);
      animRafRef.current = null;
    }
    setIsPlayingAnim(false);
    setAnimFrame(undefined);
  }, []);

  const startAnimation = useCallback(() => {
    if (animRafRef.current !== null) cancelAnimationFrame(animRafRef.current);
    setIsPlayingAnim(true);
    animStartRef.current = performance.now();

    const totalDuration =
      design.animation.delay +
      design.animation.inDuration +
      design.animation.holdDuration +
      design.animation.outDuration;

    const tick = (now: number) => {
      const elapsed = now - animStartRef.current;
      const state = computeAnimationFrameState(elapsed, design.animation);
      setAnimFrame(state);

      if (elapsed < totalDuration + 80) {
        animRafRef.current = requestAnimationFrame(tick);
      } else {
        animRafRef.current = null;
        setIsPlayingAnim(false);
        setAnimFrame(undefined);
      }
    };

    animRafRef.current = requestAnimationFrame(tick);
  }, [design.animation]);

  useEffect(() => {
    return () => {
      if (animRafRef.current !== null) cancelAnimationFrame(animRafRef.current);
    };
  }, []);

  // Template selection applies template layout/colors/typography adapted to current resolution
  const handleSelectTemplate = (tpl: StudioTemplate) => {
    stopAnimation();
    const adapted =
      resolution.width === 1920 && resolution.height === 1080
        ? cloneDesign(tpl.design)
        : scaleDesignForResolution(
            tpl.design,
            { width: 1920, height: 1080 },
            { width: resolution.width, height: resolution.height }
          );
    // Preserve uploaded logos if any
    adapted.logos = cloneDesign(design.logos);
    setHistory((prev) => pushHistory(prev, adapted));
    setSelectedElement({ kind: 'group' });
    notify(`Template "${tpl.name}" diterapkan.`, 'info');
  };

  // Resolution change adapts anchor & scale proportionally
  const handleResolutionChange = (nextRes: CanvasResolution) => {
    const scaled = scaleDesignForResolution(
      design,
      { width: resolution.width, height: resolution.height },
      { width: nextRes.width, height: nextRes.height }
    );
    setResolution(nextRes);
    setHistory((prev) => pushHistory(prev, scaled));
    notify(`Resolusi canvas diubah ke ${nextRes.width} × ${nextRes.height}px.`, 'info');
  };

  // Drag handlers on CanvasStage
  const handleDragGroup = (anchorX: number, anchorY: number, commit: boolean) => {
    updateDesign(
      (prev) => ({
        ...prev,
        layout: { ...prev.layout, anchorX, anchorY },
      }),
      commit
    );
  };

  const handleDragSingleElement = (
    ref: Exclude<SelectableElementRef, { kind: 'group' }>,
    nextX: number,
    nextY: number,
    commit: boolean
  ) => {
    updateDesign((prev) => {
      if (ref.kind === 'text') {
        return {
          ...prev,
          texts: prev.texts.map((t) =>
            t.id === ref.id ? { ...t, offsetX: nextX, offsetY: nextY } : t
          ),
        };
      }
      if (ref.kind === 'shape') {
        return {
          ...prev,
          shapes: prev.shapes.map((s) =>
            s.id === ref.id ? { ...s, x: nextX, y: nextY } : s
          ),
        };
      }
      return {
        ...prev,
        logos: prev.logos.map((l) =>
          l.id === ref.id ? { ...l, x: nextX, y: nextY } : l
        ),
      };
    }, commit);
  };

  const handleResetPosition = () => {
    const baseTpl = getTemplateById(design.templateId);
    const adapted = scaleDesignForResolution(
      baseTpl.design,
      { width: 1920, height: 1080 },
      { width: resolution.width, height: resolution.height }
    );
    updateDesign((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        anchorX: adapted.layout.anchorX,
        anchorY: adapted.layout.anchorY,
        scale: adapted.layout.scale,
        marginX: 0,
        marginY: 0,
      },
    }));
  };

  // Reset individual inspector section back to template defaults
  const handleResetSection = (tab: InspectorTab) => {
    const base = getTemplateById(design.templateId).design;
    updateDesign((prev) => {
      switch (tab) {
        case 'text':
          return { ...prev, texts: cloneDesign(base.texts) };
        case 'typography':
          return {
            ...prev,
            texts: prev.texts.map((t, idx) => {
              const ref = base.texts[idx];
              return ref
                ? {
                    ...t,
                    fontFamily: ref.fontFamily,
                    fontSize: ref.fontSize,
                    fontWeight: ref.fontWeight,
                    letterSpacing: ref.letterSpacing,
                    lineHeight: ref.lineHeight,
                    textAlign: ref.textAlign,
                    color: ref.color,
                    opacity: ref.opacity,
                    uppercase: ref.uppercase,
                  }
                : t;
            }),
          };
        case 'colors':
          return {
            ...prev,
            colors: cloneDesign(base.colors),
            shapes: cloneDesign(base.shapes),
          };
        case 'shapes':
          return { ...prev, shapes: cloneDesign(base.shapes) };
        case 'logos':
          return { ...prev, logos: [] };
        case 'layout':
          return {
            ...prev,
            layout: scaleDesignForResolution(
              base,
              { width: 1920, height: 1080 },
              { width: resolution.width, height: resolution.height }
            ).layout,
          };
        case 'effects':
          return { ...prev, effects: cloneDesign(base.effects) };
      }
    }, true);
    notify(`Pengaturan ${tab} dikembalikan ke default template.`, 'info');
  };

  // Project Management
  const handleSaveProject = () => {
    const now = new Date().toISOString();
    const record: ProjectRecord = {
      id: projectId,
      name: projectName.trim() || 'Untitled Lower Third',
      createdAt:
        savedProjects.find((p) => p.id === projectId)?.createdAt || now,
      updatedAt: now,
      resolution: { ...resolution },
      design: cloneDesign(design),
    };

    const exists = savedProjects.some((p) => p.id === record.id);
    const nextList = exists
      ? savedProjects.map((p) => (p.id === record.id ? record : p))
      : [record, ...savedProjects];

    const ok = saveProjectsList(nextList);
    if (ok) {
      setSavedProjects(nextList);
      notify(`Project "${record.name}" berhasil disimpan.`, 'success');
    } else {
      notify('Gagal menyimpan project (kapasitas LocalStorage penuh).', 'error');
    }
  };

  const handleConfirmNewProject = () => {
    stopAnimation();
    const fresh = createInitialProject();
    setProjectId(fresh.id);
    setProjectName(fresh.name);
    setResolution(fresh.resolution);
    setHistory(createHistory(fresh.design));
    setSelectedElement({ kind: 'group' });
    setConfirmNewProjectOpen(false);
    notify('Project baru dibuat.', 'info');
  };

  const handleLoadProject = (proj: ProjectRecord) => {
    stopAnimation();
    setProjectId(proj.id);
    setProjectName(proj.name);
    setResolution(proj.resolution);
    setHistory(createHistory(proj.design));
    setSelectedElement({ kind: 'group' });
    notify(`Project "${proj.name}" dimuat.`, 'success');
  };

  const handleDuplicateProject = (proj: ProjectRecord) => {
    const now = new Date().toISOString();
    const copy: ProjectRecord = {
      ...cloneDesign(proj),
      id: `proj-${Date.now()}`,
      name: `${proj.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    const nextList = [copy, ...savedProjects];
    saveProjectsList(nextList);
    setSavedProjects(nextList);
    notify(`Project diduplikasi menjadi "${copy.name}".`, 'success');
  };

  const handleRenameProject = (nextName: string) => {
    if (!renameTarget) return;
    const nextList = savedProjects.map((p) =>
      p.id === renameTarget.id
        ? { ...p, name: nextName, updatedAt: new Date().toISOString() }
        : p
    );
    saveProjectsList(nextList);
    setSavedProjects(nextList);
    if (renameTarget.id === projectId) {
      setProjectName(nextName);
    }
    setRenameTarget(null);
    notify(`Nama project diubah menjadi "${nextName}".`, 'success');
  };

  const handleConfirmDeleteProject = () => {
    if (!deleteTarget) return;
    const nextList = savedProjects.filter((p) => p.id !== deleteTarget.id);
    saveProjectsList(nextList);
    setSavedProjects(nextList);
    notify(`Project "${deleteTarget.name}" dihapus.`, 'info');
    setDeleteTarget(null);
  };

  const handleExportProjectJson = (proj: ProjectRecord) => {
    const blob = new Blob([JSON.stringify(proj, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(proj.name).replace(/\.png$/, '')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify(`JSON project "${proj.name}" diekspor.`, 'success');
  };

  const handleImportProjectJson = async (file: File) => {
    try {
      const text = await file.text();
      const result = validateImportedProjectJson(text);
      if (!result.ok || !result.project) {
        notify(result.error || 'Gagal mengimpor file JSON.', 'error');
        return;
      }
      const imported: ProjectRecord = {
        ...result.project,
        id: `proj-${Date.now()}`,
      };
      const nextList = [imported, ...savedProjects];
      saveProjectsList(nextList);
      setSavedProjects(nextList);
      handleLoadProject(imported);
    } catch {
      notify('File JSON tidak dapat dibaca.', 'error');
    }
  };

  // Export & Preview Transparent PNG (100% True RGBA Alpha Channel)
  const triggerDownloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizeFilename(name);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePreviewTransparent = async () => {
    setIsExporting(true);
    try {
      const res = await exportDesignToPngBlob(
        design,
        resolution.width,
        resolution.height,
        loadedImages
      );
      setExportModal({
        open: true,
        dataUrl: res.dataUrl,
        blob: res.blob,
        hasAlphaTransparency: res.hasAlphaTransparency,
      });
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Gagal membuat pratinjau PNG.',
        'error'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPng = async () => {
    setIsExporting(true);
    try {
      const res = await exportDesignToPngBlob(
        design,
        resolution.width,
        resolution.height,
        loadedImages
      );
      triggerDownloadBlob(res.blob, projectName);
      notify(
        `PNG transparan (${resolution.width}×${resolution.height}) berhasil diekspor.`,
        'success'
      );
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Gagal mengekspor PNG.',
        'error'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0b0e14] text-slate-100">
      {/* Top Studio Bar */}
      <TopBar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onNewProject={() => setConfirmNewProjectOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onSaveProject={handleSaveProject}
        onPreviewTransparent={handlePreviewTransparent}
        onExportPng={handleExportPng}
        isExporting={isExporting}
      />

      {/* Mobile Pane Switcher (< lg) */}
      <div className="lg:hidden bg-[#0e1219] border-b border-white/10 px-3 py-1.5 grid grid-cols-3 gap-1 shrink-0">
        {(
          [
            { id: 'templates', label: 'Templates' },
            { id: 'canvas', label: 'Canvas' },
            { id: 'inspector', label: 'Editor' },
          ] as const
        ).map((pane) => (
          <button
            key={pane.id}
            type="button"
            onClick={() => setMobilePane(pane.id)}
            className={`h-8 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              mobilePane === pane.id
                ? 'bg-[#1c2331] text-[#d9b66d] border border-[#d9b66d]/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {pane.label}
          </button>
        ))}
      </div>

      {/* Main 3-Column Studio Workspace */}
      <main className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Sidebar: Templates & My Designs */}
        <div
          className={`${
            mobilePane === 'templates' ? 'flex w-full' : 'hidden'
          } lg:flex lg:w-auto min-h-0`}
        >
          <TemplateSidebar
            activeSection={sidebarSection}
            onSectionChange={setSidebarSection}
            activeTemplateId={design.templateId}
            onSelectTemplate={(tpl) => {
              handleSelectTemplate(tpl);
              setMobilePane('canvas');
            }}
            savedProjects={savedProjects}
            activeProjectId={projectId}
            onLoadProject={(proj) => {
              handleLoadProject(proj);
              setMobilePane('canvas');
            }}
            onDuplicateProject={handleDuplicateProject}
            onRequestRenameProject={setRenameTarget}
            onRequestDeleteProject={setDeleteTarget}
            onExportProjectJson={handleExportProjectJson}
            onImportProjectJson={handleImportProjectJson}
          />
        </div>

        {/* Center Canvas Preview Stage */}
        <div
          className={`${
            mobilePane === 'canvas' ? 'flex' : 'hidden'
          } lg:flex flex-1 min-w-0 min-h-0`}
        >
          <CanvasStage
            design={design}
            resolution={resolution}
            loadedImages={loadedImages}
            animFrame={animFrame}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onResolutionChange={handleResolutionChange}
            onDragGroup={handleDragGroup}
            onDragSingleElement={handleDragSingleElement}
            onResetPosition={handleResetPosition}
          />
        </div>

        {/* Right Inspector Panel */}
        <div
          className={`${
            mobilePane === 'inspector' ? 'flex w-full' : 'hidden'
          } lg:flex lg:w-auto min-h-0`}
        >
          <InspectorPanel
            activeTab={inspectorTab}
            onTabChange={setInspectorTab}
            design={design}
            resolution={resolution}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onUpdateDesign={updateDesign}
            onResetSection={handleResetSection}
            onLogoLoaded={(logo: LogoElement, img: HTMLImageElement) => {
              setLoadedImages((prev) => {
                const next = new Map(prev);
                next.set(logo.id, img);
                return next;
              });
              updateDesign(
                (prev) => ({ ...prev, logos: [...prev.logos, logo] }),
                true
              );
            }}
            onNotify={notify}
          />
        </div>
      </main>

      {/* Bottom Animation Preview Bar */}
      <AnimationBar
        animation={design.animation}
        onChange={(nextAnim: AnimationConfig) =>
          updateDesign((prev) => ({ ...prev, animation: nextAnim }), true)
        }
        isPlaying={isPlayingAnim}
        animFrame={animFrame}
        onPlay={startAnimation}
        onReplay={startAnimation}
        onStop={stopAnimation}
        onReset={() => {
          stopAnimation();
          const baseAnim = getTemplateById(design.templateId).design.animation;
          updateDesign((prev) => ({ ...prev, animation: cloneDesign(baseAnim) }), true);
          notify('Pengaturan animasi direset ke default.', 'info');
        }}
      />

      {/* Modals */}
      <ExportPreviewModal
        open={exportModal.open}
        onClose={() => setExportModal((m) => ({ ...m, open: false }))}
        dataUrl={exportModal.dataUrl}
        width={resolution.width}
        height={resolution.height}
        fileSizeBytes={exportModal.blob?.size || 0}
        hasAlphaTransparency={exportModal.hasAlphaTransparency}
        projectName={projectName}
        onDownload={() => {
          if (exportModal.blob) {
            triggerDownloadBlob(exportModal.blob, projectName);
            notify('File PNG transparan berhasil diunduh.', 'success');
          }
        }}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Project Tersimpan?"
        message={`Project "${deleteTarget?.name || ''}" akan dihapus permanen dari penyimpanan lokal browser Anda.`}
        confirmLabel="Hapus Project"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDeleteProject}
      />

      <ConfirmModal
        open={confirmNewProjectOpen}
        title="Buat Project Baru?"
        message="Workspace akan dimulai ulang dengan template default BOLT Classic. Pastikan Anda sudah menyimpan project saat ini jika diperlukan."
        confirmLabel="Buat Baru"
        danger={false}
        onCancel={() => setConfirmNewProjectOpen(false)}
        onConfirm={handleConfirmNewProject}
      />

      <RenameModal
        open={Boolean(renameTarget)}
        initialName={renameTarget?.name || ''}
        onCancel={() => setRenameTarget(null)}
        onSave={handleRenameProject}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="fixed bottom-16 right-4 z-50 max-w-sm px-3.5 py-2.5 rounded-lg bg-[#171c26] border border-white/15 shadow-xl flex items-center gap-2.5 text-xs font-medium text-slate-100"
        >
          {toast.tone === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          {toast.tone === 'error' && (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          {toast.tone === 'info' && (
            <Info className="w-4 h-4 text-[#d9b66d] shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
