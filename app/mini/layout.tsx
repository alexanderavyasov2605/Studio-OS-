import type { ReactNode } from "react";
import { Brand } from "@/components/brand";

export default function MiniLayout({ children }: { children: ReactNode }) {
  return <div className="mini-shell"><header className="mini-header"><Brand compact /><span className="eyebrow">Mini App</span></header><main id="main">{children}</main></div>;
}
