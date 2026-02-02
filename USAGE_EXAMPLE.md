# イシューツリーAI判定機能 - 使用例

## セットアップ

### 1. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下のいずれかを設定してください：

**OpenAIを使用する場合:**
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
```

**Google Geminiを使用する場合:**
```bash
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-1.5-flash
```

### 2. 開発サーバーの起動

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## 使用方法

### 基本的な使い方

1. **イシューツリーを作成**
   - CQ（中心となる問い）を編集
   - 「+論点」ボタンで論点を追加
   - 「+仮説」ボタンで仮説を追加

2. **AI判定を実行**
   - UIの右上にある「OpenAI」または「Gemini」をドロップダウンから選択
   - 「AI判定」ボタンをクリック
   - AIが自動的にイシューツリーを評価し、フィードバックを表示

### AI判定の評価基準

AIは以下の観点でイシューツリーを評価します：

#### 1. CQ（中心となる問い）の評価
- 明確で具体的な問いになっているか
- ビジネス課題として適切か

#### 2. 論点の評価
- 疑問文で書かれているか（末尾に「？」）
- MECE（漏れなく、重複なく）に分解されているか
- 親ノードとの論理的整合性

#### 3. 仮説の評価
- 「〜である」形式で記述されているか
- 打ち手（〜する）になっていないか
- 具体的で検証可能か

## 実行例

### 例1: 良い構造のイシューツリー

```
CQ: どうすれば売上を2倍にできるか？
├─ 論点: 新規顧客を増やすべきか？
│  └─ 仮説: デジタルマーケティングを強化すれば新規顧客を30%増やせる
└─ 論点: 既存顧客の単価を上げるべきか？
   └─ 仮説: アップセル施策により顧客単価を20%向上できる
```

**AI判定結果の例:**

✅ **Good Points**
- CQ（中心となる問い）が明確に設定されています
- 2つの論点が適切な疑問文形式で書かれています
- 2つの仮説が適切な形式で記述されています
- 論点がMECEの観点で売上向上の方法を網羅的に分解しています

⚠️ **改善ポイント**
- 各論点をさらに詳細化することで、より具体的なアクションにつなげられます
- 仮説に数値根拠の出所を追加すると説得力が増します

### 例2: 改善が必要なイシューツリー

```
CQ: 売上を増やしたい
├─ 論点: 顧客を増やす
│  └─ 仮説: マーケティングを強化する
└─ 論点: 既存顧客の売上を増やす
   └─ 仮説: 新商品を開発する
```

**AI判定結果の例:**

⚠️ **改善ポイント**
- CQが曖昧です。「どれくらい」「いつまでに」を明確にしましょう
- 2件の形式エラーがあります：論点が疑問文になっていません
- 2件の警告があります：仮説が打ち手（アクション）になっています
- 論点をより具体的な疑問文で記述してください
- 仮説を「〜である」形式に変更してください

## API レスポンス例

### リクエスト

```json
POST /api/validate-tree
Content-Type: application/json

{
  "nodes": [
    {
      "id": "cq-1",
      "parentId": null,
      "type": "cq",
      "content": "どうすれば売上を2倍にできるか？"
    },
    {
      "id": "issue-1",
      "parentId": "cq-1",
      "type": "issue",
      "content": "新規顧客を増やすべきか？"
    },
    {
      "id": "hyp-1",
      "parentId": "issue-1",
      "type": "hypothesis",
      "content": "デジタルマーケティングを強化すれば新規顧客を30%増やせる"
    }
  ],
  "provider": "openai"
}
```

### レスポンス

```json
{
  "goodPoints": [
    "CQ（中心となる問い）が明確に設定されています",
    "論点が適切な疑問文形式で書かれています",
    "仮説が適切な形式で記述されています"
  ],
  "improvementPoints": [
    "MECEの観点で漏れ・重複がないか確認してください",
    "仮説に具体的な根拠や数値の出所を追加すると説得力が増します"
  ],
  "validationErrors": [
    {
      "nodeId": "cq-1",
      "type": "good",
      "message": "OK"
    },
    {
      "nodeId": "issue-1",
      "type": "good",
      "message": "OK"
    },
    {
      "nodeId": "hyp-1",
      "type": "good",
      "message": "OK"
    }
  ]
}
```

## トラブルシューティング

### エラー: "OPENAI_API_KEY is not configured"

**原因:** 環境変数が設定されていない

**解決方法:**
1. プロジェクトルートに `.env.local` ファイルを作成
2. APIキーを設定
3. 開発サーバーを再起動

### エラー: "AI判定エラー: Failed to fetch"

**原因:** APIキーが無効、またはネットワークエラー

**解決方法:**
1. APIキーが正しいか確認
2. OpenAI/Gemini のダッシュボードでAPIキーの有効性を確認
3. API利用制限やクォータを確認

### ブラウザコンソールに警告が表示される

**原因:** 環境変数がクライアントサイドで参照されている

**解決方法:** 
- 環境変数は必ずサーバーサイド（API Route）でのみ使用しています
- この警告は無視しても問題ありません

## API コスト目安

### OpenAI (gpt-4o-mini)
- 1回のAI判定: 約 500-1,000 トークン
- コスト: $0.0001-0.0003 程度

### Google Gemini (gemini-1.5-flash)
- 1回のAI判定: 約 500-1,000 トークン  
- コスト: 無料枠内で十分利用可能

## セキュリティ注意事項

⚠️ **重要:**
- APIキーを`.env.local`に保存し、絶対にGitにコミットしないでください
- `.env.local`は`.gitignore`に含まれています
- 本番環境では環境変数をVercelの設定画面から登録してください
- APIキーは定期的に更新することを推奨します

## 参考リンク

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
