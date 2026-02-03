import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HIVE-R Dashboard",
  description: "Manage your multi-agent system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100`}
      >
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-8">
              <span className="text-2xl">🐝</span>
              <h1 className="text-xl font-bold">HIVE-R</h1>
            </div>
            <nav className="space-y-2">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <span>📊</span> Dashboard
              </Link>
              <Link
                href="/chat"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <span>💬</span> Chat
              </Link>
              <Link
                href="/threads"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <span>📜</span> Threads
              </Link>
              <Link
                href="/agents"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <span>🤖</span> Agents
              </Link>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
