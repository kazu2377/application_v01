import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Thin wrapper for Gemini model usage.
 * The API key MUST be set in process.env.GEMINI_API_KEY (never send to client).
 */
export async function generateGeminiHints(code: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return [
      "GEMINI_API_KEY が未設定のため LLM ベースのヒントは利用できません。環境変数を設定してください。",
    ];
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a concise coding tutor. Provide at most 3 short hint-style suggestions (Japanese) about the following user code. Avoid giving full solutions; only nudge. Output each hint as a single line without numbering.

CODE START\n${code}\nCODE END`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Split lines, filter empties
    const hints = text
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/^[-*]\s*/, ""))
      .filter(Boolean)
      .slice(0, 5);
    return hints.length ? hints : ["(LLM から有効なヒントが取得できませんでした)"];
  } catch (e: any) {
    return [`LLM 呼び出しエラー: ${e?.message ?? e}`];
  }
}
