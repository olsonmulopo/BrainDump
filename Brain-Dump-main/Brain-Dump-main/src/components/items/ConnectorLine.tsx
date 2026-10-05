import React, { useState, useEffect } from 'react';
import { LineConnectorItem, CanvasItem } from '../../types';
import { getItemDisplayName } from '../../utils/arrowCollapse';
import { Minus, Plus } from 'lucide-react';

interface ConnectorLineProps {
  line: LineConnectorItem;
  fromItem?: CanvasItem;
  toItem?: CanvasItem;
  allItems?: Record<string, CanvasItem>;
  onUpdateLine?: (updates: Partial<LineConnectorItem>) => void;
  onDelete: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  downstreamCount?: number;
}

// Estimate content-aware fallback bounds when DOM element is not mounted yet
export function getEstimatedFallbackBounds(
  item: CanvasItem,
  allItems?: Record<string, CanvasItem>
): { x: number; y: number; width: number; height: number } {
  let x = item.x ?? 0;
  let y = item.y ?? 0;
  let width = 0;
  let height = 0;

  if (item.columnId && allItems && allItems[item.columnId]) {
    const parentCol = allItems[item.columnId];
    x = (parentCol.x ?? 0) + 8;
    y = (parentCol.y ?? 0) + 60 + (item.orderInColumn || 0) * 90;
    width = (parentCol.width || 260) - 16;
    height = item.height || 80;
    return { x, y, width, height };
  }

  if (item.type === 'board') {
    return {
      x,
      y,
      width: 120,
      height: 125,
    };
  }

  if (item.type === 'title') {
    const titleItem = item as { text?: string; level?: 1 | 2 | 3 };
    const text = titleItem.text || 'Heading Title';
    const level = titleItem.level || 1;
    const charWidth = level === 1 ? 16 : level === 2 ? 14 : 12;
    const approxWidth = Math.max(80, Math.min(760, text.length * charWidth + 48));
    // If the item has the legacy 340 or 320 default, ignore it and use text-based width
    width = item.width && item.width !== 340 && item.width !== 320 ? item.width : approxWidth;
    height = item.height || (level === 1 ? 56 : level === 2 ? 48 : 44);
    return { x, y, width, height };
  }

  switch (item.type) {
    case 'column':
      width = item.width || 260;
      height = item.height || 320;
      break;
    case 'note':
      width = Math.max(item.width || 290, 280);
      height = item.height || 160;
      break;
    case 'comment':
      width = Math.max(item.width || 300, 290);
      height = item.height || 120;
      break;
    case 'todo': {
      const todoItem = item as { todos?: Array<unknown> };
      const count = Array.isArray(todoItem.todos) ? todoItem.todos.length : 1;
      width = item.width || 260;
      height = item.height || Math.max(120, count * 36 + 80);
      break;
    }
    case 'link':
      width = item.width || 330;
      height = item.height || 260;
      break;
    case 'table':
      width = item.width || 380;
      height = item.height || 220;
      break;
    case 'timer':
      width = item.width || 300;
      height = item.height || 180;
      break;
    case 'image':
      width = item.width || 280;
      height = item.height || 240;
      break;
    case 'calendar':
      width = item.width || 440;
      height = item.height || 360;
      break;
    default:
      width = item.width || 260;
      height = item.height || 140;
      break;
  }

  return { x, y, width, height };
}

