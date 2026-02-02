# Issue tree practice tool

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/kotawatanabe0909s-projects/v0-issue-tree-practice-tool)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/fFkXcJxOsAT)

## Overview

Issue Tree Practice Tool（イシューツリー練習ツール）は、論理的思考を鍛えるためのイシューツリー作成ツールです。
AI判定機能により、OpenAIやGemini APIを使用してイシューツリーの構造や論理性を自動評価できます。

## Features

- **インタラクティブなイシューツリー作成**: CQ（中心となる問い）、論点、仮説をビジュアルに構築
- **ルールベース判定**: 基本的な形式チェック（疑問文の末尾、仮説の形式など）
- **AI自動判定**: OpenAIまたはGemini APIを使用した高度な論理性評価
  - MECE（漏れなく、重複なく）の確認
  - 論理構造の適切性チェック
  - 改善提案の自動生成
- **プロバイダー切り替え**: OpenAIとGeminiを簡単に切り替え可能
- **PNG保存**: 作成したイシューツリーを画像として保存

## Setup

### Prerequisites

- Node.js 18.x or later
- pnpm (推奨) または npm
- OpenAI API Key または Google Gemini API Key

### Installation

1. リポジトリをクローン:
```bash
git clone https://github.com/athenatech-jp/issue-tree-practice-tool.git
cd issue-tree-practice-tool
```

2. 依存関係をインストール:
```bash
pnpm install
# または
npm install
```

3. 環境変数を設定:
```bash
cp .env.example .env.local
```

4. `.env.local`を編集し、APIキーを設定:

**OpenAIを使用する場合:**
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

APIキーは [OpenAI Platform](https://platform.openai.com/api-keys) で取得できます。

**Geminiを使用する場合:**
```env
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-flash
```

APIキーは [Google AI Studio](https://aistudio.google.com/app/apikey) で取得できます。

### Running Locally

開発サーバーを起動:
```bash
pnpm dev
# または
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## Usage

### 基本的な使い方

1. **CQ（中心となる問い）を設定**: ツリーのルートノードを編集
2. **論点を追加**: CQの下に論点（Issue）を追加し、疑問文で記述
3. **仮説を追加**: 各論点の下に仮説（Hypothesis）を追加
4. **判定**: 
   - **ルール判定**: 基本的な形式チェックを実行
   - **AI判定**: AIによる高度な評価を実行（APIキー設定が必要）

### AI判定機能

AI判定は以下の観点でイシューツリーを評価します：

- **CQの明確性**: 中心となる問いが具体的で明確か
- **論点の形式**: 論点が適切な疑問文で記述されているか
- **仮説の形式**: 仮説が「〜である」形式で記述されているか（打ち手ではない）
- **MECE性**: 論点が漏れなく、重複なく分解されているか
- **論理構造**: 親子関係が論理的に適切か
- **具体性**: 各ノードの内容が具体的で明確か

### API プロバイダーの切り替え

UI上のドロップダウンメニューから「OpenAI」または「Gemini」を選択してAI判定を実行できます。

## API Configuration

### OpenAI

推奨モデル:
- `gpt-4o-mini` (デフォルト): コストパフォーマンスに優れた高速モデル
- `gpt-4o`: より高精度な分析が必要な場合
- `gpt-4-turbo`: 長文の詳細分析向け

### Google Gemini

推奨モデル:
- `gemini-1.5-flash` (デフォルト): 高速で効率的
- `gemini-1.5-pro`: より高度な推論が必要な場合

## セキュリティ

- APIキーは必ず環境変数（`.env.local`）で管理し、`.gitignore`に含めてください
- 本番環境では Vercel の Environment Variables を使用してAPIキーを設定してください
- APIキーをコードに直接記述したり、公開リポジトリにコミットしないでください

## Deployment

### Vercel へのデプロイ

1. [Vercel](https://vercel.com) でプロジェクトをインポート
2. Environment Variables に以下を設定:
   - `OPENAI_API_KEY` (OpenAIを使用する場合)
   - `GEMINI_API_KEY` (Geminiを使用する場合)
   - `OPENAI_MODEL` (オプション)
   - `GEMINI_MODEL` (オプション)
3. デプロイを実行

## Troubleshooting

### AI判定が失敗する

- `.env.local`ファイルが存在し、正しいAPIキーが設定されているか確認
- 開発サーバーを再起動（環境変数の変更後は必須）
- APIキーの有効性を確認（OpenAI/Google AI Studioのダッシュボードで確認）
- API利用制限やクォータを確認

### TypeScript エラー

```bash
pnpm build
# または
npm run build
```

でビルドエラーを確認できます。

## Development

### Build

```bash
pnpm build
# または
npm run build
```

### Lint

```bash
pnpm lint
# または
npm run lint
```

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS
- **AI Integration**: OpenAI API, Google Generative AI
- **Deployment**: Vercel

## License

This project is provided as-is for educational and practice purposes.

## Contributing

プルリクエストや Issue の報告を歓迎します！