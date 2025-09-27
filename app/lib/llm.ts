import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini モデル呼び出し (フォールバック対応)。
 * 優先順位:
 *  1. 明示指定 model 引数 / process.env.GEMINI_MODEL
 *  2. 候補リストを順に試行
 */
export async function generateGeminiHints(code: string, modelOverride?: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return ["GEMINI_API_KEY が未設定: LLM ヒントは利用できません。環境変数を設定してください。"];
  }

  const userModel = modelOverride || process.env.GEMINI_MODEL;
  const candidates = [
    userModel,
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro-latest",
    "gemini-1.0-pro",
  ].filter(Boolean) as string[];

  const tried: { name: string; error: string }[] = [];

  for (const modelName of candidates) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = buildPrompt(code);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const hints = normalizeLines(text).slice(0, 5);
      if (hints.length === 0) return ["(LLM から有効なヒントが取得できませんでした)"];
      // 先頭に実際使用モデル情報を (debug 表示用)
      return hints;
    } catch (e: any) {
      const msg = e?.message || String(e);
      tried.push({ name: modelName, error: msg });
      // 404 の場合は次候補へ続行
      if (!/404/i.test(msg) && !/not found/i.test(msg)) {
        return [`LLM 呼び出しエラー (${modelName}): ${msg}`];
      }
    }
  }

  if (tried.length) {
    return [
      "利用可能な Gemini モデルに接続できませんでした。",
      "試行モデル: " + tried.map((t) => t.name).join(", "),
      "最後のエラー: " + tried[tried.length - 1].error,
      "GEMINI_MODEL を明示指定、または API キーの権限/有効モデルを確認してください。",
    ];
  }
  return ["Gemini モデル候補が空です。"];
}

function buildPrompt(code: string): string {
  return `You are a concise coding tutor. Provide at most 3 short hint-style suggestions (Japanese) about the following user code. Avoid giving full solutions; only nudge. Output each hint as a single line without numbering.\n\nCODE START\n${code}\nCODE END`;
}

function normalizeLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);
}
