import type { CSSProperties } from "react";

export type IconName = "grid" | "home" | "bag" | "layers" | "orders" | "arrow" | "check" | "close" | "info" | "alert" | "menu" | "chevron" | "clock" | "settings" | "spark";
const paths: Record<IconName, string> = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  home: "m3 10 9-7 9 7 M5 9v12h14V9 M9 21v-8h6v8",
  bag: "M5 7h14l1 14H4L5 7Z M9 7V5a3 3 0 0 1 6 0v2",
  layers: "m12 3 10 5-10 5L2 8l10-5Z M2 12l10 5 10-5 M2 16l10 5 10-5",
  orders: "M6 3h12v18H6z M9 7h6 M9 11h6 M9 15h3",
  arrow: "M4 12h16 m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12 M18 6 6 18",
  info: "M12 8h.01 M12 11v6 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  alert: "m12 3 10 18H2L12 3Z M12 9v4 M12 17h.01",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  chevron: "m9 5 7 7-7 7",
  clock: "M12 7v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  settings: "M4 7h16 M4 17h16 M8 4v6 M16 14v6",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
};
export function Icon({ name, size = 20, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={style}><path d={paths[name]} /></svg>;
}
