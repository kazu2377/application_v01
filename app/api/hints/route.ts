import { generateHints } from "@/app/lib/hints";
import { generateGeminiHints } from "@/app/lib/llm";
import { NextRequest } from "next/server";

export const runtime = "edge"; // lightweight

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code: string = body.code ?? "";
    const mode: string = body.mode ?? "heuristic"; // "heuristic" | "llm" | "hybrid"

    let heuristic = [] as ReturnType<typeof generateHints>;
    let llm: string[] = [];

    if (mode === "heuristic" || mode === "hybrid") {
      heuristic = generateHints(code);
    }
    if (mode === "llm" || mode === "hybrid") {
      llm = await generateGeminiHints(code);
    }

    const response = {
      mode,
      heuristic,
      llm,
      hints: mode === "heuristic" ? heuristic : mode === "llm" ? llm : [...heuristic, ...llm],
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "Hint generation failed", detail: e?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
