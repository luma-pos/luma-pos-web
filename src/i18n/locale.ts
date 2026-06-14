"use server";

import { cookies } from "next/headers";
import { COOKIE_NAME, defaultLocale, type Locale, locales } from "./config";

export async function getUserLocale(): Promise<Locale> {
  const c = (await cookies()).get(COOKIE_NAME)?.value;
  return locales.includes(c as Locale) ? (c as Locale) : defaultLocale;
}

export async function setUserLocale(locale: Locale) {
  (await cookies()).set(COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
