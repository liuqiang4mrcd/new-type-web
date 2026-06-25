import { parseLocaleSearch, type ParsedLocale } from "@new-type/utils";
import { ar } from "./ar";
import { en } from "./en";
import { zh } from "./zh";
import type { I18nMessages, SupportedLang } from "./types";

export type { I18nMessages, SupportedLang } from "./types";

export const DEFAULT_LANG: SupportedLang = "en";
export const SUPPORTED_LANGS = ["en", "zh", "ar"] as const;
export const RTL_LANGS = ["ar"] as const;

const messages: Record<SupportedLang, I18nMessages> = {
  en,
  zh,
  ar,
};

export function getI18nMessages(lang: SupportedLang): I18nMessages {
  return messages[lang] ?? messages[DEFAULT_LANG];
}

export function parseCampaignLocale(search: string): ParsedLocale<SupportedLang> {
  return parseLocaleSearch(search, {
    defaultLang: DEFAULT_LANG,
    supportedLangs: SUPPORTED_LANGS,
    rtlLangs: RTL_LANGS,
  });
}

export function getCurrentCampaignLocale(): ParsedLocale<SupportedLang> {
  if (typeof window === "undefined") {
    return parseCampaignLocale("");
  }

  return parseCampaignLocale(window.location.search);
}
