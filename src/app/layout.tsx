import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Carteira Inteligente",
    template: "%s | Carteira Inteligente",
  },
  description:
    "Seu copiloto financeiro para entender o presente e planejar o futuro.",
  metadataBase: new URL("https://acarteirainteligente.com.br"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-[var(--font-inter)] antialiased">{children}</body>
    </html>
  );
}
