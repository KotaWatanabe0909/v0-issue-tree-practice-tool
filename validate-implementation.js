#!/usr/bin/env node
/**
 * AI Validation Feature - Structure Validation Script
 * 
 * このスクリプトは、AI判定機能の実装が正しく構造化されているかを検証します。
 * 実際のAPI呼び出しはせず、コードの整合性のみをチェックします。
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'app/api/validate-tree/route.ts',
  '.env.example',
  'USAGE_EXAMPLE.md',
];

const requiredEnvVars = [
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
];

console.log('🔍 AI判定機能の構造検証を開始します...\n');

let allChecksPassed = true;

// Check 1: Required files exist
console.log('📁 必須ファイルの存在確認:');
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allChecksPassed = false;
});

console.log('');

// Check 2: .env.example contains required variables
console.log('⚙️  環境変数の確認:');
const envExamplePath = path.join(process.cwd(), '.env.example');
if (fs.existsSync(envExamplePath)) {
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  requiredEnvVars.forEach(varName => {
    const exists = envContent.includes(varName);
    console.log(`  ${exists ? '✅' : '❌'} ${varName} が .env.example に定義されています`);
    if (!exists) allChecksPassed = false;
  });
} else {
  console.log('  ❌ .env.example ファイルが見つかりません');
  allChecksPassed = false;
}

console.log('');

// Check 3: API route structure
console.log('🔌 APIルートの構造確認:');
const apiRoutePath = path.join(process.cwd(), 'app/api/validate-tree/route.ts');
if (fs.existsSync(apiRoutePath)) {
  const apiContent = fs.readFileSync(apiRoutePath, 'utf8');
  
  const checks = [
    { name: 'POST関数のエクスポート', pattern: /export async function POST/ },
    { name: 'OpenAI統合', pattern: /validateWithOpenAI/ },
    { name: 'Gemini統合', pattern: /validateWithGemini/ },
    { name: 'エラーハンドリング', pattern: /try\s*{[\s\S]*catch/ },
    { name: 'プロバイダー切り替え', pattern: /provider.*openai.*gemini/ },
  ];
  
  checks.forEach(check => {
    const exists = check.pattern.test(apiContent);
    console.log(`  ${exists ? '✅' : '❌'} ${check.name}`);
    if (!exists) allChecksPassed = false;
  });
} else {
  console.log('  ❌ API route ファイルが見つかりません');
  allChecksPassed = false;
}

console.log('');

// Check 4: Frontend integration
console.log('🖥️  フロントエンド統合の確認:');
const issueTreePath = path.join(process.cwd(), 'components/issue-tree/issue-tree.tsx');
if (fs.existsSync(issueTreePath)) {
  const frontendContent = fs.readFileSync(issueTreePath, 'utf8');
  
  const checks = [
    { name: 'AI判定ハンドラー', pattern: /handleAIValidate/ },
    { name: 'ローディング状態管理', pattern: /isAIValidating/ },
    { name: 'プロバイダー選択', pattern: /aiProvider/ },
    { name: 'API呼び出し', pattern: /\/api\/validate-tree/ },
    { name: 'エラー処理', pattern: /catch.*error/ },
  ];
  
  checks.forEach(check => {
    const exists = check.pattern.test(frontendContent);
    console.log(`  ${exists ? '✅' : '❌'} ${check.name}`);
    if (!exists) allChecksPassed = false;
  });
} else {
  console.log('  ❌ issue-tree.tsx ファイルが見つかりません');
  allChecksPassed = false;
}

console.log('');

// Check 5: Dependencies
console.log('📦 依存関係の確認:');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = ['openai', '@google/generative-ai'];
  requiredDeps.forEach(dep => {
    const exists = dependencies[dep];
    console.log(`  ${exists ? '✅' : '❌'} ${dep} ${exists ? `(${dependencies[dep]})` : ''}`);
    if (!exists) allChecksPassed = false;
  });
} else {
  console.log('  ❌ package.json ファイルが見つかりません');
  allChecksPassed = false;
}

console.log('');

// Final result
console.log('='.repeat(50));
if (allChecksPassed) {
  console.log('✅ すべてのチェックが合格しました！');
  console.log('');
  console.log('次のステップ:');
  console.log('1. .env.local ファイルを作成し、APIキーを設定');
  console.log('2. npm run dev で開発サーバーを起動');
  console.log('3. ブラウザで http://localhost:3000 を開く');
  console.log('4. AI判定機能を試す');
  console.log('');
  console.log('詳細な使用方法は USAGE_EXAMPLE.md を参照してください。');
  process.exit(0);
} else {
  console.log('❌ いくつかのチェックが失敗しました。');
  console.log('上記のエラーを確認して修正してください。');
  process.exit(1);
}
