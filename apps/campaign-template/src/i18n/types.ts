export type SupportedLang = "en" | "zh" | "ar";

export interface I18nMessages {
  scaffold: {
    title: string;
    description: string;
    checklist: string[];
    loading: string;
    error: string;
  };
  errors: Record<string, string>;
}
