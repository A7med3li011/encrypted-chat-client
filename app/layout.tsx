import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bond",
  description:
    "Secure end-to-end encrypted chat application with BIP39 recovery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        {/* iOS PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="enc-chat" />
        <link rel="apple-touch-icon" href="/icons/bond_logo.png" />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/icons/bond_logo.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/bond_logo.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href="/icons/bond_logo.png"
        />
        {/* iOS Splash Screens - optional but recommended */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
