import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Pair Hints Prototype",
  description: "MCPベース学習ヒント試作 (段階1)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-slate-800 px-4 py-2 text-sm flex items-center gap-2">
          <span className="font-semibold">Pair Hints Prototype</span>
          <span className="text-slate-500">Stage 1 (Local heuristics)</span>
        </header>
        <main className="flex-1 p-4 max-w-5xl mx-auto w-full">{children}</main>
        <footer className="text-[11px] text-center text-slate-500 py-3 border-t border-slate-800">
          © {new Date().getFullYear()} Prototype
        </footer>
      </body>
    </html>
  );
}
