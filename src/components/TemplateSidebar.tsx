import React, { useMemo, useRef, useState } from 'react';
import {
  Copy,
  Download,
  FolderOpen,
  Pencil,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { CATEGORY_META, STUDIO_TEMPLATES } from '../data/templates';
import type { ProjectRecord, StudioTemplate, TemplateCategory } from '../types/studio';
import { TemplateThumbnail } from './TemplateThumbnail';

export type SidebarSection = TemplateCategory | 'my-designs';

interface TemplateSidebarProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
  activeTemplateId: string;
  onSelectTemplate: (template: StudioTemplate) => void;
  savedProjects: ProjectRecord[];
  activeProjectId: string;
  onLoadProject: (project: ProjectRecord) => void;
  onDuplicateProject: (project: ProjectRecord) => void;
  onRequestRenameProject: (project: ProjectRecord) => void;
  onRequestDeleteProject: (project: ProjectRecord) => void;
  onExportProjectJson: (project: ProjectRecord) => void;
  onImportProjectJson: (file: File) => void;
}

export const TemplateSidebar: React.FC<TemplateSidebarProps> = ({
  activeSection,
  onSectionChange,
  activeTemplateId,
  onSelectTemplate,
  savedProjects,
  activeProjectId,
  onLoadProject,
  onDuplicateProject,
  onRequestRenameProject,
  onRequestDeleteProject,
  onExportProjectJson,
  onImportProjectJson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const filteredTemplates = useMemo(() => {
    if (activeSection === 'my-designs') return [];
    const q = searchQuery.trim().toLowerCase();
    return STUDIO_TEMPLATES.filter((t) => {
      if (t.category !== activeSection) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.composition.toLowerCase().includes(q)
      );
    });
  }, [activeSection, searchQuery]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return savedProjects
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((p) => (!q ? true : p.name.toLowerCase().includes(q)));
  }, [savedProjects, searchQuery]);

  const currentCategoryInfo = CATEGORY_META.find((c) => c.id === activeSection);

  return (
    <aside className="w-full lg:w-[276px] shrink-0 bg-[#11151d] border-r border-white/10 flex flex-col min-h-0 h-full">
      {/* Category Navigation */}
      <div className="p-3 border-b border-white/10">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Templates & Library
        </div>
        <nav className="grid grid-cols-2 lg:grid-cols-1 gap-1" aria-label="Kategori Template">
          {CATEGORY_META.map((cat) => {
            const count = STUDIO_TEMPLATES.filter((t) => t.category === cat.id).length;
            const active = activeSection === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSectionChange(cat.id)}
                className={`w-full px-2.5 py-2 rounded-md text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1c2331] text-slate-100 border border-[#d9b66d]/40'
                    : 'text-slate-300 hover:bg-[#171c26] border border-transparent'
                }`}
              >
                <span className="text-xs font-semibold truncate">{cat.label}</span>
                <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                  {count}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onSectionChange('my-designs')}
            className={`w-full px-2.5 py-2 rounded-md text-left flex items-center justify-between gap-2 transition-colors cursor-pointer col-span-2 lg:col-span-1 mt-0.5 ${
              activeSection === 'my-designs'
                ? 'bg-[#1c2331] text-[#f5edda] border border-[#d9b66d]/50'
                : 'text-slate-300 hover:bg-[#171c26] border border-transparent'
            }`}
          >
            <span className="text-xs font-semibold flex items-center gap-1.5 truncate">
              <FolderOpen className="w-3.5 h-3.5 text-[#d9b66d] shrink-0" />
              My Designs
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
              {savedProjects.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Search Box */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <label htmlFor="template-search" className="sr-only">
            Cari template atau project
          </label>
          <input
            id="template-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSection === 'my-designs' ? 'Cari desain tersimpan...' : 'Cari template...'
            }
            className="w-full h-8 pl-8 pr-2.5 rounded-md bg-[#0b0e14] border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#d9b66d]"
          />
        </div>
        {currentCategoryInfo && (
          <p className="text-[11px] text-slate-400 mt-2 px-0.5 leading-snug">
            {currentCategoryInfo.subtitle}
          </p>
        )}
      </div>

      {/* Template List OR My Designs */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2.5">
        {activeSection !== 'my-designs' ? (
          filteredTemplates.length > 0 ? (
            filteredTemplates.map((tpl) => {
              const isSelected = activeTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onSelectTemplate(tpl)}
                  className={`w-full text-left rounded-lg p-2 border transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-[#1a212e] border-[#d9b66d]/70'
                      : 'bg-[#151a23] border-white/8 hover:border-white/20 hover:bg-[#181e28]'
                  }`}
                >
                  <TemplateThumbnail template={tpl} />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-100 truncate">
                      {tpl.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 capitalize">
                      {tpl.composition.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-snug">
                    {tpl.description}
                  </p>
                </button>
              );
            })
          ) : (
            <div className="text-center py-8 px-3 text-xs text-slate-400">
              Tidak ada template yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
            </div>
          )
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImportProjectJson(file);
                    e.target.value = '';
                  }
                }}
              />
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="w-full h-8 px-3 rounded-md border border-white/10 bg-[#171c26] hover:bg-[#1f2633] text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#d9b66d]" />
                <span>Import Project JSON</span>
              </button>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="rounded-lg border border-white/8 bg-[#151a23] p-4 text-center">
                <p className="text-xs font-medium text-slate-300">Belum ada project tersimpan</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Klik tombol <strong className="text-slate-200">Save Project</strong> di bilah atas
                  untuk menyimpan desain Anda secara lokal di browser.
                </p>
              </div>
            ) : (
              filteredProjects.map((proj) => {
                const isCurrent = proj.id === activeProjectId;
                return (
                  <div
                    key={proj.id}
                    className={`rounded-lg p-2.5 border transition-colors ${
                      isCurrent
                        ? 'bg-[#1a212e] border-[#d9b66d]/60'
                        : 'bg-[#151a23] border-white/8'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onLoadProject(proj)}
                        className="text-left min-w-0 flex-1 cursor-pointer group"
                      >
                        <div className="text-xs font-semibold text-slate-100 group-hover:text-[#d9b66d] truncate">
                          {proj.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                          {proj.resolution.width} × {proj.resolution.height} ·{' '}
                          {new Date(proj.updatedAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/8 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => onLoadProject(proj)}
                        className="px-2 py-1 rounded text-[11px] font-medium bg-[#1f2633] hover:bg-[#2a3344] text-slate-200 cursor-pointer"
                      >
                        Buka
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onDuplicateProject(proj)}
                          aria-label={`Duplikat ${proj.name}`}
                          title="Duplikat Project"
                          className="p-1.5 rounded hover:bg-white/10 text-slate-300 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestRenameProject(proj)}
                          aria-label={`Ubah nama ${proj.name}`}
                          title="Rename Project"
                          className="p-1.5 rounded hover:bg-white/10 text-slate-300 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onExportProjectJson(proj)}
                          aria-label={`Ekspor JSON ${proj.name}`}
                          title="Export JSON"
                          className="p-1.5 rounded hover:bg-white/10 text-slate-300 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteProject(proj)}
                          aria-label={`Hapus ${proj.name}`}
                          title="Delete Project"
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
