/**
 * Java parity: AI/src/search/pns/ProofNumberSearch.java + PNSNode.java —
 * a best-first AND/OR search that assigns proof and disproof numbers to
 * leaf states and expands the "most-proving" node at every iteration.
 *
 * Proves (or disproves) that a position is a win/loss for a designated
 * proof player. Suited to two-player deterministic games with perfect
 * information. For positions PNS can't fully resolve within the budget,
 * `selectAction` falls back to picking a move that minimises the proof
 * number (i.e. closest to proven) at the root.
 *
 * Differences from Java:
 *   - Iteration / time budgets are first-class (Java's `selectAction`
 *     ignores `maxSeconds` / `maxIterations`).
 *   - "Infinity" uses `Number.POSITIVE_INFINITY`. Integer overflow is
 *     not a concern in JS so we don't cap.
 *   - `deleteSubtree` is implemented by dropping the children array
 *     (frees the reference; GC handles the rest).
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import { AI, type SelectActionOptions } from "./ai.js";

export type ProofGoal = "prove-win" | "prove-loss";

export interface PNSAIOptions {
  /** Whether to try to prove a win (default) or a loss for the proof player. */
  readonly proofGoal?: ProofGoal;
  /** Hard cap on PNS iterations (each one expands one node). */
  readonly defaultIterations?: number;
}

type NodeType = "and" | "or";
type NodeValue = "true" | "false" | "unknown";

const INF = Number.POSITIVE_INFINITY;
const DEFAULT_ITERS = 100_000;

interface PNSNode {
  readonly parent: PNSNode | undefined;
  readonly type: NodeType;
  readonly context: Context;
  readonly legalMoves: readonly Move[];
  children: (PNSNode | undefined)[] | undefined;
  expanded: boolean;
  proofNumber: number;
  disproofNumber: number;
  value: NodeValue;
}

export class PNSAI extends AI {
  public readonly proofGoal: ProofGoal;
  public readonly defaultIterations: number;

  /** Status after the most recent search. */
  public lastStatus: "proven" | "disproven" | "unresolved" = "unresolved";
  public lastIterations = 0;

  public constructor(options: PNSAIOptions = {}) {
    super();
    this.friendlyName = "Proof-Number Search";
    this.proofGoal = options.proofGoal ?? "prove-win";
    this.defaultIterations = options.defaultIterations ?? DEFAULT_ITERS;
  }

  public override selectAction(
    context: Context,
    options: SelectActionOptions = {},
  ): Move | undefined {
    const proofPlayer = context.mover;
    const rootMoves = context.game.moves(context);
    if (rootMoves.length === 0) return undefined;
    if (rootMoves.length === 1) {
      this.lastStatus = "unresolved";
      this.lastIterations = 0;
      return rootMoves[0];
    }

    const maxIters =
      options.maxIterations && options.maxIterations > 0
        ? options.maxIterations
        : this.defaultIterations;
    const deadlineMs =
      options.maxSeconds && options.maxSeconds > 0
        ? Date.now() + options.maxSeconds * 1000
        : Number.POSITIVE_INFINITY;

    const root = this.makeNode(undefined, context, proofPlayer);
    this.evaluate(root, proofPlayer);
    setProofAndDisproofNumbers(root);

    let iters = 0;
    let current: PNSNode = root;
    while (
      root.proofNumber !== 0 &&
      root.disproofNumber !== 0 &&
      iters < maxIters &&
      Date.now() < deadlineMs
    ) {
      const mostProving = selectMostProvingNode(current);
      this.expandNode(mostProving, proofPlayer);
      current = updateAncestors(mostProving);
      iters += 1;
    }

    this.lastIterations = iters;
    if (root.proofNumber === 0) this.lastStatus = "proven";
    else if (root.disproofNumber === 0) this.lastStatus = "disproven";
    else this.lastStatus = "unresolved";

    return this.pickRootMove(root, rootMoves);
  }

