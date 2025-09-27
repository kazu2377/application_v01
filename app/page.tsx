"use client";
import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "./components/CodeEditor";

interface HintItem {
  id: string;
  severity: string;
  message: string;
  detail?: string;
}

type Mode = "heuristic" | "llm" | "hybrid";

export default function Home() {
  const [code, setCode] = useState<string>(
    "// ここに JavaScript/TypeScript のコードを書き始めてください\n"
  );
  const [hints, setHints] = useState<any[]>([]); // heuristic
  const [llmHints, setLlmHints] = useState<string[]>([]); // llm
  const [mode, setMode] = useState<Mode>("heuristic");
  const [loading, setLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmCountdown, setLlmCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const llmTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentLLMHashRef = useRef<string | null>(null);

  const LLM_DELAY_MS = 6000; // 6 秒後に LLM 呼び出し
  const HEURISTIC_DEBOUNCE_MS = 400; // 変更即応性重視

  function simpleHash(str: string): string {
    let h = 0,
      i = 0,
      len = str.length;
    while (i < len) h = (h * 31 + str.charCodeAt(i++)) | 0;
    return h.toString();
  }

  // Heuristic: 400ms デバウンスで即取得
  useEffect(() => {
    setError(null);
    const t = setTimeout(() => {
      setLoading(true);
      fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, mode: "heuristic" }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.heuristic) setHints(data.heuristic);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, HEURISTIC_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [code]);

  // LLM: 6秒アイドル後に実行 (mode が llm / hybrid のとき)
  useEffect(() => {
    // 既存タイマークリア
    if (llmTimerRef.current) clearTimeout(llmTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setLlmCountdown(null);

    if (mode === "heuristic") {
      setLlmHints([]);
      return; // 不要
    }

    // 変更されたコードのハッシュ
    const hash = simpleHash(code);

    // 直前と同一なら再取得しない (微小変更対策は後で差分計算に拡張可)
    if (hash === lastSentLLMHashRef.current) {
      return;
    }

    // カウントダウン開始
    const start = Date.now();
    setLlmCountdown(Math.ceil(LLM_DELAY_MS / 1000));
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remain = Math.max(0, LLM_DELAY_MS - elapsed);
      setLlmCountdown(Math.ceil(remain / 1000));
      if (remain <= 0 && countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }, 1000);

    llmTimerRef.current = setTimeout(() => {
      setLlmLoading(true);
      fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, mode: mode === "llm" ? "llm" : "llm" }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.llm) {
            setLlmHints(data.llm);
            lastSentLLMHashRef.current = hash;
          }
        })
        .catch((e) => setError(e.message))
        .finally(() => {
          setLlmLoading(false);
          setLlmCountdown(null);
        });
    }, LLM_DELAY_MS);

    return () => {
      if (llmTimerRef.current) clearTimeout(llmTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [code, mode]);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-xl font-semibold mb-2">学習ペアヒント (Stage 1 + LLM 試験)</h1>
        <p className="text-sm text-slate-400 mb-4">
          ローカルヒューリスティック + Gemini (オプション) による簡易ヒント。環境変数 GEMINI_API_KEY
          を設定 すると LLM モードが有効になります。
        </p>
        <div className="flex items-center gap-3 mb-3 text-xs">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="heuristic"
              checked={mode === "heuristic"}
              onChange={() => setMode("heuristic")}
            />
            <span>Heuristic</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="llm"
              checked={mode === "llm"}
              onChange={() => setMode("llm")}
            />
            <span>LLM</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="hybrid"
              checked={mode === "hybrid"}
              onChange={() => setMode("hybrid")}
            />
            <span>Hybrid</span>
          </label>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-slate-500">Mode:</span>
            <span className="text-cyan-400 font-mono">{mode}</span>
          </div>
        </div>
        <CodeEditor value={code} onChange={setCode} />
      </section>
      <section>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="font-medium text-sm tracking-wide text-slate-300">Hints ({mode})</h2>
          {(loading || llmLoading) && (
            <span className="text-xs text-cyan-400 animate-pulse flex items-center gap-1">
              {loading && <span>H</span>}
              {llmLoading && <span>LLM</span>}
            </span>
          )}
        </div>
        {error && <div className="text-xs text-red-400 mb-2">{error}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-xs uppercase tracking-wide text-slate-400 mb-1">Heuristic</h3>
            <ul className="space-y-2">
              {hints.map((h: any) => (
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
                <li className="text-xs text-slate-500">ヒューリスティックなし</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wide text-slate-400 mb-1">LLM</h3>
            <ul className="space-y-2">
              {llmHints.map((h: string, i: number) => (
                <li
                  key={i}
                  className="border border-slate-800 rounded-md p-2 text-xs flex flex-col gap-1 bg-slate-900/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="border px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-600/40">
                      LLM
                    </span>
                    <span className="font-medium leading-snug">{h}</span>
                  </div>
                </li>
              ))}
              {!llmLoading && llmCountdown !== null && (
                <li className="text-[11px] text-slate-500">LLM 呼び出し待機中… {llmCountdown}s</li>
              )}
              {!llmLoading && llmCountdown === null && llmHints.length === 0 && (
                <li className="text-xs text-slate-500">LLM ヒントなし</li>
              )}
            </ul>
          </div>
        </div>
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
