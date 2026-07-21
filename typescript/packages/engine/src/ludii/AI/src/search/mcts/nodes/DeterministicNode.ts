// @java AI/src/search/mcts/nodes/DeterministicNode.java

/**
 * Abstract class for nodes for any deterministic game.
 *
 * @java search.mcts.nodes.DeterministicNode
 * @author Dennis Soemers
 */

import { FVector } from "../../../../../Common/src/main/collections/FVector.js";
import { FastArrayList } from "../../../../../Common/src/main/collections/FastArrayList.js";
import { BaseNode } from "./BaseNode.js";

// ---------------------------------------------------------------------------
// Escape-hatch types

/** @java other.context.Context */
type Context = {
  state(): { mover(): number; playerToAgent(player: number): number };
  game(): {
    players(): { count(): number };
    moves(ctx: Context): { moves(): { size(): number; toArray(arr?: Move[]): Move[] } };
    apply(ctx: Context, move: Move): void;
  };
  trial(): { over(): boolean; nullUndoData(): void; numMoves(): number; reverseMoveIterator(): Iterator<Move>; lastMove(): Move | null };
};

/** @java other.move.Move */
type Move = {
  mover(): number;
  isPass(): boolean;
  isSwap(): boolean;
  isOrientedMove(): boolean;
  toNonDecision(): number;
  fromNonDecision(): number;
  stateNonDecision(): number;
  equals(other: Move): boolean;
  then(): { clear(): void };
};

/** @java search.mcts.MCTS */
type MCTS = {
  backpropFlags(): number;
  qInit(): unknown;
  learnedSelectionPolicy(): { computeDistribution(ctx: unknown, moves: FastArrayList<Move>, thresholded: boolean): FVector } | null;
  playoutStrategy(): { computeDistribution(ctx: unknown, moves: FastArrayList<Move>, thresholded: boolean): FVector };
  copyContext(ctx: unknown): unknown;
  heuristics(): unknown;
  heuristicStats(): unknown;
  playoutValueWeight(): number;
  maxNGramLength(): number;
  getOrCreateActionStatsEntry(key: unknown): unknown;
  getOrCreateNGramActionStatsEntry(key: unknown): unknown;
};

// MCTS.NULL_UNDO_DATA constant
const NULL_UNDO_DATA = true;

// ---------------------------------------------------------------------------

/**
 * Abstract class for nodes for any deterministic game.
 *
 * @java search.mcts.nodes.DeterministicNode
 */
export abstract class DeterministicNode extends BaseNode {

  // -------------------------------------------------------------------------

  /** @java DeterministicNode.context */
  protected readonly context: Context;

  /** @java DeterministicNode.children */
  protected readonly children: (DeterministicNode | null)[];

  /** @java DeterministicNode.legalMoves */
  protected readonly legalMoves: Move[];

  /** @java DeterministicNode.cachedPolicy */
  protected cachedPolicy: FVector | null = null;

  /** @java DeterministicNode.childIndices */
  protected readonly childIndices: number[];

  /** @java DeterministicNode.numUnvisitedChildren */
  protected numUnvisitedChildren: number = -1;

  // -------------------------------------------------------------------------

  /**
   * @java DeterministicNode(MCTS, BaseNode, Move, Move, Context)
   */
  public constructor(
    mcts: MCTS,
    parent: BaseNode | null,
    parentMove: Move | null,
    parentMoveWithoutConseq: Move | null,
    context: Context,
  ) {
    super(
      mcts as unknown as ConstructorParameters<typeof BaseNode>[0],
      parent,
      parentMove,
      parentMoveWithoutConseq,
      context.game() as unknown as { players(): { count(): number } },
    );
    this.context = context;

    if (context.trial().over()) {
      // Terminal game state — empty list of actions
      this.legalMoves = [];
    } else {
      const actions = context.game().moves(context).moves();
      const arr = new Array<Move>(actions.size());
      actions.toArray(arr);
      this.legalMoves = arr;
    }

    this.children = new Array<DeterministicNode | null>(this.legalMoves.length).fill(null);
    this.childIndices = new Array<number>(this.children.length);

    for (let i = 0; i < this.childIndices.length; ++i) {
      this.childIndices[i] = i;
    }

    this.numUnvisitedChildren = this.children.length;
  }

  // -------------------------------------------------------------------------

  /** @java DeterministicNode.addChild(BaseNode, int) */
  public override addChild(child: BaseNode, moveIdx: number): void {
    this.children[moveIdx] = child as unknown as DeterministicNode;
    --this.numUnvisitedChildren;

    if (this.numUnvisitedChildren === 0 && NULL_UNDO_DATA) {
      this.context.trial().nullUndoData();
    }
  }

