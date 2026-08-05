import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wordlore — игры для изучения английского",
  description: "Короткие игровые приключения для английской лексики, правописания и грамматики.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
