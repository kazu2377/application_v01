# Pair Hints Prototype (Stage 1)

学習者向け「次の一行 / 改善ヒント」プロトタイプ (MCP 対応予定の前段階)。

## ステージ構成

| Stage | 概要                                     | 実装状況 |
| ----- | ---------------------------------------- | -------- |
| 1     | ローカルヒューリスティック (本リポ)      | ✅       |
| 1.5   | Gemini API 試験統合 (LLM ヒント - 任意)  | ✅       |
| 2     | Supabase 永続化 (ユーザ/スニペット/履歴) | ⏳       |
| 3     | MCP / LLM (モデル選択・高度ヒント)       | ⏳       |

## セットアップ

Node.js 18+ を想定。

```bash
pnpm install # あるいは npm install / yarn
pnpm dev     # -> http://localhost:3000
```

（pnpm が無ければ `npm install -g pnpm`）

## 機能 (Stage 1 / 1.5)

- シンプルなコード入力 (textarea オートリサイズ)
- 入力 400ms デバウンス後 `/api/hints` へ POST
- ヒューリスティックによる軽量ヒント生成
  - 空入力: サンプル提案
  - 未閉鎖の `function (...)` / `if (...)`
  - TODO コメント検出
  - 長めの関数で return 不足
  - 連続 `console.log` の注意
  - 行数増加の分割提案
- ヒントが無い場合の「次の試行」促し
- (任意) Gemini LLM モード: `GEMINI_API_KEY` を設定すると UI で Heuristic / LLM / Hybrid 切替

### Gemini 連携 (任意)

環境変数をセットして開発サーバを起動:

```bash
export GEMINI_API_KEY="YOUR_API_KEY"
pnpm dev
```

PowerShell:

```powershell
$Env:GEMINI_API_KEY="YOUR_API_KEY"
pnpm dev
```

`mode=llm` では LLM ヒントのみ、`mode=heuristic` は従来ロジック、`mode=hybrid` は両方表示。

## 今後の予定 (例)

1. Supabase schema: users, snippets, hint_events
2. Auth (GitHub / Email Magic Link)
3. MCP 経由 LLM 連携 (モデル選択 / temperature / 出力トークン制御)
4. ヒント種別分類 (Syntax / Design / Refactor / Test Idea)
5. コード差分ベースの段階的ヒント
6. テストケース生成モード (オプション)

## 技術スタック (現段階)

- Next.js App Router
- React 18
- Tailwind CSS
- TypeScript (緩い設定 / strict=false)
- (任意) Gemini API (@google/generative-ai)

## ディレクトリ概要

```
app/
  api/hints/route.ts   # ヒントAPI (POST)
  lib/hints.ts         # 簡易ヒント生成ロジック
  components/CodeEditor.tsx
  page.tsx             # 画面
  layout.tsx
  globals.css
```

## API 例

```bash
curl -X POST http://localhost:3000/api/hints \
  -H 'Content-Type: application/json' \
  -d '{"code":"function test(a){\n console.log(a)"}'
```

レスポンス:

```json
{
  "hints": [
    {
      "id": "paren-close",
      "severity": "suggestion",
      "message": "引数リストを閉じて関数本体を開始します"
    }
  ]
}
```

## ライセンス

Prototype - TBD

---

質問・次ステップ希望があればお知らせください。
