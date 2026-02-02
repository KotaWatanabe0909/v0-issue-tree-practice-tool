"use client";

import React from "react"

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreeNode, NodeType } from "@/lib/issue-tree-types";
import { getNodeTypeLabel } from "@/lib/issue-tree-types";
import { Button } from "@/components/ui/button";

interface TreeCardProps {
  node: TreeNode;
  onUpdate: (id: string, content: string) => void;
  onAddChild: (parentId: string, addIssue: boolean) => void;
  onDelete: (id: string) => void;
  canAddChild: boolean;
  canAddIssue: boolean;
  canDelete: boolean;
}

export function TreeCard({
  node,
  onUpdate,
  onAddChild,
  onDelete,
  canAddChild,
  canAddIssue,
  canDelete,
}: TreeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(node.content);
  }, [node.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== node.content) {
      onUpdate(node.id, editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setEditValue(node.content);
      setIsEditing(false);
    }
  };

  const getTypeStyles = (type: NodeType) => {
    switch (type) {
      case "cq":
        return "bg-primary text-primary-foreground border-primary";
      case "issue":
        return "bg-card text-card-foreground border-border";
      case "hypothesis":
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  return (
    <div className="relative group">
      <div
        className={cn(
          "w-52 min-h-24 rounded-lg border shadow-sm transition-all",
          getTypeStyles(node.type),
          "hover:shadow-md"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "px-3 py-1.5 text-xs font-semibold border-b rounded-t-lg",
            node.type === "cq"
              ? "bg-primary/90 border-primary-foreground/20"
              : "bg-muted/50 border-border"
          )}
        >
          {getNodeTypeLabel(node.type)}
        </div>

        {/* Content */}
        <div className="p-3">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full min-h-12 text-sm resize-none bg-transparent focus:outline-none",
                node.type === "cq" ? "text-primary-foreground placeholder:text-primary-foreground/60" : ""
              )}
              placeholder={
                node.type === "cq"
                  ? "中心となる問いを入力..."
                  : node.type === "issue"
                  ? "論点を入力（末尾に？）..."
                  : "仮説を入力..."
              }
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className={cn(
                "min-h-12 text-sm cursor-text leading-relaxed",
                !node.content && "opacity-60"
              )}
            >
              {node.content || (
                <span className="italic">
                  {node.type === "cq"
                    ? "クリックして入力..."
                    : node.type === "issue"
                    ? "論点を入力..."
                    : "仮説を入力..."}
                </span>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Actions */}
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {canAddIssue && (
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 rounded-full bg-card shadow-md hover:bg-secondary hover:text-secondary-foreground border-secondary"
            onClick={() => onAddChild(node.id, true)}
            title="子論点を追加"
          >
            <span className="text-[10px] font-bold">論</span>
          </Button>
        )}
        {canAddChild && (
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 rounded-full bg-card shadow-md hover:bg-primary hover:text-primary-foreground"
            onClick={() => onAddChild(node.id, false)}
            title="仮説を追加"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        {canDelete && (
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 rounded-full bg-card shadow-md hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onDelete(node.id)}
            title="削除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
