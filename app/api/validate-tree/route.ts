import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface TreeNode {
  id: string;
  parentId: string | null;
  type: "cq" | "issue" | "hypothesis";
  content: string;
}

interface ValidationRequest {
  nodes: TreeNode[];
  provider?: "openai" | "gemini";
}

interface ValidationResponse {
  goodPoints: string[];
  improvementPoints: string[];
  validationErrors: Array<{
    nodeId: string;
    type: "error" | "warning" | "good";
    message: string;
  }>;
}

const SYSTEM_PROMPT = `あなたはイシューツリー（論点ツリー）の分析専門家です。
イシューツリーは、大論点（CQ: Central Question）、論点（Issue）、仮説（Hypothesis）の3つの要素から構成されます。

論点とは「解決すべき課題」や「答えるべき問い」を構造化したものです。論点を正しく設定しないと、その後の作業が付加価値につながりません。

================================================================================
【1. イシューツリーの構造化基準】
================================================================================

■ 大論点（セントラル・クエスチョン）
- プロジェクト全体で答えを出すべき最上位の問いであること
- 明確で具体的であること
- 「そもそも何のためにこの作業をしているのか？」に答えられること

■ 論点の分解（中論点・小論点）
- 大論点を具体的な要素へと分解し、具体化していること
- 実務や演習では、最低4層程度まで掘り下げることが推奨される
- 論点は疑問文で書かれているか（末尾に「？」）

■ 縦のつながり（論理的整合性）
- 一階層下の論点が、上の階層の問いに対する答えを導き出せる構成になっていること
- 下位の論点すべてに答えが出れば、上位の論点に答えが出せること

■ 横のつながり（MECE）
- 同じ階層の要素は、互いに重複がないこと（Mutually Exclusive）
- 全体として漏れがないこと（Collectively Exhaustive）
- 切り口が明確であること

================================================================================
【2. 仮説の評価基準】
================================================================================

仮説とは、設定した論点に対する「現時点での仮の答え」です。

■ 良い仮説の3条件
1. 具体的で現場感がある
   - スタンスを明確にし、言い切る形になっている
   - 抽象的・曖昧な表現ではない

2. アクションにつながる
   - 「で、どうするの？」という問いに答えられる
   - 次のステップが見える

3. 検証できる
   - 「どうやって確かめるか」が明確
   - 記事・文献調査、インタビュー、現場観察、データ分析などで検証可能

■ 仮説の形式
- 「〜である」という形式で書かれていること
- 打ち手（「〜する」「〜すべき」）ではなく、現状認識や原因分析の形

■ 仮説をひらめくための視点（参考）
- 反対側から見る：顧客、現場、競合、反対派など異なる立場
- 両極端に振る：高単価×少量 vs 低単価×大量など
- ゼロベースで考える：既存の規制や常識がない状態での理想

================================================================================
【3. 評価の観点】
================================================================================

以下の観点から総合的に評価してください：

1. 構造の妥当性
   - CQは答えるべき問いとして適切か
   - 論点の階層構造は論理的か（縦のつながり）
   - MECEになっているか（横のつながり）

2. 論点の質
   - 疑問文として正しく書かれているか
   - 上位の問いに答えるための分解として適切か
   - 抽象度のレベルが揃っているか

3. 仮説の質
   - 3条件（具体性、アクション志向、検証可能性）を満たしているか
   - 論点に対する仮の答えとして適切か
   - 打ち手ではなく仮説になっているか

4. 全体の完成度
   - 十分な深さまで掘り下げられているか
   - 重要な論点の見落としはないか

================================================================================
【出力形式】
================================================================================

以下のJSON形式で回答してください：
{
  "goodPoints": ["良い点1", "良い点2", ...],
  "improvementPoints": ["改善点1", "改善点2", ...],
  "validationErrors": [
    {"nodeId": "node-id", "type": "error", "message": "重大な問題点"},
    {"nodeId": "node-id", "type": "warning", "message": "改善が望ましい点"},
    {"nodeId": "node-id", "type": "good", "message": "良くできている点"}
  ]
}

※ validationErrorsでは、具体的なノードIDを指定し、そのノードに対する評価を記載してください。
※ goodPointsとimprovementPointsでは、ツリー全体に対する評価を記載してください。`;

async function validateWithOpenAI(nodes: TreeNode[]): Promise<ValidationResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const openai = new OpenAI({ apiKey });

  const treeDescription = nodes.map(node => {
    const indent = getNodeDepth(node.id, nodes) * 2;
    return `${'  '.repeat(indent)}[${node.type}] ${node.id}: ${node.content}`;
  }).join('\n');

  const userPrompt = `以下のイシューツリーを評価してください：

${treeDescription}

ツリー構造の詳細：
${JSON.stringify(nodes, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return JSON.parse(content);
}

async function validateWithGemini(nodes: TreeNode[]): Promise<ValidationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const treeDescription = nodes.map(node => {
    const indent = getNodeDepth(node.id, nodes) * 2;
    return `${'  '.repeat(indent)}[${node.type}] ${node.id}: ${node.content}`;
  }).join('\n');

  const prompt = `${SYSTEM_PROMPT}

以下のイシューツリーを評価してください：

${treeDescription}

ツリー構造の詳細：
${JSON.stringify(nodes, null, 2)}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  return JSON.parse(text);
}

function getNodeDepth(nodeId: string, nodes: TreeNode[]): number {
  const node = nodes.find(n => n.id === nodeId);
  if (!node || !node.parentId) return 0;
  return 1 + getNodeDepth(node.parentId, nodes);
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json();
    const { nodes, provider = "openai" } = body;

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json(
        { error: "Invalid request: nodes array is required" },
        { status: 400 }
      );
    }

    let result: ValidationResponse;

    if (provider === "gemini") {
      result = await validateWithGemini(nodes);
    } else {
      result = await validateWithOpenAI(nodes);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Validation error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "Validation failed",
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}