  /** @java DeterministicNode.childForNthLegalMove(int) */
  public override childForNthLegalMove(n: number): BaseNode | null {
    return (this.children[n] ?? null) as unknown as BaseNode | null;
  }

  /** @java DeterministicNode.contextRef() */
  public override contextRef(): null {
    // Java returns Context; cast to satisfy BaseNode's `Context | null` return type.
    // At runtime this.context is a full Context object.
    return this.context as unknown as null;
  }

  /** @java DeterministicNode.deterministicContextRef() */
  public override deterministicContextRef(): null {
    return this.context as unknown as null;
  }

  /** @java DeterministicNode.findChildForMove(Move) */
  public override findChildForMove(move: Move): BaseNode | null {
    let result: DeterministicNode | null = null;

    for (const child of this.children) {
      if (child !== null && child.parentMove !== null && child.parentMove.equals(move)) {
        result = child;
        break;
      }
    }

    return result as unknown as BaseNode | null;
  }

  /** @java DeterministicNode.movesFromNode() */
  public override movesFromNode(): FastArrayList<Move> {
    return new FastArrayList<Move>(...this.legalMoves);
  }

  /** @java DeterministicNode.nodeColour() */
  public override nodeColour(): number {
    return this.context.state().mover();
  }

  /** @java DeterministicNode.nthLegalMove(int) */
  public override nthLegalMove(n: number): Move {
    return this.legalMoves[n]!;
  }

  /** @java DeterministicNode.numLegalMoves() */
  public override numLegalMoves(): number {
    return this.children.length;
  }

  /** @java DeterministicNode.playoutContext() */
  // @ts-expect-error: DeterministicNode.Context and BaseNode.Context are structurally incompatible
  // local type aliases; at runtime both refer to the same Java Context class.
  public override playoutContext(): Context {
    // Need to copy context
    return (this.mcts as unknown as MCTS).copyContext(this.context) as unknown as Context;
  }

  /** @java DeterministicNode.rootInit(Context) */
  // @ts-expect-error: parameter Context types are structurally incompatible local aliases
  public override rootInit(_cont: Context): void {
    // Do nothing
  }

  /** @java DeterministicNode.startNewIteration(Context) */
  // @ts-expect-error: parameter Context types are structurally incompatible local aliases
  public override startNewIteration(_cont: Context): void {
    // Do nothing
  }

  /** @java DeterministicNode.sumLegalChildVisits() */
  public override sumLegalChildVisits(): number {
    // Just the number of visits of this node
    return this._numVisits;
  }

  /** @java DeterministicNode.traverse(int) */
  // @ts-expect-error: return Context types are structurally incompatible local aliases
  public override traverse(moveIdx: number): Context {
    let newContext: Context;

    if (this.children[moveIdx] === null) {
      // Need to copy context
      newContext = (this.mcts as unknown as MCTS).copyContext(this.context) as unknown as Context;
      newContext.game().apply(newContext, this.legalMoves[moveIdx]!);
    } else {
      newContext = this.children[moveIdx]!.context;
    }

    return newContext;
  }

  /** @java DeterministicNode.updateContextRef() */
  public override updateContextRef(): void {
    // Do nothing
  }

  /** @java DeterministicNode.cleanThreadLocals() */
  public override cleanThreadLocals(): void {
    // Do nothing
  }

  // -------------------------------------------------------------------------

  /**
   * @return Array of child nodes
   * @java DeterministicNode.children()
   */
  public childrenArray(): (DeterministicNode | null)[] {
    return this.children;
  }

  /**
   * @return List of legal actions for this node's state
   * @java DeterministicNode.legalActions()
   */
  public legalActions(): Move[] {
    return this.legalMoves;
  }

  // -------------------------------------------------------------------------

  /** @java DeterministicNode.learnedSelectionPolicy() */
  public override learnedSelectionPolicy(): FVector {
    if (this.cachedPolicy === null) {
      const pol = (this.mcts as unknown as MCTS).learnedSelectionPolicy();
      if (pol !== null) {
        this.cachedPolicy = pol.computeDistribution(
          this.context,
          new FastArrayList<Move>(...this.legalMoves),
          true,
        );
      } else {
        // Fallback: uniform distribution
        const n = this.legalMoves.length;
        this.cachedPolicy = new FVector(n, n > 0 ? 1.0 / n : 0.0);
      }
    }
    return this.cachedPolicy!;
  }

  // -------------------------------------------------------------------------
}
