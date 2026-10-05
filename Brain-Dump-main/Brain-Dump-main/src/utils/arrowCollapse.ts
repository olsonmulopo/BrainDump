import { CanvasItem, LineConnectorItem } from '../types';

/**
 * Returns the item ID that the arrow is pointing TO.
 * - For normal forward arrows or lines, this is `line.toId`.
 * - For reverse arrows (arrowStart === true && arrowEnd === false), this is `line.fromId`.
 */
export function getLineTargetId(line: LineConnectorItem): string {
  if (line.arrowStart && line.arrowEnd === false) {
    return line.fromId;
  }
  return line.toId;
}

/**
 * Returns the item ID that the arrow originates FROM.
 */
export function getLineSourceId(line: LineConnectorItem): string {
  if (line.arrowStart && line.arrowEnd === false) {
    return line.toId;
  }
  return line.fromId;
}

/**
 * Checks whether a line connector originates from or is outgoing from a specific item ID.
 */
export function isLineOutgoingFrom(line: LineConnectorItem, itemId: string): boolean {
  if (line.arrowStart && !line.arrowEnd) {
    // Reverse arrow: points to fromId, originates at toId
    return line.toId === itemId;
  }
  if (!line.arrowStart && line.arrowEnd !== false) {
    // Forward arrow: points to toId, originates at fromId
    return line.fromId === itemId;
  }
  // Bidirectional or plain line without arrows: connects to itemId
  return line.fromId === itemId || line.toId === itemId;
}

/**
 * Returns the downstream target item ID for a line outgoing from currId.
 * If the line does not lead away from currId, returns null.
 */
export function getDownstreamTargetId(line: LineConnectorItem, currId: string): string | null {
  if (line.arrowStart && !line.arrowEnd) {
    // Reverse arrow: toId -> fromId
    return line.toId === currId ? line.fromId : null;
  }
  if (!line.arrowStart && line.arrowEnd !== false) {
    // Forward arrow: fromId -> toId
    return line.fromId === currId ? line.toId : null;
  }
  // Bidirectional or plain line
  if (line.fromId === currId) return line.toId;
  if (line.toId === currId && Boolean(line.arrowStart && line.arrowEnd)) return line.fromId;
  return null;
}

/**
 * Returns a human-friendly display name for a canvas item to show in collapsed badges and tooltips.
 */
export function getItemDisplayName(item?: CanvasItem): string {
  if (!item) return 'Item';
  const anyItem = item as any;
  if (item.type === 'file') {
    return anyItem.fileName || 'File';
  }
  if (item.type === 'note') {
    return anyItem.title || anyItem.content?.slice(0, 24) || 'Note';
  }
  if (item.type === 'title') {
    return anyItem.text || 'Heading';
  }
  if (item.type === 'todo') {
    return anyItem.title || 'Tasks';
  }
  if (item.type === 'board') {
    return anyItem.title || 'Board';
  }
  if (item.type === 'column') {
    return anyItem.title || 'Column';
  }
  if (item.type === 'link') {
    return anyItem.title || anyItem.url || 'Link';
  }
  if (item.type === 'table') {
    return anyItem.table?.title || 'Table';
  }
  if (item.type === 'timer') {
    return anyItem.title || 'Timer';
  }
  if (item.type === 'image') {
    return anyItem.caption || 'Image';
  }
  if (item.type === 'comment') {
    return anyItem.author ? `${anyItem.author}'s Comment` : 'Comment';
  }
  if (item.type === 'calendar') {
    return anyItem.title || 'Calendar';
  }
  return item.label || 'Item';
}

/**
 * Computes which items and lines should be hidden given currently collapsed connector lines.
 * Collapsing an arrow collapses its target item and all downstream items reachable along
 * outgoing connections in that branch.
 */
