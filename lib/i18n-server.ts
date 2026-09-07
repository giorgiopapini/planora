import "server-only";

import { cookies } from "next/headers";
import {
  defaultLocale,
  getDictionary,
  isLocale,
  localeCookieName,
  translate,
  type Locale,
} from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(localeCookieName)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getServerTranslations() {
  const locale = await getLocale();
  return {
    locale,
    dictionary: getDictionary(locale),
    t: (key: string, values?: Record<string, string | number>) =>
      translate(locale, key, values),
  };
}
