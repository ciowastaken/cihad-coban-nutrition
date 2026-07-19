import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";

import "./globals.css";
import "./motion.css";

export const metadata: Metadata = {
  title: {
    default: "Cihad Çoban Nutrition",
    template: "%s | Cihad Çoban Nutrition",
  },
  description:
    "Kişiselleştirilmiş beslenme hedefleri, günlük öğün takibi ve akıllı yiyecek arama platformu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="bg-[#f7faf7] text-zinc-950 antialiased">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1 page-enter">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