// Retrieve accurate item bounds (measured dynamically from DOM element when available)
export function getItemBounds(
  item: CanvasItem,
  allItems?: Record<string, CanvasItem>
): { x: number; y: number; width: number; height: number } {
  if (typeof document !== 'undefined') {
    // If inside column, get true bounding box in canvas coordinates
    if (item.columnId) {
      const childEl =
        document.getElementById(`child-container-${item.id}`) ||
        document.getElementById(`item-${item.id}`);
      const canvasContent = document.getElementById('canvas-content-layer');

      if (childEl && canvasContent) {
        const canvasRect = canvasContent.getBoundingClientRect();
        const itemRect = childEl.getBoundingClientRect();
        const scale = canvasRect.width > 0 ? canvasRect.width / 5000 : 1;
        if (itemRect.width > 0 && itemRect.height > 0 && scale > 0) {
          return {
            x: (itemRect.left - canvasRect.left) / scale,
            y: (itemRect.top - canvasRect.top) / scale,
            width: itemRect.width / scale,
            height: itemRect.height / scale,
          };
        }
      }
    } else {
      // Standalone card or column
      const el =
        document.getElementById(`card-container-${item.id}`) ||
        document.getElementById(`column-${item.id}`) ||
        document.getElementById(`item-${item.id}`);

      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
        const x = item.x ?? 0;
        const y = item.y ?? 0;

        return {
          x,
          y,
          width: el.offsetWidth,
          height: el.offsetHeight,
        };
      }
    }
  }

  return getEstimatedFallbackBounds(item, allItems);
}

// Compute outward normal of the box edge closest to the intersection point
export function getEdgeNormal(
  point: { x: number; y: number },
  box: { x: number; y: number; width: number; height: number }
): { nx: number; ny: number } {
  const leftDist = Math.abs(point.x - box.x);
  const rightDist = Math.abs(point.x - (box.x + box.width));
  const topDist = Math.abs(point.y - box.y);
  const bottomDist = Math.abs(point.y - (box.y + box.height));

  const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
  if (minDist === leftDist) return { nx: -1, ny: 0 };
  if (minDist === rightDist) return { nx: 1, ny: 0 };
  if (minDist === topDist) return { nx: 0, ny: -1 };
  return { nx: 0, ny: 1 };
}

// Compute ray-box intersection so arrow connects cleanly at the outer border of cards
export function getBoxBorderPoint(
  centerInside: { x: number; y: number },
  pointOutside: { x: number; y: number },
  box: { x: number; y: number; width: number; height: number },
  padding: number = 1
): { x: number; y: number } {
  const dx = pointOutside.x - centerInside.x;
  const dy = pointOutside.y - centerInside.y;
  if (dx === 0 && dy === 0) return { x: centerInside.x, y: centerInside.y };

  const hw = Math.max(10, box.width / 2 + padding);
  const hh = Math.max(10, box.height / 2 + padding);

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const scaleX = absDx > 0 ? hw / absDx : Infinity;
  const scaleY = absDy > 0 ? hh / absDy : Infinity;
  let scale = Math.min(scaleX, scaleY);

  if (!isFinite(scale) || scale <= 0) scale = 1;

  let x = centerInside.x + dx * scale;
  let y = centerInside.y + dy * scale;

  // Clamp safely within the box outer boundary rectangle + padding
  const minX = box.x - padding;
  const maxX = box.x + box.width + padding;
  const minY = box.y - padding;
  const maxY = box.y + box.height + padding;

  x = Math.max(minX, Math.min(maxX, x));
  y = Math.max(minY, Math.min(maxY, y));

  return { x, y };
}

// Compute accurate border point and outward normal, supporting circular items like Timer
export function getItemBorderPoint(
  centerInside: { x: number; y: number },
  pointOutside: { x: number; y: number },
  item?: CanvasItem,
  box?: { x: number; y: number; width: number; height: number },
  padding: number = 4
): { x: number; y: number; normal: { nx: number; ny: number } } {
  if (item?.type === 'timer' && box) {
    // Clock dial is circular (dial radius 92px + outer disk ring and rim = 100px)
    const cx = box.x + 92;
    const cy = box.y + 92;
    const dx = pointOutside.x - cx;
    const dy = pointOutside.y - cy;
    const d = Math.hypot(dx, dy);
    if (d > 0) {
      const r = 100 + padding;
      const nx = dx / d;
      const ny = dy / d;
      return {
        x: cx + nx * r,
        y: cy + ny * r,
        normal: { nx, ny },
      };
    }
    return { x: cx, y: cy + 100 + padding, normal: { nx: 0, ny: 1 } };
  }

  const b = box || { x: centerInside.x - 100, y: centerInside.y - 50, width: 200, height: 100 };
  const pt = getBoxBorderPoint(centerInside, pointOutside, b, padding);
  const norm = getEdgeNormal(pt, b);
  return { x: pt.x, y: pt.y, normal: norm };
}

