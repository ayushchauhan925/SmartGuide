export const LANGUAGES = [
  { code: "en", label: "English", speech: "en-US" },
  { code: "hi", label: "हिन्दी", speech: "hi-IN" },
  { code: "es", label: "Español", speech: "es-ES" },
  { code: "fr", label: "Français", speech: "fr-FR" },
  { code: "de", label: "Deutsch", speech: "de-DE" },
  { code: "it", label: "Italiano", speech: "it-IT" },
  { code: "pt", label: "Português", speech: "pt-PT" },
  { code: "ja", label: "日本語", speech: "ja-JP" },
  { code: "zh", label: "中文", speech: "zh-CN" },
  { code: "ar", label: "العربية", speech: "ar-SA" },
] as const;

export const DEFAULT_LANGUAGE = "en";

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export function isLanguage(code: string | null | undefined): code is LanguageCode {
  return !!code && LANGUAGES.some((l) => l.code === code);
}

export function speechLang(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.speech ?? "en-US";
}

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}
