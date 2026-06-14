/** Emoji theo danh mục — khớp design mockup. Client-safe (không import DB). */
export function categoryEmoji(name: string | null): string {
  if (!name) return "📦";
  const n = name.toLowerCase();
  if (n.includes("gạch")) return "🧱";
  if (n.includes("xi măng") || n.includes("cát")) return "🏗️";
  if (n.includes("thép") || n.includes("sắt")) return "⛓️";
  if (n.includes("vệ sinh")) return "🚿";
  if (n.includes("nước")) return "🔧";
  if (n.includes("sơn")) return "🎨";
  if (n.includes("bếp")) return "🔥";
  if (n.includes("điện")) return "💡";
  return "📦";
}
