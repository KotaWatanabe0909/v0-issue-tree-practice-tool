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

const SYSTEM_PROMPT = `あなたはイシューツリーの分析専門家です。
イシューツリーは、中心となる問い(CQ)、論点(Issue)、仮説(Hypothesis)の3つの要素から構成されます。

【評価基準】
1. CQ（中心となる問い）は明確で具体的か
2. 論点は疑問文で書かれているか（末尾に「？」）
3. 仮説は「〜である」という形式で書かれているか（打ち手「〜する」ではない）
4. 論点がMECE（漏れなく、重複なく）に分解されているか
5. 論点と仮説の親子関係が論理的に適切か
6. 各ノードの内容が具体的で明確か

【出力形式】
以下のJSON形式で回答してください：
{
  "goodPoints": ["良い点1", "良い点2"],
  "improvementPoints": ["改善点1", "改善点2"],
  "validationErrors": [
    {"nodeId": "node-id", "type": "error|warning|good", "message": "メッセージ"}
  ]
}`;

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
