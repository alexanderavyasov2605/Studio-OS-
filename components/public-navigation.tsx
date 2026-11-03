"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { publicNavigation } from "@/lib/navigation";
import { cx } from "@/lib/ui";
import { Icon } from "@/components/ui";

export function PublicNavigation() {
  const pathname = usePathname();
  const details = useRef<HTMLDetailsElement>(null);
  const links = publicNavigation.map(({ href, label }) => (
    <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={cx("nav-link", pathname === href && "nav-link--active")} onClick={() => { if (details.current) details.current.open = false; }}>{label}</Link>
  ));
  return <>
    <nav aria-label="Основная навигация" className="public-nav">{links}</nav>
    <details className="mobile-menu" ref={details} onKeyDown={(event) => { if (event.key === "Escape") { details.current?.removeAttribute("open"); details.current?.querySelector("summary")?.focus(); } }}>
      <summary><Icon name="menu" /><span>Меню</span></summary>
      <nav aria-label="Мобильная навигация сайта">{links}</nav>
    </details>
  </>;
}
