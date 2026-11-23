import React, { useState } from 'react';
import { CheckCircle2, Download, X } from 'lucide-react';
import { sanitizeFilename } from '../utils/layoutMath';

interface ExportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  dataUrl: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  hasAlphaTransparency: boolean;
  projectName: string;
  onDownload: () => void;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  open,
  onClose,
  dataUrl,
  width,
  height,
  fileSizeBytes,
  hasAlphaTransparency,
  projectName,
  onDownload,
}) => {
  const [backdrop, setBackdrop] = useState<'checker' | 'dark' | 'light' | 'chroma'>('checker');

  if (!open) return null;

  const backdropClass =
    backdrop === 'checker'
      ? 'checkerboard-bg'
      : backdrop === 'dark'
      ? 'bg-[#090c11]'
      : backdrop === 'light'
      ? 'bg-slate-200'
      : 'bg-[#00b140]';

  const fileSizeKb = (fileSizeBytes / 1024).toFixed(1);
  const filename = sanitizeFilename(projectName);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-4xl rounded-xl bg-[#11151d] border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
          <div>
            <h3 id="export-modal-title" className="text-sm font-bold text-slate-100">
              Preview Transparent PNG (RGBA)
            </h3>
            <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
              {filename} · {width} × {height}px · {fileSizeKb} KB
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Preview"
            className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {/* Backdrop Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              {hasAlphaTransparency && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Alpha Channel RGBA Aktif (Background 100% Transparan)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-md bg-[#0b0e14] border border-white/10 p-0.5">
              {(
                [
                  { id: 'checker', label: 'Checkerboard' },
                  { id: 'dark', label: 'Dark Video' },
                  { id: 'light', label: 'Light Slide' },
                  { id: 'chroma', label: 'Green Screen' },
                ] as const
              ).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBackdrop(b.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                    backdrop === b.id
                      ? 'bg-[#1c2331] text-[#d9b66d]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transparent Image Stage */}
          <div
            className={`w-full rounded-lg border border-white/10 p-3 flex items-center justify-center ${backdropClass}`}
          >
            <img
              src={dataUrl}
              alt="Hasil ekspor PNG transparan"
              className="max-h-[55vh] w-auto object-contain"
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-white/10 bg-[#0e1219] flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Siap digunakan sebagai overlay di CapCut, VN, Premiere Pro, DaVinci Resolve, & OBS.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-md border border-white/10 bg-[#171c26] hover:bg-[#1f2633] text-xs font-medium text-slate-200 cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="h-9 px-4 rounded-md bg-[#d9b66d] hover:bg-[#e4c37d] text-[#092c25] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel,
  danger = true,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl bg-[#11151d] border border-white/15 p-5 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100">{title}</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 px-3 rounded-md border border-white/10 bg-[#171c26] hover:bg-[#1f2633] text-xs font-medium text-slate-200 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-8 px-3.5 rounded-md text-xs font-bold cursor-pointer ${
              danger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-[#d9b66d] hover:bg-[#e4c37d] text-[#092c25]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface RenameModalProps {
  open: boolean;
  initialName: string;
  onCancel: () => void;
  onSave: (nextName: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  open,
  initialName,
  onCancel,
  onSave,
}) => {
  const [value, setValue] = useState(initialName);

  React.useEffect(() => {
    setValue(initialName);
  }, [initialName, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSave(value.trim());
        }}
        className="w-full max-w-sm rounded-xl bg-[#11151d] border border-white/15 p-5 shadow-2xl space-y-4"
      >
        <h3 className="text-sm font-bold text-slate-100">Ubah Nama Project</h3>
        <div>
          <label htmlFor="rename-project-field" className="block text-xs text-slate-400 mb-1">
            Nama Baru
          </label>
          <input
            id="rename-project-field"
            type="text"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Masukkan nama project..."
            className="w-full h-9 px-3 rounded-md bg-[#0b0e14] border border-white/15 text-sm text-slate-100 focus:outline-none focus:border-[#d9b66d]"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 px-3 rounded-md border border-white/10 bg-[#171c26] hover:bg-[#1f2633] text-xs font-medium text-slate-200 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="h-8 px-3.5 rounded-md bg-[#d9b66d] hover:bg-[#e4c37d] disabled:opacity-50 text-[#092c25] text-xs font-bold cursor-pointer"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
};
