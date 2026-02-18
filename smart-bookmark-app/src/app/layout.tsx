import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Bookmark App",
  description: "Google OAuth Smart Bookmark App with Supabase Realtime",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}