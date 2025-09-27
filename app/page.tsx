"use client";
import { useEffect, useState } from "react";
import { CodeEditor } from "./components/CodeEditor";

interface HintItem {
  id: string;
  severity: string;
  message: string;
  detail?: string;
}

export default function Home() {
  const [code, setCode] = useState<string>(
    "// ここに JavaScript/TypeScript のコードを書き始めてください\n"
  );
  const [hints, setHints] = useState<HintItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced fetch
  useEffect(() => {
    setError(null);
    const t = setTimeout(() => {
      setLoading(true);
      fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.hints) setHints(data.hints);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 400); // 400ms debounce
    return () => clearTimeout(t);
  }, [code]);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-xl font-semibold mb-2">学習ペアヒント (Stage 1)</h1>
        <p className="text-sm text-slate-400 mb-4">
          ローカルヒューリスティックで「次の一手」的なシンプルなヒントを返します。後続段階で MCP /
          Supabase / LLM 連携を追加予定。
        </p>
        <CodeEditor value={code} onChange={setCode} />
      </section>
      <section>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="font-medium text-sm tracking-wide text-slate-300">Hints</h2>
          {loading && <span className="text-xs text-cyan-400 animate-pulse">更新中...</span>}
        </div>
        {error && <div className="text-xs text-red-400 mb-2">{error}</div>}
        <ul className="space-y-2">
          {hints.map((h) => (
            <li
              key={h.id}
              className="border border-slate-800 rounded-md p-2 text-xs flex flex-col gap-1 bg-slate-900/50"
            >
              <div className="flex items-center gap-2">
                <SeverityBadge level={h.severity} />
                <span className="font-medium">{h.message}</span>
              </div>
              {h.detail && (
                <p className="text-[11px] text-slate-400 leading-snug whitespace-pre-line">
                  {h.detail}
                </p>
              )}
            </li>
          ))}
          {!loading && hints.length === 0 && (
            <li className="text-xs text-slate-500">まだヒントはありません</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function SeverityBadge({ level }: { level: string }) {
  const color =
    level === "warning"
      ? "bg-amber-500/20 text-amber-300 border-amber-600/40"
      : level === "suggestion"
      ? "bg-cyan-500/20 text-cyan-300 border-cyan-600/40"
      : "bg-slate-500/20 text-slate-300 border-slate-600/40";
  return (
    <span
      className={`border px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${color}`}
    >
      {level}
    </span>
  );
}
