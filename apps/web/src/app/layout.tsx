import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WalletProvider } from "@/context/WalletContext";
import { UserProfileProvider } from "@/context/UserProfileContext";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = getSiteUrl();

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
      <body>
        <UserProfileProvider>
          <WalletProvider>{children}</WalletProvider>
        </UserProfileProvider>
      </body>
    </html>
  );
}
