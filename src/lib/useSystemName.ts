import { useEffect, useState } from "react";
import { fetchSystemCatalog } from "./db";
import { useI18n } from "./i18n";
import { isSupabaseConfigured } from "./supabase";

// The catalog is small and rarely changes, so it is fetched once per session and
// shared by every screen that shows a system name.
let catalogPromise: Promise<Map<string, string>> | null = null;

function loadEnToEs(): Promise<Map<string, string>> {
  if (!catalogPromise) {
    catalogPromise = fetchSystemCatalog()
      .then((rows) => new Map(rows.map((r) => [r.name_en, r.name_es])))
      .catch((err) => {
        console.error("Could not load the system catalog", err);
        catalogPromise = null; // allow a retry on the next mount
        return new Map<string, string>();
      });
  }
  return catalogPromise;
}

/** Returns a function that renders a system's English catalog name in the active locale. */
export function useSystemName(): (nameEn: string | null | undefined) => string {
  const { locale } = useI18n();
  const [enToEs, setEnToEs] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isSupabaseConfigured || locale !== "es") return;
    let cancelled = false;
    void loadEnToEs().then((m) => { if (!cancelled) setEnToEs(m); });
    return () => { cancelled = true; };
  }, [locale]);

  return (nameEn) => {
    if (!nameEn) return "";
    return locale === "es" ? enToEs.get(nameEn) ?? nameEn : nameEn;
  };
}
