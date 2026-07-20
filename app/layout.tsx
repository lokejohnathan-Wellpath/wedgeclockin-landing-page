import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PwaRegister from "./pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WedgeCLOCKin",
    template: "%s | WedgeCLOCKin",
  },
  applicationName: "WedgeCLOCKin",
  description: "Secure face and GPS attendance for Malaysian businesses.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WedgeClock",
  },
  icons: {
    icon: [
      { url: "/icons/wedgeclockin-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/wedgeclockin-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/wedgeclockin-apple-touch.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#101416",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
