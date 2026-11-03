import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-slate-950 p-6 text-white">
        <p className="text-xl font-semibold">Studio OS</p>
        <p className="mt-2 text-sm text-slate-400">Административная зона</p>
        <nav aria-label="Административная навигация" className="mt-8 flex flex-col gap-4 text-sm">
          <Link href="/admin" aria-current="page">Обзор</Link>
          <Link href="/">Публичный сайт</Link>
        </nav>
      </aside>
      <main id="main" className="p-5 sm:p-12">{children}</main>
    </div>
  );
}
