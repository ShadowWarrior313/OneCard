import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { WalletProvider } from "@/context/WalletContext";
import { SpendProvider } from "@/context/SpendContext";
import { UserProfileProvider } from "@/context/UserProfileContext";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "OneCard — Your entire wallet. One card.",
  description:
    "One physical card routes every purchase to the credit card that earns the most. Link your wallet once, tap once, earn more.",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "OneCard — Your entire wallet. One card.",
    description:
      "One physical card routes every purchase to the credit card that earns the most.",
    type: "website",
    locale: "en_CA",
    siteName: "OneCard",
  },
  twitter: {
    card: "summary_large_image",
    title: "OneCard — Your entire wallet. One card.",
    description:
      "One physical card routes every purchase to the credit card that earns the most.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-w-0">
        <UserProfileProvider>
          <WalletProvider>
            <SpendProvider>{children}</SpendProvider>
          </WalletProvider>
        </UserProfileProvider>
      </body>
    </html>
  );
}
