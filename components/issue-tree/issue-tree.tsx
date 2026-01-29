"use client";

import { useState, useCallback, useRef } from "react";
import { CheckCircle2, AlertTriangle, ThumbsUp, RotateCcw, Download } from "lucide-react";
import type { TreeNode, ValidationError, FeedbackResult } from "@/lib/issue-tree-types";
import { getChildType } from "@/lib/issue-tree-types";
import { TreeCanvas } from "./tree-canvas";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toPng } from "html-to-image";

const initialNodes: TreeNode[] = [
  {
    id: "cq-1",
    parentId: null,
    type: "cq",
    content: "どうすれば売上を2倍にできるか？",
  },
  {
    id: "issue-1",
    parentId: "cq-1",
    type: "issue",
    content: "新規顧客を増やすべきか？",
  },
  {
    id: "issue-2",
    parentId: "cq-1",
    type: "issue",
    content: "既存顧客の単価を上げるべきか？",
  },
  {
    id: "hyp-1",
    parentId: "issue-1",
    type: "hypothesis",
    content: "デジタルマーケティングを強化すれば新規顧客を30%増やせる",
  },
  {
    id: "hyp-2",
    parentId: "issue-2",
    type: "hypothesis",
    content: "アップセル施策により顧客単価を20%向上できる",
  },
];

