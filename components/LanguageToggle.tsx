"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { locales, type Locale } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale, t } = useTranslation();
  const nextLocale: Locale = locale === "en" ? "it" : "en";
  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-secondary transition-colors hover:bg-muted hover:text-primary"
      aria-label={t(
        locale === "en" ? "Switch to Italian" : "Switch to English",
      )}
      title={t("Language")}
    >
      <span aria-hidden="true">{locale === "en" ? "IT" : "EN"}</span>
      <span>{t(locale === "en" ? "Italian" : "English")}</span>
    </button>
  );
}

export { locales };
