import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://wordlore-english-adventures.shimanskya.chatgpt.site"),
  title: "Wordlore — игры для изучения английского",
  description: "Короткие игровые приключения для английской лексики, правописания и грамматики.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Wordlore — играй со словами",
    description: "Три коротких приключения для уверенного английского.",
    images: [{ url: "/og.png", width: 1717, height: 921, alt: "Волшебный мир игр Wordlore" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wordlore — играй со словами",
    description: "Три коротких приключения для уверенного английского.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
