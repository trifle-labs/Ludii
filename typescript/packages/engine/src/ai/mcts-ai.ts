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
import type { BigramStats, MoveStats } from "./move-stats.js";
import { NSTPlayout } from "./nst-playout.js";
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
  /**
   * Shared per-move stats. When supplied, MCTS records playout rewards
   * for each move played and consults the stats for Progressive History
   * (UCB selection bias). Lets a MAST playout share the same stats so
   * tree selection and rollout both benefit.
   */
  readonly moveStats?: MoveStats;
  /** Shared bigram stats; recorded only when supplied. */
  readonly bigramStats?: BigramStats;
  /**
   * Progressive History bias weight. UCB(v) += W * mean(v.move) /
   * (v.visits + 1). Java parity: ProgressiveHistory.java. Default 0.
   */
  readonly progressiveHistoryWeight?: number;
  /**
   * AlphaGo-style backprop blend. Final backpropagated reward becomes
   *   α * simReward + (1 − α) * stats.mean(node.moveFromParent).
   * Java parity: AI/src/search/mcts/backpropagation/AlphaGoBackprop.java.
   * Default 1 (pure simulation reward).
   */
  readonly alphaGoBlend?: number;
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

  public bestChild(
    c: number,
    progressiveHistoryWeight = 0,
    moveStats?: MoveStats,
  ): MCTSNode {
    let best: MCTSNode | undefined;
    let bestScore = Number.NEGATIVE_INFINITY;
    const logN = Math.log(Math.max(1, this.visits));
    for (const child of this.children) {
      const exploit = child.visits > 0 ? child.totalReward / child.visits : 0;
      const explore = c * Math.sqrt(logN / Math.max(1, child.visits));
      let bias = 0;
      if (
        progressiveHistoryWeight > 0 &&
        moveStats !== undefined &&
        child.moveFromParent !== undefined
      ) {
        bias =
          (progressiveHistoryWeight * moveStats.mean(child.moveFromParent)) /
          (child.visits + 1);
      }
      const score = exploit + explore + bias;
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
  private readonly moveStats: MoveStats | undefined;
  private readonly bigramStats: BigramStats | undefined;
  private readonly progressiveHistoryWeight: number;
  private readonly alphaGoBlend: number;
  private rng: SeededRng;

  public constructor(options: MCTSAIOptions = {}) {
    super();
    this.friendlyName = "UCT";
    this.c = options.explorationConstant ?? DEFAULT_EXPLORATION;
    this.maxPlayoutLength =
      options.maxPlayoutLength ?? DEFAULT_MAX_PLAYOUT_LENGTH;
    this.defaultIterations = options.defaultIterations ?? DEFAULT_ITERATIONS;
    this.playout = options.playout ?? new RandomPlayout();
    this.moveStats = options.moveStats;
    this.bigramStats = options.bigramStats;
    this.progressiveHistoryWeight = options.progressiveHistoryWeight ?? 0;
    this.alphaGoBlend = Math.max(0, Math.min(1, options.alphaGoBlend ?? 1));
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
    const playedMoves: Move[] = [];
    while (
      node.untried.length === 0 &&
      node.children.length > 0 &&
      !node.context.over &&
      depth < depthLimit
    ) {
      node = node.bestChild(
        this.c,
        this.progressiveHistoryWeight,
        this.moveStats,
      );
      if (node.moveFromParent !== undefined)
        playedMoves.push(node.moveFromParent);
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
      playedMoves.push(move);
      node = child;
    }

    // ---- Simulation ---------------------------------------------------
    if (this.playout instanceof NSTPlayout) this.playout.resetHistory();
    const simReward = this.simulate(node.context, playedMoves);

    // ---- Stats update -------------------------------------------------
    // Update MAST/NST tables with each move played, from that player's
    // perspective.
    if (this.moveStats !== undefined || this.bigramStats !== undefined) {
      let prevHash = 0;
      for (const move of playedMoves) {
        const reward = signedRewardFor(simReward, move.mover);
        if (this.moveStats !== undefined) this.moveStats.update(move, reward);
        if (this.bigramStats !== undefined)
          this.bigramStats.update(prevHash, move, reward);
        prevHash = move.hash();
      }
    }

    // ---- Backpropagation ----------------------------------------------
    let cursor: MCTSNode | undefined = node;
    while (cursor !== undefined) {
      cursor.visits += 1;
      const moverHere = cursor.moverAtNode;
      const signed = signedRewardFor(simReward, moverHere);
      let blended = signed;
      if (
        this.alphaGoBlend < 1 &&
        this.moveStats !== undefined &&
        cursor.moveFromParent !== undefined
      ) {
        const prior = this.moveStats.mean(cursor.moveFromParent);
        blended = this.alphaGoBlend * signed + (1 - this.alphaGoBlend) * prior;
      }
      cursor.totalReward += blended;
      cursor = cursor.parent;
    }
  }

  private simulate(context: Context, playedMoves: Move[]): SimReward {
    let cur = context;
    for (let depth = 0; depth < this.maxPlayoutLength; depth += 1) {
      if (cur.over) break;
      const m = this.playout.selectMove(cur, this.rng);
      if (m === undefined) break;
      playedMoves.push(m);
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