// Export calculateLineGeometry for external positioning (e.g. ArrowToolbar)
export function calculateLineGeometry(
  fromItem?: CanvasItem,
  toItem?: CanvasItem,
  allItems?: Record<string, CanvasItem>,
  isCollapsed?: boolean,
  isReverse?: boolean
) {
  if (!fromItem || !toItem) return null;

  const srcItem = isReverse ? toItem : fromItem;
  const tgtItem = isReverse ? fromItem : toItem;

  const fromBox = getItemBounds(fromItem, allItems);
  const toBox = getItemBounds(toItem, allItems);
  const srcBox = isReverse ? toBox : fromBox;
  const tgtBox = isReverse ? fromBox : toBox;

  const srcCenter = {
    x: srcItem.type === 'timer' ? srcBox.x + 92 : srcBox.x + srcBox.width / 2,
    y: srcItem.type === 'timer' ? srcBox.y + 92 : srcBox.y + srcBox.height / 2,
  };
  const tgtCenter = {
    x: tgtItem.type === 'timer' ? tgtBox.x + 92 : tgtBox.x + tgtBox.width / 2,
    y: tgtItem.type === 'timer' ? tgtBox.y + 92 : tgtBox.y + tgtBox.height / 2,
  };

  const p1Info = getItemBorderPoint(srcCenter, tgtCenter, srcItem, srcBox, 4);
  const pStart = { x: p1Info.x, y: p1Info.y };
  const norm1 = p1Info.normal;

  if (isCollapsed) {
    const dx = tgtCenter.x - pStart.x;
    const dy = tgtCenter.y - pStart.y;
    const fullDist = Math.hypot(dx, dy) || 1;
    const ux = dx / fullDist;
    const uy = dy / fullDist;

    // Graceful compact stub length extending towards target
    const stubLength = Math.max(50, Math.min(fullDist * 0.38, 85));

    // Follow the border normal first then vector towards target
    const endX = pStart.x + (norm1.nx * 0.35 + ux * 0.65) * stubLength;
    const endY = pStart.y + (norm1.ny * 0.35 + uy * 0.65) * stubLength;

    const offset = stubLength * 0.35;
    const cx1 = pStart.x + norm1.nx * offset;
    const cy1 = pStart.y + norm1.ny * offset;
    const cx2 = endX - ux * (offset * 0.5);
    const cy2 = endY - uy * (offset * 0.5);

    const x1 = isReverse ? endX : pStart.x;
    const y1 = isReverse ? endY : pStart.y;
    const x2 = isReverse ? pStart.x : endX;
    const y2 = isReverse ? pStart.y : endY;

    const pathData = isReverse
      ? `M ${endX} ${endY} C ${cx2} ${cy2}, ${cx1} ${cy1}, ${pStart.x} ${pStart.y}`
      : `M ${pStart.x} ${pStart.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;

    const midX = (pStart.x + endX) / 2;
    const midY = (pStart.y + endY) / 2;

    // Badge placed right past endX, endY
    const badgeX = endX + ux * 16;
    const badgeY = endY + uy * 16;

    return {
      fromBox,
      toBox,
      p1: { x: x1, y: y1 },
      p2: { x: x2, y: y2 },
      x1,
      y1,
      x2,
      y2,
      cx1,
      cy1,
      cx2,
      cy2,
      pathData,
      midX,
      midY,
      badgeX,
      badgeY,
      isCollapsed: true,
    };
  }

  // Normal expanded arrow
  const fromCenter = {
    x: fromItem.type === 'timer' ? fromBox.x + 92 : fromBox.x + fromBox.width / 2,
    y: fromItem.type === 'timer' ? fromBox.y + 92 : fromBox.y + fromBox.height / 2,
  };
  const toCenter = {
    x: toItem.type === 'timer' ? toBox.x + 92 : toBox.x + toBox.width / 2,
    y: toItem.type === 'timer' ? toBox.y + 92 : toBox.y + toBox.height / 2,
  };

  const p1Expanded = getItemBorderPoint(fromCenter, toCenter, fromItem, fromBox, 4);
  const p2Expanded = getItemBorderPoint(toCenter, fromCenter, toItem, toBox, 4);

  const x1 = p1Expanded.x;
  const y1 = p1Expanded.y;
  const x2 = p2Expanded.x;
  const y2 = p2Expanded.y;

  const n1 = p1Expanded.normal;
  const n2 = p2Expanded.normal;
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const offset = Math.max(12, Math.min(dist * 0.32, 65));

  const cx1 = x1 + n1.nx * offset;
  const cy1 = y1 + n1.ny * offset;
  const cx2 = x2 + n2.nx * offset;
  const cy2 = y2 + n2.ny * offset;

  const pathData = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return {
    fromBox,
    toBox,
    p1: { x: x1, y: y1 },
    p2: { x: x2, y: y2 },
    x1,
    y1,
    x2,
    y2,
    cx1,
    cy1,
    cx2,
    cy2,
    pathData,
    midX,
    midY,
    badgeX: x2,
    badgeY: y2,
    isCollapsed: false,
  };
}

export const ConnectorLine: React.FC<ConnectorLineProps> = ({
  line,
  fromItem,
  toItem,
  allItems,
  onUpdateLine,
  onDelete,
  onSelect,
  isSelected,
  downstreamCount,
}) => {
  const [, setMountedTick] = useState(0);
  useEffect(() => {
    // Re-render once layout is computed to capture precise DOM dimensions
    const timer = requestAnimationFrame(() => {
      setMountedTick((c) => c + 1);
    });
    return () => cancelAnimationFrame(timer);
  }, [fromItem?.id, toItem?.id]);

  const isReverse = Boolean(line.arrowStart && !line.arrowEnd);
  const isCollapsed = Boolean(line.isCollapsed);
  const geom = calculateLineGeometry(fromItem, toItem, allItems, isCollapsed, isReverse);
  if (!geom) return null;

  const { pathData, midX, midY } = geom;
  const lineColor = line.colorHex || line.customColor || (isSelected ? '#4f46e5' : '#64748b');

  const isEndArrow = line.arrowEnd !== false;
  const isStartArrow = Boolean(line.arrowStart);

  // Determine markers: any end that doesn't have an arrow gets an anchor dot
  const markerEndUrl = isEndArrow
    ? `url(#arrow-end-${line.id})`
    : `url(#dot-end-${line.id})`;

  const markerStartUrl = isStartArrow
    ? `url(#arrow-start-${line.id})`
    : `url(#dot-start-${line.id})`;

  const targetItem = isReverse ? fromItem : toItem;
  const targetDisplayName = getItemDisplayName(targetItem);

  return (
    <g className="group/line select-none">
      <defs>
        {/* End Arrow Marker (Forward) - bold barbed arrowhead matching sketch */}
        <marker
          id={`arrow-end-${line.id}`}
          viewBox="0 0 14 14"
          refX="11.5"
          refY="7"
          markerWidth="13"
          markerHeight="13"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 1 1.5 L 13 7 L 1 12.5 L 4.5 7 Z"
            fill={lineColor}
            stroke={lineColor}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </marker>

        {/* Start Arrow Marker (Reverse) - bold barbed arrowhead matching sketch */}
        <marker
          id={`arrow-start-${line.id}`}
          viewBox="0 0 14 14"
          refX="11.5"
          refY="7"
          markerWidth="13"
          markerHeight="13"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 1 1.5 L 13 7 L 1 12.5 L 4.5 7 Z"
            fill={lineColor}
            stroke={lineColor}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </marker>

        {/* Start Dot Marker for one-sided forward arrow - solid circular dot at the beginning of the arrow */}
        <marker
          id={`dot-start-${line.id}`}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <circle cx="5" cy="5" r="4" fill={lineColor} />
        </marker>

        {/* End Dot Marker for one-sided reverse arrow - solid circular dot at the beginning of the arrow */}
        <marker
          id={`dot-end-${line.id}`}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <circle cx="5" cy="5" r="4" fill={lineColor} />
        </marker>
      </defs>

      {/* Hit-area path with generous 16px stroke width */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth="16"
        style={{ pointerEvents: 'stroke' }}
        className="cursor-pointer pointer-events-auto no-drag"
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
      />

      {/* Glowing outline when selected */}
      {isSelected && (
        <path
          d={pathData}
          fill="none"
          stroke="#818cf8"
          strokeWidth="6"
          strokeOpacity="0.5"
          className="pointer-events-none"
        />
      )}

      {/* Visible Arrow Line */}
      <path
        d={pathData}
        fill="none"
        stroke={lineColor}
        strokeWidth={isSelected ? '3' : '2'}
        strokeDasharray={
          line.style === 'dashed' ? '6,6' : line.style === 'dotted' ? '2,4' : undefined
        }
        markerEnd={markerEndUrl}
        markerStart={markerStartUrl}
        style={{ pointerEvents: 'stroke' }}
        className="transition-colors cursor-pointer pointer-events-auto no-drag"
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
      />

      {/* Collapsed Branch Badge */}
      {isCollapsed && (
        <g transform={`translate(${geom.badgeX}, ${geom.badgeY})`}>
          <foreignObject
            x="-85"
            y="-15"
            width="170"
            height="30"
            style={{ pointerEvents: 'auto' }}
            className="overflow-visible pointer-events-auto no-drag"
          >
            {(() => {
              const totalHidden = downstreamCount || 1;
              const additionalCount = totalHidden - 1;
              return (
                <div
                  className="flex items-center justify-center cursor-pointer no-drag select-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLine?.({ isCollapsed: false });
                  }}
                  title={`Collapsed branch: "${targetDisplayName}" (${totalHidden} hidden item${totalHidden > 1 ? 's' : ''}). Click to expand.`}
                >
                  <div
                    className="group/badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-white dark:bg-neutral-900 border-2 shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 no-drag cursor-pointer"
                    style={{
                      borderColor: lineColor,
                      color: lineColor,
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5] text-indigo-600 dark:text-indigo-400 group-hover/badge:rotate-90 transition-transform duration-200" />
                    <span className="max-w-[95px] truncate">
                      {line.label ? line.label : targetDisplayName}
                    </span>
                    {additionalCount > 0 && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                        +{additionalCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </foreignObject>
        </g>
      )}

      {/* Expanded Line Label & Collapse Button */}
      {!isCollapsed && (
        <g transform={`translate(${midX}, ${midY})`}>
          <foreignObject
            x="-75"
            y="-14"
            width="150"
            height="28"
            style={{ pointerEvents: 'auto' }}
            className="overflow-visible pointer-events-auto no-drag"
          >
            <div className="flex items-center justify-center cursor-pointer no-drag select-none">
              {line.label ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.();
                  }}
                  className="group/pill inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-white dark:bg-neutral-900 border shadow-xs hover:shadow-md transition-all cursor-pointer no-drag"
                  style={{
                    borderColor: lineColor,
                    color: lineColor,
                  }}
                  title={`Label: "${line.label}". Click minus to collapse target.`}
                >
                  <span className="max-w-[100px] truncate">{line.label}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateLine?.({ isCollapsed: true });
                    }}
                    className="w-3.5 h-3.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 flex items-center justify-center transition-colors cursor-pointer ml-0.5"
                    title={`Collapse branch pointing to "${targetDisplayName}"`}
                  >
                    <Minus className="w-2.5 h-2.5 stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLine?.({ isCollapsed: true });
                  }}
                  className={`w-5 h-5 rounded-full bg-white dark:bg-neutral-900 border shadow-xs hover:shadow-md flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-red-500 hover:border-red-400 hover:scale-110 active:scale-95 transition-all cursor-pointer no-drag ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover/line:opacity-100'
                  }`}
                  style={{ borderColor: lineColor }}
                  title={`Collapse branch pointing to "${targetDisplayName}"`}
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>
              )}
            </div>
          </foreignObject>
        </g>
      )}
    </g>
  );
};
