export type NodeType = "cq" | "issue" | "hypothesis";

export interface TreeNode {
  id: string;
  parentId: string | null;
  type: NodeType;
  content: string;
}

export interface ValidationError {
  nodeId: string;
  type: "error" | "warning" | "good";
  message: string;
}

export interface FeedbackResult {
  goodPoints: string[];
  improvementPoints: string[];
}

export function getNodeTypeLabel(type: NodeType): string {
  switch (type) {
    case "cq":
      return "CQ";
    case "issue":
      return "論点";
    case "hypothesis":
      return "仮説";
  }
}

export function getChildType(parentType: NodeType, addIssue: boolean = false): NodeType {
  switch (parentType) {
    case "cq":
      return "issue";
    case "issue":
      return addIssue ? "issue" : "hypothesis";
    case "hypothesis":
      return "hypothesis";
  }
}
