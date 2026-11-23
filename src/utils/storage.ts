import type { ProjectRecord } from '../types/studio';

const PROJECTS_KEY = 'lower-third-studio-projects-v1';
const ACTIVE_DRAFT_KEY = 'lower-third-studio-active-draft-v1';

export function loadSavedProjects(): ProjectRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is ProjectRecord =>
        Boolean(p && typeof p === 'object' && p.id && p.name && p.design && p.resolution)
    );
  } catch {
    return [];
  }
}

export function saveProjectsList(projects: ProjectRecord[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return true;
  } catch {
    return false;
  }
}

export function loadActiveDraft(): ProjectRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProjectRecord;
    if (parsed && parsed.design && parsed.resolution) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveActiveDraft(project: ProjectRecord): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_DRAFT_KEY, JSON.stringify(project));
  } catch {
    // Ignore quota overflow for auto-draft
  }
}
