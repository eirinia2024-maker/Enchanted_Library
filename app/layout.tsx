import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enchanted Library — English Learning Games",
  description: "Magical mini-games for learning English vocabulary, spelling, and grammar.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
