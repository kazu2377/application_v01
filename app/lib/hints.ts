export interface HintItem {
  id: string;
  severity: "info" | "suggestion" | "warning";
  message: string;
  detail?: string;
}

// Very naive heuristic hint generator (Stage 1)
export function generateHints(code: string): HintItem[] {
  const hints: HintItem[] = [];
  const trimmed = code.trim();

  if (!trimmed) {
    hints.push({
      id: "start-1",
      severity: "info",
      message: "まず短いゴールを書いてみましょう",
      detail: "例: function sum(a, b) { return a + b }",
    });
    return hints;
  }

  const lines = code.split(/\r?\n/);
  const lastLine = lines[lines.length - 1];

  if (/function\s+[a-zA-Z0-9_]+\s*\([^)]*$/.test(lastLine)) {
    hints.push({
      id: "paren-close",
      severity: "suggestion",
      message: "引数リストを閉じて関数本体を開始します",
      detail: " ) { /* 処理 */ } の形を完成させましょう",
    });
  }

  if (/TODO/i.test(code) && !/TODO resolved/i.test(code)) {
    hints.push({
      id: "todo-1",
      severity: "warning",
      message: "未解決の TODO コメントがあります",
      detail: "優先度の高いものから具体化しましょう",
    });
  }

  // Simple check for long function without returns
  const functionBlocks = code.match(/function\s+[^({]+\([^)]*\)\s*{[\s\S]*?}/g) || [];
  for (const fb of functionBlocks) {
    if (!/return\s+/.test(fb) && fb.length > 80) {
      hints.push({
        id: "fn-no-return-" + hints.length,
        severity: "suggestion",
        message: "長めの関数に return がありません",
        detail: "早期 return で読みやすく分割できるか検討してください",
      });
    }
  }

  if (lines.length > 40) {
    hints.push({
      id: "length-readability",
      severity: "info",
      message: "行数が増えてきました",
      detail: "小さな関数やモジュールへ分割すると理解しやすくなります",
    });
  }

  // Incomplete if block
  if (/if\s*\([^)]*$/.test(lastLine)) {
    hints.push({
      id: "if-close",
      severity: "suggestion",
      message: "if 条件式を閉じてブロックを作りましょう",
      detail: " ) { ... } を追加",
    });
  }

  // Trailing console.log streak
  const recent = lines.slice(-3).filter((l) => /console\.log/.test(l)).length;
  if (recent >= 3) {
    hints.push({
      id: "many-logs",
      severity: "suggestion",
      message: "console.log が連続しています",
      detail: "デバッグが終わったら不要なログは削除すると見通しが良くなります",
    });
  }

  if (hints.length === 0) {
    hints.push({
      id: "no-hints",
      severity: "info",
      message: "現時点では特筆すべき改善ヒントは見つかりません",
      detail: "次の目的やテストケースを書いてみましょう",
    });
  }

  return hints;
}
