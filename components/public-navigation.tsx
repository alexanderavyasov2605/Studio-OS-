"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicNavigation } from "@/lib/navigation";

export function PublicNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Основная навигация" className="flex flex-wrap gap-2">
      {publicNavigation.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 aria-[current=page]:bg-slate-900 aria-[current=page]:text-white"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
