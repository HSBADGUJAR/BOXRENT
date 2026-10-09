import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Container Rental",
  description: "Container rental marketplace",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8faf9] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}