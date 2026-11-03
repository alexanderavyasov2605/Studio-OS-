import Link from "next/link";
import type { ReactNode } from "react";
import { PublicNavigation } from "@/components/public-navigation";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <header className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-200 py-6">
        <Link href="/" className="text-xl font-bold tracking-tight">Studio OS</Link>
        <PublicNavigation />
      </header>
      <main id="main" className="py-12">{children}</main>
      <footer className="border-t border-slate-200 py-6 text-sm text-slate-500">
        Studio OS · Основа проекта
      </footer>
    </div>
  );
}
