import { generateHints } from "@/app/lib/hints";
import { NextRequest } from "next/server";

export const runtime = "edge"; // lightweight

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code: string = body.code ?? "";
    const hints = generateHints(code);
    return new Response(JSON.stringify({ hints }), {
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
