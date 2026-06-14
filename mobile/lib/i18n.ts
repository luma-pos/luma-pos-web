import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import webVi from "../../messages/vi.json";
import webEn from "../../messages/en.json";
import { vi as mobileVi } from "../locales/vi";
import { en as mobileEn } from "../locales/en";

/**
 * Dùng LẠI file dịch của web (messages/vi.json, en.json) làm nền — single source.
 * Overlay mobile (locales/*.ts) chỉ bổ sung khoá web không có (tabs, tiêu đề chi tiết…).
 * Bundle được nhờ metro.config.js (watchFolders trỏ repo gốc).
 */
type Dict = Record<string, unknown>;
function deepMerge(base: Dict, over: Dict): Dict {
  const out: Dict = { ...base };
  for (const k of Object.keys(over)) {
    const a = out[k];
    const b = over[k];
    out[k] = a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)
      ? deepMerge(a as Dict, b as Dict)
      : b;
  }
  return out;
}

const viRes = deepMerge(webVi as Dict, mobileVi as unknown as Dict);
const enRes = deepMerge(webEn as Dict, mobileEn as unknown as Dict);

const deviceLang = getLocales()[0]?.languageCode ?? "vi";

i18n.use(initReactI18next).init({
  resources: { vi: { translation: viRes }, en: { translation: enRes } },
  lng: deviceLang === "en" ? "en" : "vi",
  fallbackLng: "vi",
  interpolation: { escapeValue: false },
});

/** Đổi ngôn ngữ tại runtime (dùng cho nút trong màn Thêm). */
export const setLanguage = (lng: "vi" | "en") => i18n.changeLanguage(lng);

export default i18n;
