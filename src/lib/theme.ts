export type ThemeId = "marina" | "noche" | "carbon" | "costa" | "arena" | "niebla";

export type ThemeMeta = {
  id: ThemeId;
  labelEs: string;
  labelEn: string;
  dark: boolean;
  accent: string;
  bg: string;
};

export const THEMES: ThemeMeta[] = [
  { id: "marina", labelEs: "Marina",  labelEn: "Marina",  dark: true,  accent: "#73d6d1", bg: "#0b2434" },
  { id: "noche",  labelEs: "Noche",   labelEn: "Night",   dark: true,  accent: "#a78bfa", bg: "#1a1a1a" },
  { id: "carbon", labelEs: "Carbón",  labelEn: "Carbon",  dark: true,  accent: "#f59e0b", bg: "#2a1f17" },
  { id: "costa",  labelEs: "Costa",   labelEn: "Coast",   dark: false, accent: "#0891b2", bg: "#e8f4f8" },
  { id: "arena",  labelEs: "Arena",   labelEn: "Sand",    dark: false, accent: "#b45309", bg: "#f9efe0" },
  { id: "niebla", labelEs: "Niebla",  labelEn: "Mist",    dark: false, accent: "#3b82f6", bg: "#e8edf4" },
];

const STORAGE_KEY = "boathub-theme";
const DEFAULT: ThemeId = "marina";

export function getStoredTheme(): ThemeId {
  const v = localStorage.getItem(STORAGE_KEY);
  return (THEMES.find((t) => t.id === v)?.id ?? DEFAULT);
}

export function applyTheme(id: ThemeId) {
  const html = document.documentElement;
  if (id === DEFAULT) {
    html.removeAttribute("data-theme");
  } else {
    html.setAttribute("data-theme", id);
  }
  localStorage.setItem(STORAGE_KEY, id);
}

export function initTheme() {
  applyTheme(getStoredTheme());
}