export function getArrowCollapseState(
  items: Record<string, CanvasItem>,
  allLines: LineConnectorItem[]
): {
  hiddenItemIds: Set<string>;
  collapsedLineIds: Set<string>;
  hiddenLineIds: Set<string>;
  downstreamCountByLineId: Record<string, number>;
} {
  const collapsedLines = allLines.filter((l) => Boolean(l.isCollapsed));
  const hiddenItemIds = new Set<string>();
  const downstreamCountByLineId: Record<string, number> = {};

  // Helper to get child item IDs of a column
  const getColumnChildIds = (colId: string): string[] => {
    return Object.values(items)
      .filter((it) => it.columnId === colId)
      .map((it) => it.id);
  };

  // For each collapsed line, compute the items hidden by that branch
  for (const line of collapsedLines) {
    const directTargetId = getLineTargetId(line);
    const sourceRootId = getLineSourceId(line);

    if (!directTargetId || !items[directTargetId] || directTargetId === sourceRootId) {
      downstreamCountByLineId[line.id] = 0;
      continue;
    }

    const boardId = items[directTargetId].boardId;
    const reachableForThisLine = new Set<string>();

    // 1. Initial downstream traversal from directTargetId
    const downstreamQueue: string[] = [directTargetId];
    reachableForThisLine.add(directTargetId);

    while (downstreamQueue.length > 0) {
      const currId = downstreamQueue.shift()!;
      const currItem = items[currId];
      if (!currItem) continue;

      // If currId is a column, all children inside it are also hidden and part of the branch
      if (currItem.type === 'column') {
        const childIds = getColumnChildIds(currId);
        for (const childId of childIds) {
          if (!reachableForThisLine.has(childId) && childId !== sourceRootId) {
            reachableForThisLine.add(childId);
            downstreamQueue.push(childId);
          }
        }
      }

      // Traverse all lines outgoing downstream from currId
      for (const connLine of allLines) {
        const nextId = getDownstreamTargetId(connLine, currId);
        if (nextId && items[nextId] && nextId !== sourceRootId && !reachableForThisLine.has(nextId)) {
          reachableForThisLine.add(nextId);
          downstreamQueue.push(nextId);
        }
      }
    }

    // 2. Inward-pointing arrow collapse:
    // Sometimes elements point inwards to the branch being collapsed (e.g. C -> B or Note -> Vid -> B).
    // If those elements have no other visible connections outside this branch, they must also collapse
    // so we don't leave orphaned objects floating on the canvas with unknown connections.
    const boardLines = allLines.filter((l) => {
      const srcItem = items[l.fromId];
      const tgtItem = items[l.toId];
      return (srcItem && srcItem.boardId === boardId) || (tgtItem && tgtItem.boardId === boardId);
    });

    // Collect candidate inward nodes feeding into the branch (and their sub-branches)
    const candidateInward = new Set<string>();
    const inwardQueue: string[] = Array.from(reachableForThisLine);

    while (inwardQueue.length > 0) {
      const tgtId = inwardQueue.shift()!;
      // Find any line pointing into tgtId
      for (const connLine of boardLines) {
        const lineTgt = getLineTargetId(connLine);
        if (lineTgt === tgtId) {
          const srcId = getLineSourceId(connLine);
          const srcItem = items[srcId];
          if (
            srcId &&
            srcItem &&
            srcId !== sourceRootId &&
            srcItem.boardId === boardId &&
            !reachableForThisLine.has(srcId) &&
            !candidateInward.has(srcId)
          ) {
            // Standalone cards, notes, timers, files, images, titles, etc.
            // Items inside visible columns should stay in their columns
            if (srcItem.type !== 'column' && (!srcItem.columnId || reachableForThisLine.has(srcItem.columnId))) {
              candidateInward.add(srcId);
              inwardQueue.push(srcId);
            }
          }
        }
      }
    }

    // Also include downstream items branching out from candidateInward nodes
    const candDownstreamQueue = Array.from(candidateInward);
    while (candDownstreamQueue.length > 0) {
      const cId = candDownstreamQueue.shift()!;
      for (const connLine of boardLines) {
        const nextId = getDownstreamTargetId(connLine, cId);
        if (
          nextId &&
          items[nextId] &&
          nextId !== sourceRootId &&
          items[nextId].boardId === boardId &&
          !reachableForThisLine.has(nextId) &&
          !candidateInward.has(nextId)
        ) {
          const nItem = items[nextId];
          if (nItem.type !== 'column' && (!nItem.columnId || reachableForThisLine.has(nItem.columnId))) {
            candidateInward.add(nextId);
            candDownstreamQueue.push(nextId);
          }
        }
      }
    }

    // Prune candidates: if any candidate has a line connecting to an external node
    // (i.e. a node that is NOT in reachableForThisLine AND NOT in candidateInward),
    // then that candidate has an outside visible connection and must NOT collapse.
    // When a candidate is pruned, any other candidate whose outside connection was through it
    // will also be pruned in the next iteration.
    let pruned = true;
    while (pruned) {
      pruned = false;
      for (const candId of Array.from(candidateInward)) {
        const candLines = boardLines.filter((l) => l.fromId === candId || l.toId === candId);
        const hasExternalConnection = candLines.some((l) => {
          const otherId = l.fromId === candId ? l.toId : l.fromId;
          if (otherId === candId) return false;
          // If connected to sourceRootId or any item outside the branch and outside candidates:
          return (
            !reachableForThisLine.has(otherId) &&
            !candidateInward.has(otherId) &&
            Boolean(items[otherId])
          );
        });

        if (hasExternalConnection) {
          candidateInward.delete(candId);
          pruned = true;
        }
      }
    }

    // Add all verified inward orphaned nodes to reachableForThisLine
    for (const candId of candidateInward) {
      reachableForThisLine.add(candId);
    }

    // Add all reachable items for this line to the overall hidden set
    for (const id of reachableForThisLine) {
      hiddenItemIds.add(id);
    }

    downstreamCountByLineId[line.id] = reachableForThisLine.size;
  }

  // Ensure all items inside any hidden column are also in hiddenItemIds
  for (const item of Object.values(items)) {
    if (item.columnId && hiddenItemIds.has(item.columnId)) {
      hiddenItemIds.add(item.id);
    }
  }

  // Determine hidden lines
  const hiddenLineIds = new Set<string>();
  for (const line of allLines) {
    const src = getLineSourceId(line);
    const tgt = getLineTargetId(line);

    // 1. If the source item is hidden (e.g. ancestor branch was collapsed),
    // this line MUST be hidden — EVEN IF it is marked isCollapsed!
    // Collapsed stubs should ONLY be shown when originating from a visible item.
    if (hiddenItemIds.has(src)) {
      hiddenLineIds.add(line.id);
      continue;
    }

    // 2. If this line is collapsed and its source is visible,
    // it will be rendered as an interactive stub with expand badge on the source item.
    if (line.isCollapsed) {
      continue;
    }

    // 3. If this line is not collapsed, but its target is hidden,
    // the line connects into a collapsed branch, so hide it.
    if (hiddenItemIds.has(tgt)) {
      hiddenLineIds.add(line.id);
      continue;
    }

    // 4. If either source or target item does not exist, hide the line
    if (!items[src] || !items[tgt]) {
      hiddenLineIds.add(line.id);
      continue;
    }
  }

  // collapsedLineIds contains only lines that are collapsed AND currently visible on canvas
  const collapsedLineIds = new Set(
    collapsedLines.filter((l) => !hiddenLineIds.has(l.id)).map((l) => l.id)
  );

  return {
    hiddenItemIds,
    collapsedLineIds,
    hiddenLineIds,
    downstreamCountByLineId,
  };
}
