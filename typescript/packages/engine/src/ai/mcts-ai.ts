/**
 * Java parity: AI/src/search/mcts/MCTS.java (selection/expansion/simulation/
 * backpropagation skeleton) — a self-contained UCT MCTS for the TS
 * engine surface. The TS version trades the Java surface's pluggability
 * (multiple selection/playout/backprop classes) for a single, focused
 * UCT implementation that matches the engine's deterministic, immutable
 * Game/Context model.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import { SeededRng } from "../rng.js";
import { AI, type SelectActionOptions } from "./ai.js";
import { scoreForPlayer } from "./flat-monte-carlo-ai.js";
import { type PlayoutStrategy, RandomPlayout } from "./playout.js";

export interface MCTSAIOptions {
  /** UCB exploration constant. √2 ≈ 1.414 is a good default for [-1, +1] rewards. */
  readonly explorationConstant?: number;
  /** Hard cap on playout length. */
  readonly maxPlayoutLength?: number;
  /** Iterations when neither maxSeconds nor maxIterations is supplied. */
  readonly defaultIterations?: number;
  /** Playout strategy. Defaults to uniform-random. */
  readonly playout?: PlayoutStrategy;
  /** RNG seed. */
  readonly seed?: number;
}

const DEFAULT_EXPLORATION = Math.SQRT2;
const DEFAULT_MAX_PLAYOUT_LENGTH = 256;
const DEFAULT_ITERATIONS = 1024;

class MCTSNode {
  public visits = 0;
  public totalReward = 0;
  /** Moves not yet expanded into a child. */
  public untried: Move[];
  public readonly children: MCTSNode[] = [];
  /** The move played to reach this node from its parent. */
  public readonly moveFromParent: Move | undefined;
  public readonly parent: MCTSNode | undefined;
  public readonly context: Context;
  /** The mover whose perspective `totalReward` is recorded from. */
  public readonly moverAtNode: number;

  public constructor(context: Context, parent?: MCTSNode, move?: Move) {
    this.context = context;
    this.parent = parent;
    this.moveFromParent = move;
    this.moverAtNode = context.mover;
    this.untried = [...context.game.moves(context)];
  }

  public isLeaf(): boolean {
    return this.untried.length > 0 || this.children.length === 0;
  }

  public bestChild(c: number): MCTSNode {
    let best: MCTSNode | undefined;
    let bestScore = Number.NEGATIVE_INFINITY;
    const logN = Math.log(Math.max(1, this.visits));
    for (const child of this.children) {
      const exploit = child.visits > 0 ? child.totalReward / child.visits : 0;
      const explore = c * Math.sqrt(logN / Math.max(1, child.visits));
      const score = exploit + explore;
      if (score > bestScore) {
        bestScore = score;
        best = child;
      }
    }
    return best ?? this;
  }

  public mostVisitedChild(): MCTSNode | undefined {
    let best: MCTSNode | undefined;
    let bestVisits = -1;
    for (const child of this.children) {
      if (child.visits > bestVisits) {
        bestVisits = child.visits;
        best = child;
      }
    }
    return best;
  }
}

export class MCTSAI extends AI {
  private readonly c: number;
  private readonly maxPlayoutLength: number;
  private readonly defaultIterations: number;
  private readonly playout: PlayoutStrategy;
  private rng: SeededRng;

  public constructor(options: MCTSAIOptions = {}) {
    super();
    this.friendlyName = "UCT";
    this.c = options.explorationConstant ?? DEFAULT_EXPLORATION;
    this.maxPlayoutLength =
      options.maxPlayoutLength ?? DEFAULT_MAX_PLAYOUT_LENGTH;
    this.defaultIterations = options.defaultIterations ?? DEFAULT_ITERATIONS;
    this.playout = options.playout ?? new RandomPlayout();
    this.rng = new SeededRng(options.seed ?? 0xb16b00b5);
  }

  public override selectAction(
    context: Context,
    options: SelectActionOptions = {},
  ): Move | undefined {
    const rootMoves = context.game.moves(context);
    if (rootMoves.length === 0) return undefined;
    if (rootMoves.length === 1) return rootMoves[0];

    const root = new MCTSNode(context);
    const start = Date.now();
    const deadlineMs =
      options.maxSeconds && options.maxSeconds > 0
        ? options.maxSeconds * 1000
        : Number.POSITIVE_INFINITY;
    const iterLimit =
      options.maxIterations !== undefined && options.maxIterations >= 0
        ? options.maxIterations
        : deadlineMs === Number.POSITIVE_INFINITY
          ? this.defaultIterations
          : Number.POSITIVE_INFINITY;
    const depthLimit =
      options.maxDepth !== undefined && options.maxDepth >= 0
        ? options.maxDepth
        : Number.POSITIVE_INFINITY;

    for (let i = 0; i < iterLimit; i += 1) {
      if (Date.now() - start > deadlineMs) break;
      this.iterate(root, depthLimit);
    }

    const best = root.mostVisitedChild();
    return best?.moveFromParent ?? rootMoves[0];
  }

  private iterate(root: MCTSNode, depthLimit: number): void {
    // ---- Selection ----------------------------------------------------
    let node = root;
    let depth = 0;
    while (
      node.untried.length === 0 &&
      node.children.length > 0 &&
      !node.context.over &&
      depth < depthLimit
    ) {
      node = node.bestChild(this.c);
      depth += 1;
    }

    // ---- Expansion ----------------------------------------------------
    if (!node.context.over && node.untried.length > 0 && depth < depthLimit) {
      const idx = this.rng.nextInt(node.untried.length);
      const move = node.untried[idx] as Move;
      node.untried.splice(idx, 1);
      const childCtx = node.context.game.apply(node.context, move);
      const child = new MCTSNode(childCtx, node, move);
      node.children.push(child);
      node = child;
    }

    // ---- Simulation ---------------------------------------------------
    const simReward = this.simulate(node.context);

    // ---- Backpropagation ----------------------------------------------
    let cursor: MCTSNode | undefined = node;
    while (cursor !== undefined) {
      cursor.visits += 1;
      // Each node's `totalReward` is from `moverAtNode`'s perspective —
      // i.e. the player about to move at that node. The simulation
      // gives us the rollout's outcome for each player; convert by
      // signing the reward by parity of the mover.
      const moverHere = cursor.moverAtNode;
      cursor.totalReward += signedRewardFor(simReward, moverHere);
      cursor = cursor.parent;
    }
  }

  private simulate(context: Context): SimReward {
    let cur = context;
    for (let depth = 0; depth < this.maxPlayoutLength; depth += 1) {
      if (cur.over) break;
      const m = this.playout.selectMove(cur, this.rng);
      if (m === undefined) break;
      cur = cur.game.apply(cur, m);
    }
    // Return a per-player reward map (for 2-player games we just need
    // the winner; encode as winner-or-draw).
    if (!cur.over) {
      return { winner: 0, draw: true };
    }
    return { winner: cur.winner, draw: cur.winner === 0 };
  }
}

interface SimReward {
  readonly winner: number;
  readonly draw: boolean;
}

function signedRewardFor(reward: SimReward, player: number): number {
  if (reward.draw) return 0;
  return reward.winner === player ? 1 : -1;
}

export { scoreForPlayer };
