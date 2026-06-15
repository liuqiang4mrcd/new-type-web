import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { SectionNaming, SectionPaths } from './types';

export function discoverSectionNames(rootDir: string): string[] {
  const sectionsDir = join(rootDir, 'designer', 'sections');
  if (!existsSync(sectionsDir)) {
    return [];
  }
  const entries = readdirSync(sectionsDir);
  return entries.filter((e) => {
    const full = join(sectionsDir, e);
    return statSync(full).isDirectory() && e !== '.';
  });
}

export function buildSectionNaming(sectionName: string): SectionNaming {
  const baseName = sectionName.endsWith('Section')
    ? sectionName.slice(0, -7)
    : sectionName;
  return {
    sectionName,
    baseName,
    contentTypeName: `${baseName}Content`,
  };
}

export function resolveSectionPaths(
  rootDir: string,
  naming: SectionNaming,
): SectionPaths {
  const dir = join(rootDir, 'designer', 'sections', naming.sectionName);
  return {
    dir,
    typesFile: join(dir, 'types.ts'),
    contentFile: join(dir, 'content.ts'),
    indexFile: join(dir, 'index.tsx'),
    statesFile: join(dir, 'states.tsx'),
  };
}

export function readFileSafe(
  filePath: string,
): { ok: true; text: string } | { ok: false; error: string } {
  try {
    if (!existsSync(filePath)) {
      return { ok: false, error: `File not found: ${filePath}` };
    }
    const text = readFileSync(filePath, 'utf-8');
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: `Error reading ${filePath}: ${e}` };
  }
}
