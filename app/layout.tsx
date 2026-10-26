import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Scenery from "@/components/Scenery";
import "./globals.css";

// latin-ext covers Albanian letters (ë, ç).
const manrope = Manrope({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Mind",
  description: "A calm, private space to talk.",
};

// Fits notched phones; the 16px+ font sizes also stop iOS from zooming into inputs.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.className} antialiased`}>
        <Scenery />
        {children}
      </body>
    </html>
  );
}
