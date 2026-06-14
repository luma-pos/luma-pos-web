"use server";

import { cookies } from "next/headers";
import {
  defaultTheme, THEME_COOKIE, themes, type Theme,
  defaultMode, MODE_COOKIE, modes, type Mode,
} from "./config";

export async function getTheme(): Promise<Theme> {
  const c = (await cookies()).get(THEME_COOKIE)?.value;
  return themes.includes(c as Theme) ? (c as Theme) : defaultTheme;
}

export async function setTheme(theme: Theme) {
  (await cookies()).set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getMode(): Promise<Mode> {
  const c = (await cookies()).get(MODE_COOKIE)?.value;
  return modes.includes(c as Mode) ? (c as Mode) : defaultMode;
}

export async function setMode(mode: Mode) {
  (await cookies()).set(MODE_COOKIE, mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
