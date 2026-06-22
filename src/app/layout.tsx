import type { Metadata } from "next";
import { brand } from "@/config/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: brand.name,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  metadataBase: new URL(`https://${brand.domain}`),
  icons: {
    icon: brand.assets.favicon,
    shortcut: brand.assets.favicon,
    apple: brand.assets.favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-[var(--font-manrope)] antialiased">{children}</body>
    </html>
  );
}
