"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { Brand } from "@/components/brand";
import { Badge, Icon } from "@/components/ui";
import { AdminLogout } from "@/components/admin-logout";

function AdminLinks() {
  const path = usePathname();
  return <>
    <p className="nav-section-label">Рабочее пространство</p>
    <Link className={`sidebar-link ${path === "/admin" ? "sidebar-link--active" : ""}`} href="/admin" aria-current={path === "/admin" ? "page" : undefined}><Icon name="grid" />Обзор</Link>
    <Link className={`sidebar-link ${path.startsWith("/admin/catalog") ? "sidebar-link--active" : ""}`} href="/admin/catalog" aria-current={path.startsWith("/admin/catalog") ? "page" : undefined}><Icon name="layers" />Каталог</Link>
    <p className="sidebar-note">Управление заказами и тарифами появится на следующих этапах.</p>
    <p className="nav-section-label">Приложения</p>
    <Link className="sidebar-link" href="/"><Icon name="home" />Публичный сайт</Link>
    <Link className="sidebar-link" href="/mini"><Icon name="layers" />Mini App</Link>
  </>;
}
export function AdminShell({ children, staff }: { children: ReactNode; staff: { email: string | null; role: "ADMIN" | "OPERATOR" } }) {
  const path = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  return <div className="admin-shell">
    <aside className="admin-sidebar"><Brand compact /><nav aria-label="Административная навигация"><AdminLinks /></nav><div className="sidebar-footer"><span className="status-dot" />Среда разработки интерфейса</div></aside>
    <div className="admin-workspace">
      <header className="admin-header"><div className="admin-header__title"><span className="text-muted">Рабочее пространство</span><Icon name="chevron" size={14} /><strong>{path.startsWith("/admin/catalog") ? "Каталог" : "Обзор"}</strong></div><Badge tone="brand">{staff.role === "ADMIN" ? "Администратор" : "Оператор"}</Badge><AdminLogout />
        <details ref={menu} className="mobile-menu admin-mobile-menu" onKeyDown={(event) => { if (event.key === "Escape") { menu.current?.removeAttribute("open"); menu.current?.querySelector("summary")?.focus(); } }}>
          <summary><Icon name="menu" /><span>Разделы</span></summary>
          <nav aria-label="Мобильная навигация админки"><AdminLinks /></nav>
        </details>
      </header>
      <main id="main" className="admin-main">{children}</main>
    </div>
  </div>;
}
