import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { PublicNavigation } from "@/components/public-navigation";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="public-shell">
    <header className="public-header"><div className="container public-header__inner"><Brand /><PublicNavigation /></div></header>
    <main id="main" className="container public-main">{children}</main>
    <footer className="public-footer container"><p>© Studio OS</p><p>Единое пространство печатной студии</p></footer>
  </div>;
}
