export type TextDirection = 'ltr' | 'rtl';

export interface LocaleSearchOptions<TLang extends string> {
  defaultLang: TLang;
  supportedLangs: readonly TLang[];
  rtlLangs?: readonly TLang[];
  langParam?: string;
  dirParam?: string;
}

export interface ParsedLocale<TLang extends string> {
  lang: TLang;
  dir: TextDirection;
}

function normalizeSearchInput(search: string): string {
  if (!search) return '';
  if (search.startsWith('?')) return search;

  try {
    return new URL(search, 'https://localhost').search;
  } catch {
    return `?${search}`;
  }
}

function normalizeDirection(value: string | null): TextDirection | null {
  return value === 'ltr' || value === 'rtl' ? value : null;
}

export function parseLocaleSearch<TLang extends string>(
  search: string,
  options: LocaleSearchOptions<TLang>,
): ParsedLocale<TLang> {
  const langParam = options.langParam ?? 'lang';
  const dirParam = options.dirParam ?? 'dir';
  const supportedLangs = new Set<string>(options.supportedLangs);
  const rtlLangs = new Set<string>(options.rtlLangs ?? []);
  const params = new URLSearchParams(normalizeSearchInput(search));
  const requestedLang = params.get(langParam);
  const lang =
    requestedLang && supportedLangs.has(requestedLang)
      ? (requestedLang as TLang)
      : options.defaultLang;
  const inferredDir: TextDirection = rtlLangs.has(lang) ? 'rtl' : 'ltr';
  const dir = normalizeDirection(params.get(dirParam)) ?? inferredDir;

  return { lang, dir };
}
