"use client";

import React from "react"

import { useRef, useEffect, useState } from "react";
import type { TreeNode, ValidationError } from "@/lib/issue-tree-types";
import { TreeCard } from "./tree-card";

interface TreeCanvasProps {
  nodes: TreeNode[];
  validationErrors: ValidationError[];
  onUpdateNode: (id: string, content: string) => void;
  onAddChild: (parentId: string, addIssue: boolean) => void;
  onDeleteNode: (id: string) => void;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
}

interface PositionedNode extends TreeNode {
  x: number;
  y: number;
  children: PositionedNode[];
}

export function TreeCanvas({
  nodes,
  validationErrors,
  onUpdateNode,
  onAddChild,
  onDeleteNode,
  canvasRef: externalCanvasRef,
}: TreeCanvasProps) {
  const internalCanvasRef = useRef<HTMLDivElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const svgRef = useRef<SVGSVGElement>(null);
  const [connections, setConnections] = useState<{ from: string; to: string }[]>([]);
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Build tree structure
  const buildTree = (): PositionedNode | null => {
    const rootNode = nodes.find((n) => n.parentId === null);
    if (!rootNode) return null;

    const buildSubtree = (node: TreeNode): PositionedNode => {
      const children = nodes.filter((n) => n.parentId === node.id);
      return {
        ...node,
        x: 0,
        y: 0,
        children: children.map(buildSubtree),
      };
    };

    return buildSubtree(rootNode);
  };

  // Calculate positions for nodes
  const calculatePositions = (root: PositionedNode): Map<string, { x: number; y: number }> => {
    const positions = new Map<string, { x: number; y: number }>();
    const CARD_WIDTH = 208; // w-52 = 13rem = 208px
    const CARD_HEIGHT = 120;
    const H_GAP = 80;
    const V_GAP = 24;

    const calculateSubtree = (
      node: PositionedNode,
      depth: number,
      startY: number
    ): { height: number } => {
      const x = depth * (CARD_WIDTH + H_GAP);

      if (node.children.length === 0) {
        positions.set(node.id, { x, y: startY });
        return { height: CARD_HEIGHT };
      }

      let currentY = startY;
      let totalHeight = 0;

      for (const child of node.children) {
        const result = calculateSubtree(child, depth + 1, currentY);
        currentY += result.height + V_GAP;
        totalHeight += result.height + V_GAP;
      }

      totalHeight = Math.max(totalHeight - V_GAP, CARD_HEIGHT);

      // Center parent among children
      const firstChildY = positions.get(node.children[0].id)?.y || startY;
      const lastChildY = positions.get(node.children[node.children.length - 1].id)?.y || startY;
      const centerY = (firstChildY + lastChildY) / 2;

      positions.set(node.id, { x, y: centerY });

      return { height: totalHeight };
    };

    calculateSubtree(root, 0, 0);
    return positions;
  };

  // Update connections whenever nodes change
  useEffect(() => {
    const root = buildTree();
    if (!root) return;

    const positions = calculatePositions(root);
    setNodePositions(positions);

    const newConnections: { from: string; to: string }[] = [];
    nodes.forEach((node) => {
      if (node.parentId) {
        newConnections.push({ from: node.parentId, to: node.id });
      }
    });
    setConnections(newConnections);
  }, [nodes]);

  const getValidation = (nodeId: string) => {
    return validationErrors.find((e) => e.nodeId === nodeId);
  };

  const renderConnections = () => {
    const CARD_WIDTH = 208;
    const CARD_HEIGHT = 96;

    return connections.map((conn) => {
      const fromPos = nodePositions.get(conn.from);
      const toPos = nodePositions.get(conn.to);

      if (!fromPos || !toPos) return null;

      const startX = fromPos.x + CARD_WIDTH;
      const startY = fromPos.y + CARD_HEIGHT / 2;
      const endX = toPos.x;
      const endY = toPos.y + CARD_HEIGHT / 2;

      const midX = (startX + endX) / 2;

      const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

      return (
        <path
          key={`${conn.from}-${conn.to}`}
          d={path}
          fill="none"
          stroke="oklch(0.88 0.005 255)"
          strokeWidth="2"
          className="transition-all"
        />
      );
    });
  };

  // Calculate canvas dimensions
  const canvasDimensions = () => {
    if (nodePositions.size === 0) return { width: 800, height: 400 };

    let maxX = 0;
    let maxY = 0;

    nodePositions.forEach((pos) => {
      maxX = Math.max(maxX, pos.x + 280);
      maxY = Math.max(maxY, pos.y + 160);
    });

    return { width: Math.max(800, maxX + 100), height: Math.max(400, maxY + 100) };
  };

  const { width, height } = canvasDimensions();

  const root = nodes.find((n) => n.parentId === null);

  return (
    <div className="relative overflow-auto bg-background rounded-lg border border-border">
      <div
        ref={canvasRef}
        className="relative p-8"
        style={{ minWidth: width, minHeight: height }}
      >
        {/* Connection lines */}
        <svg
          ref={svgRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        >
          {renderConnections()}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = nodePositions.get(node.id);
          if (!pos) return null;

          const canAddChild = node.type !== "hypothesis";
          const canAddIssue = node.type === "issue";
          const canDelete = node.type !== "cq";

          return (
            <div
              key={node.id}
              className="absolute transition-all duration-300"
              style={{
                left: pos.x,
                top: pos.y,
              }}
            >
              <TreeCard
                node={node}
                validation={getValidation(node.id)}
                onUpdate={onUpdateNode}
                onAddChild={onAddChild}
                onDelete={onDeleteNode}
                canAddChild={canAddChild}
                canAddIssue={canAddIssue}
                canDelete={canDelete}
              />
            </div>
          );
        })}

        {/* Empty state */}
        {!root && (
          <div className="flex items-center justify-center h-full min-h-80">
            <p className="text-muted-foreground">ツリーを読み込んでいます...</p>
          </div>
        )}
      </div>
    </div>
  );
}
