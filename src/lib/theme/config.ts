/** 4 theme từ design system (design/assets/ui.css). */
export const themes = ["ocean", "terra", "emerald", "violet"] as const;
export type Theme = (typeof themes)[number];
export const defaultTheme: Theme = "ocean";
export const THEME_COOKIE = "ui_theme";

/** Chế độ sáng/tối. "system" = theo hệ điều hành. */
export const modes = ["light", "dark", "system"] as const;
export type Mode = (typeof modes)[number];
export const defaultMode: Mode = "system";
export const MODE_COOKIE = "ui_mode";

export const themeMeta: Record<Theme, { label: string; swatch: string }> = {
  ocean:   { label: "Ocean",      swatch: "oklch(0.546 0.245 262.881)" },
  terra:   { label: "Terracotta", swatch: "oklch(0.55 0.155 38)" },
  emerald: { label: "Emerald",    swatch: "oklch(0.596 0.145 163.225)" },
  violet:  { label: "Violet",     swatch: "oklch(0.541 0.281 293.009)" },
};
