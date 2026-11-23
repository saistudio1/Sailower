import React from 'react';
import {
  Download,
  Eye,
  FilePlus2,
  Layers,
  Redo2,
  Save,
  Undo2,
} from 'lucide-react';

interface TopBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onNewProject: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSaveProject: () => void;
  onPreviewTransparent: () => void;
  onExportPng: () => void;
  isExporting: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  onProjectNameChange,
  onNewProject,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSaveProject,
  onPreviewTransparent,
  onExportPng,
  isExporting,
}) => {
  return (
    <header className="h-14 shrink-0 bg-[#11151d] border-b border-white/10 px-3 lg:px-4 flex items-center justify-between gap-3">
      {/* Left: Brand + Project Name */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-8 h-8 rounded-md bg-[#092c25] border border-[#d9b66d]/50 flex items-center justify-center"
            aria-hidden="true"
          >
            <Layers className="w-4 h-4 text-[#d9b66d]" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-100 whitespace-nowrap hidden sm:inline">
            Lower Third Studio
          </span>
        </div>

        <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
          /
        </span>

        <label htmlFor="project-name-input" className="sr-only">
          Nama Project
        </label>
        <input
          id="project-name-input"
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="Nama Project..."
          title="Ubah nama project (digunakan untuk nama file PNG)"
          className="h-8 w-full max-w-[130px] sm:max-w-[210px] lg:max-w-[260px] min-w-0 px-2.5 rounded-md bg-[#0b0e14] border border-white/10 text-xs sm:text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#d9b66d] transition-colors"
        />
      </div>

      {/* Right: Studio Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onNewProject}
          title="Buat project baru dari template default"
          className="h-8 px-2.5 rounded-md border border-white/10 bg-[#171c26] hover:bg-[#1f2633] text-xs font-medium text-slate-200 hidden sm:flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FilePlus2 className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden md:inline">New Project</span>
        </button>

        <div className="flex items-center rounded-md border border-white/10 bg-[#171c26] overflow-hidden shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo perubahan terakhir (Ctrl+Z)"
            className="h-8 px-2.5 hover:bg-[#1f2633] disabled:opacity-35 disabled:pointer-events-none text-slate-200 flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer border-r border-white/10"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Undo</span>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo perubahan (Ctrl+Y)"
            className="h-8 px-2.5 hover:bg-[#1f2633] disabled:opacity-35 disabled:pointer-events-none text-slate-200 flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Redo</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onSaveProject}
          title="Simpan project ke penyimpanan lokal browser"
          className="h-8 px-2.5 sm:px-3 rounded-md border border-white/10 bg-[#171c26] hover:bg-[#1f2633] text-xs font-medium text-slate-100 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-[#d9b66d]" />
          <span className="hidden sm:inline">Save Project</span>
        </button>

        <button
          type="button"
          onClick={onPreviewTransparent}
          title="Pratinjau hasil PNG transparan sebelum mengunduh"
          className="h-8 px-2.5 rounded-md border border-white/10 bg-[#171c26] hover:bg-[#1f2633] text-xs font-medium text-slate-200 hidden sm:flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden lg:inline">Preview Transparent</span>
        </button>

        <button
          type="button"
          onClick={onExportPng}
          disabled={isExporting}
          title="Ekspor grafis lower third sebagai PNG transparan (RGBA)"
          className="h-8 px-3 sm:px-3.5 rounded-md bg-[#d9b66d] hover:bg-[#e4c37d] disabled:opacity-60 text-[#092c25] text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Exporting...' : 'Export PNG'}</span>
        </button>
      </div>
    </header>
  );
};