  private pickRootMove(root: PNSNode, fallback: readonly Move[]): Move {
    // Root is an OR-node when we're trying to PROVE the goal (we're
    // choosing among siblings; one proven branch suffices). For an
    // AND-node we still report some move — picking the most-proving
    // child still tends to be the right defensive choice.
    if (!root.children) return fallback[0] as Move;
    let bestIdx = 0;
    let bestScore = INF;
    for (let i = 0; i < root.children.length; i += 1) {
      const child = root.children[i];
      if (!child) continue;
      const score =
        root.type === "or" ? child.proofNumber : child.disproofNumber;
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    return root.legalMoves[bestIdx] ?? (fallback[0] as Move);
  }

  private makeNode(
    parent: PNSNode | undefined,
    context: Context,
    proofPlayer: number,
  ): PNSNode {
    const moves = context.game.moves(context);
    const isProofPlayerToMove = context.mover === proofPlayer;
    // Proof goal + side-to-move determines AND/OR. PROVE_WIN: my move →
    // OR (any winning child suffices); opponent's move → AND. PROVE_LOSS
    // flips both.
    let type: NodeType;
    if (isProofPlayerToMove) {
      type = this.proofGoal === "prove-win" ? "or" : "and";
    } else {
      type = this.proofGoal === "prove-win" ? "and" : "or";
    }
    return {
      parent,
      type,
      context,
      legalMoves: moves,
      children: moves.length > 0 ? new Array(moves.length).fill(undefined) : [],
      expanded: false,
      proofNumber: -1,
      disproofNumber: -1,
      value: "unknown",
    };
  }

  private evaluate(node: PNSNode, proofPlayer: number): void {
    const ctx = node.context;
    if (!ctx.over) {
      node.value = "unknown";
      return;
    }
    const winner = ctx.winner;
    if (winner === proofPlayer) {
      node.value = this.proofGoal === "prove-win" ? "true" : "false";
    } else if (winner === 0) {
      // Draw — neither proves nor disproves.
      node.value = "false";
    } else {
      node.value = this.proofGoal === "prove-win" ? "false" : "true";
    }
  }

  private expandNode(node: PNSNode, proofPlayer: number): void {
    if (!node.children) {
      node.expanded = true;
      return;
    }
    for (let i = 0; i < node.children.length; i += 1) {
      const move = node.legalMoves[i];
      if (!move) continue;
      const childCtx = node.context.game.apply(node.context, move);
      const child = this.makeNode(node, childCtx, proofPlayer);
      node.children[i] = child;
      this.evaluate(child, proofPlayer);
      setProofAndDisproofNumbers(child);
      // Short-circuit: if this child already proves/disproves our node,
      // stop expanding siblings (matches Java).
      if (node.type === "or" && child.proofNumber === 0) break;
      if (node.type === "and" && child.disproofNumber === 0) break;
    }
    node.expanded = true;
  }
}

function setProofAndDisproofNumbers(node: PNSNode): void {
  if (node.expanded && node.children) {
    if (node.type === "and") {
      let pn = 0;
      let dn = INF;
      for (const child of node.children) {
        if (!child) continue;
        pn = pn + child.proofNumber;
        if (child.disproofNumber < dn) dn = child.disproofNumber;
      }
      node.proofNumber = pn;
      node.disproofNumber = dn;
    } else {
      let pn = INF;
      let dn = 0;
      for (const child of node.children) {
        if (!child) continue;
        dn = dn + child.disproofNumber;
        if (child.proofNumber < pn) pn = child.proofNumber;
      }
      node.proofNumber = pn;
      node.disproofNumber = dn;
    }
    return;
  }
  // Leaf.
  switch (node.value) {
    case "false":
      node.proofNumber = INF;
      node.disproofNumber = 0;
      break;
    case "true":
      node.proofNumber = 0;
      node.disproofNumber = INF;
      break;
    default: {
      const fanout = Math.max(1, node.legalMoves.length);
      if (node.type === "and") {
        node.proofNumber = fanout;
        node.disproofNumber = 1;
      } else {
        node.proofNumber = 1;
        node.disproofNumber = fanout;
      }
      break;
    }
  }
}

function selectMostProvingNode(start: PNSNode): PNSNode {
  let current = start;
  while (current.expanded && current.children) {
    let next: PNSNode | undefined;
    if (current.type === "or") {
      for (const child of current.children) {
        if (child && child.proofNumber === current.proofNumber) {
          next = child;
          break;
        }
      }
    } else {
      for (const child of current.children) {
        if (child && child.disproofNumber === current.disproofNumber) {
          next = child;
          break;
        }
      }
    }
    if (!next) return current;
    current = next;
  }
  return current;
}

function updateAncestors(start: PNSNode): PNSNode {
  let node: PNSNode | undefined = start;
  while (node) {
    const oldProof = node.proofNumber;
    const oldDisproof = node.disproofNumber;
    setProofAndDisproofNumbers(node);
    if (node.proofNumber === oldProof && node.disproofNumber === oldDisproof) {
      return node;
    }
    if (node.proofNumber === 0 || node.disproofNumber === 0) {
      // Subtree (dis)proven — drop children to free memory.
      node.children = undefined;
    }
    if (!node.parent) return node;
    node = node.parent;
  }
  return start;
}
