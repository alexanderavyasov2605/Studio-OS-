import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Studio OS", template: "%s · Studio OS" },
  description: "Техническая основа системы печатной студии.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:p-4">К содержимому</a>
        {children}
      </body>
    </html>
  );
}