export function IssueTree() {
  const [nodes, setNodes] = useState<TreeNode[]>(initialNodes);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [feedback, setFeedback] = useState<FeedbackResult>({ goodPoints: [], improvementPoints: [] });
  const [isValidated, setIsValidated] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleUpdateNode = useCallback((id: string, content: string) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === id ? { ...node, content } : node))
    );
    setIsValidated(false);
    setValidationErrors([]);
    setFeedback({ goodPoints: [], improvementPoints: [] });
  }, []);

  const handleAddChild = useCallback((parentId: string, addIssue: boolean = false) => {
    const parentNode = nodes.find((n) => n.id === parentId);
    if (!parentNode) return;

    const newNode: TreeNode = {
      id: generateId(),
      parentId,
      type: getChildType(parentNode.type, addIssue),
      content: "",
    };

    setNodes((prev) => [...prev, newNode]);
    setIsValidated(false);
    setValidationErrors([]);
    setFeedback({ goodPoints: [], improvementPoints: [] });
  }, [nodes]);

  const handleDeleteNode = useCallback((id: string) => {
    const getDescendants = (nodeId: string): string[] => {
      const children = nodes.filter((n) => n.parentId === nodeId);
      return [nodeId, ...children.flatMap((c) => getDescendants(c.id))];
    };

    const toDelete = new Set(getDescendants(id));
    setNodes((prev) => prev.filter((node) => !toDelete.has(node.id)));
    setIsValidated(false);
    setValidationErrors([]);
    setFeedback({ goodPoints: [], improvementPoints: [] });
  }, [nodes]);

  const handleValidate = useCallback(() => {
    const errors: ValidationError[] = [];
    const goodPoints: string[] = [];
    const improvementPoints: string[] = [];

    const issueNodes = nodes.filter((n) => n.type === "issue");
    const hypothesisNodes = nodes.filter((n) => n.type === "hypothesis");
    const cqNode = nodes.find((n) => n.type === "cq");

    // Check each node
    nodes.forEach((node) => {
      // Check 1: 論点カードの末尾が「？」で終わっていない
      if (node.type === "issue" && node.content && !node.content.trim().endsWith("？") && !node.content.trim().endsWith("?")) {
        errors.push({
          nodeId: node.id,
          type: "error",
          message: "論点は疑問文で書きましょう（末尾に「？」）",
        });
      }

      // Check 2: 仮説カードがアクション（打ち手）になっている
      if (node.type === "hypothesis" && node.content) {
        const actionPatterns = [
          /する$/,
          /します$/,
          /しよう$/,
          /すべき$/,
          /強化する$/,
          /導入する$/,
          /実施する$/,
          /開始する$/,
        ];
        
        const isAction = actionPatterns.some((pattern) => pattern.test(node.content.trim()));
        
        if (isAction) {
          errors.push({
            nodeId: node.id,
            type: "warning",
            message: "それは打ち手です。仮説（〜である）の形にしましょう",
          });
        }
      }

      // Check: Empty content
      if (!node.content.trim()) {
        errors.push({
          nodeId: node.id,
          type: "warning",
          message: "内容を入力してください",
        });
      }
    });

    // Good points
    if (cqNode && cqNode.content.trim()) {
      goodPoints.push("CQ（中心となる問い）が明確に設定されています");
    }

    const validIssues = issueNodes.filter((n) => 
      n.content.trim() && (n.content.trim().endsWith("？") || n.content.trim().endsWith("?"))
    );
    if (validIssues.length >= 2) {
      goodPoints.push(`${validIssues.length}つの論点が適切な疑問文形式で書かれています`);
    }

    const validHypotheses = hypothesisNodes.filter((n) => {
      if (!n.content.trim()) return false;
      const actionPatterns = [/する$/, /します$/, /しよう$/, /すべき$/];
      return !actionPatterns.some((p) => p.test(n.content.trim()));
    });
    if (validHypotheses.length > 0) {
      goodPoints.push(`${validHypotheses.length}つの仮説が適切な形式で記述されています`);
    }

    // Check if tree has good depth (nested issues)
    const nestedIssues = issueNodes.filter((n) => {
      const parent = nodes.find((p) => p.id === n.parentId);
      return parent?.type === "issue";
    });
    if (nestedIssues.length > 0) {
      goodPoints.push("論点が階層化されており、詳細な分解ができています");
    }

    // Improvement points
    if (errors.length > 0) {
      const errorCount = errors.filter((e) => e.type === "error").length;
      const warningCount = errors.filter((e) => e.type === "warning").length;
      if (errorCount > 0) {
        improvementPoints.push(`${errorCount}件の形式エラーがあります。各カードを確認してください`);
      }
      if (warningCount > 0) {
        improvementPoints.push(`${warningCount}件の警告があります。改善を検討してください`);
      }
    }

    // MECE check reminder
    improvementPoints.push("MECEの観点で漏れ・重複がないか確認してください");

    // Check if hypotheses exist for all issues
    const issuesWithoutHypotheses = issueNodes.filter((issue) => {
      const children = nodes.filter((n) => n.parentId === issue.id);
      return children.every((c) => c.type === "issue");
    });
    if (issuesWithoutHypotheses.length > 0) {
      improvementPoints.push(`${issuesWithoutHypotheses.length}つの論点に仮説がありません`);
    }

    // Add good markers to nodes with no errors
    const nodeIdsWithErrors = new Set(errors.map((e) => e.nodeId));
    nodes.forEach((node) => {
      if (!nodeIdsWithErrors.has(node.id) && node.content.trim()) {
        errors.push({
          nodeId: node.id,
          type: "good",
          message: "OK",
        });
      }
    });

    setValidationErrors(errors);
    setFeedback({ goodPoints, improvementPoints });
    setIsValidated(true);
  }, [nodes]);

  const handleReset = useCallback(() => {
    setNodes(initialNodes);
    setValidationErrors([]);
    setFeedback({ goodPoints: [], improvementPoints: [] });
    setIsValidated(false);
  }, []);

  const handleExportPng = useCallback(async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(canvasRef.current, {
        backgroundColor: "#f8f9fa",
        pixelRatio: 2,
      });
      
      const link = document.createElement("a");
      link.download = `issue-tree-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export PNG:", error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const hasFeedback = feedback.goodPoints.length > 0 || feedback.improvementPoints.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Issue Tree Practice</h1>
          <p className="text-sm text-muted-foreground">論理的思考を鍛えるイシューツリー作成ツール</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleExportPng} 
            className="gap-2 bg-transparent"
            disabled={isExporting}
          >
            <Download className="h-4 w-4" />
            {isExporting ? "書き出し中..." : "PNG保存"}
          </Button>
          <Button variant="outline" onClick={handleReset} className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            リセット
          </Button>
          <Button onClick={handleValidate} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            判定
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6 bg-background">
        <TreeCanvas
          nodes={nodes}
          validationErrors={validationErrors}
          onUpdateNode={handleUpdateNode}
          onAddChild={handleAddChild}
          onDeleteNode={handleDeleteNode}
          canvasRef={canvasRef}
        />
      </div>

      {/* Feedback Panel */}
      {isValidated && hasFeedback && (
        <div className="border-t border-border bg-card p-4">
          <div className="flex flex-wrap gap-3">
            {/* Good Points */}
            {feedback.goodPoints.length > 0 && (
              <Alert className="flex-1 min-w-72 border-emerald-500/50 bg-emerald-500/5">
                <ThumbsUp className="h-4 w-4 text-emerald-600" />
                <AlertTitle className="text-emerald-700">Good Points</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 space-y-1 text-emerald-700">
                    {feedback.goodPoints.map((point, idx) => (
                      <li key={idx} className="text-sm">• {point}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Improvement Points */}
            {feedback.improvementPoints.length > 0 && (
              <Alert className="flex-1 min-w-72 border-amber-500/50 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-700">改善ポイント</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 space-y-1 text-amber-700">
                    {feedback.improvementPoints.map((point, idx) => (
                      <li key={idx} className="text-sm">• {point}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
