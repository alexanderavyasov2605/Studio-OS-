"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { Brand } from "@/components/brand";
import { Badge, Icon } from "@/components/ui";

function AdminLinks() {
  return <>
    <p className="nav-section-label">Рабочее пространство</p>
    <Link className="sidebar-link sidebar-link--active" href="/admin" aria-current="page"><Icon name="grid" />Обзор</Link>
    <p className="sidebar-note">Управление заказами и тарифами появится на следующих этапах.</p>
    <p className="nav-section-label">Приложения</p>
    <Link className="sidebar-link" href="/"><Icon name="home" />Публичный сайт</Link>
    <Link className="sidebar-link" href="/mini"><Icon name="layers" />Mini App</Link>
  </>;
}
export function AdminShell({ children }: { children: ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null);
  return <div className="admin-shell">
    <aside className="admin-sidebar"><Brand compact /><nav aria-label="Административная навигация"><AdminLinks /></nav><div className="sidebar-footer"><span className="status-dot" />Среда разработки интерфейса</div></aside>
    <div className="admin-workspace">
      <header className="admin-header"><div className="admin-header__title"><span className="text-muted">Рабочее пространство</span><Icon name="chevron" size={14} /><strong>Обзор</strong></div><Badge tone="brand">Превью</Badge>
        <details ref={menu} className="mobile-menu admin-mobile-menu" onKeyDown={(event) => { if (event.key === "Escape") { menu.current?.removeAttribute("open"); menu.current?.querySelector("summary")?.focus(); } }}>
          <summary><Icon name="menu" /><span>Разделы</span></summary>
          <nav aria-label="Мобильная навигация админки"><AdminLinks /></nav>
        </details>
      </header>
      <main id="main" className="admin-main">{children}</main>
    </div>
  </div>;
}
