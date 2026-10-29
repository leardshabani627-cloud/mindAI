import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Scenery from "@/components/Scenery";
import Watchers from "@/components/Watchers";
import { LanguageProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang.server";
import "./globals.css";

// latin-ext covers Albanian letters (ë, ç).
const manrope = Manrope({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Mind",
  description: "A calm, private space to talk. Një hapësirë e qetë dhe private për të folur.",
};

// Fits notched phones; the 16px+ font sizes also stop iOS from zooming into inputs.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Pages render straight away in the chosen language (English or shqip), with no flash of the other one.
  const lang = await getLang();

  return (
    <html lang={lang}>
      <body className={`${manrope.className} antialiased`}>
        <Scenery />
        <LanguageProvider initial={lang}>
          {children}
          <Watchers />
        </LanguageProvider>
      </body>
    </html>
  );
}
