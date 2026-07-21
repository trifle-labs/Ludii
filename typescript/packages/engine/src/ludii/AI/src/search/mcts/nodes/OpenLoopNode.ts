// @java AI/src/search/mcts/nodes/OpenLoopNode.java

/**
 * Node class for Open-Loop implementations of MCTS.
 * This is primarily intended for nondeterministic games.
 *
 * @java search.mcts.nodes.OpenLoopNode
 * @author Dennis Soemers
 */

import { FVector } from "../../../../../Common/src/main/collections/FVector.js";
import { FastArrayList } from "../../../../../Common/src/main/collections/FastArrayList.js";
import { BaseNode } from "./BaseNode.js";

// ---------------------------------------------------------------------------
// Escape-hatch types

/** @java game.Game */
type Game = {
  players(): { count(): number };
};

/** @java other.context.Context */
type Context = {
  state(): { mover(): number; playerToAgent(player: number): number };
  game(): {
    players(): { count(): number };
    moves(ctx: Context): { moves(): FastArrayList<Move> };
    apply(ctx: Context, move: Move): void;
  };
  trial(): { over(): boolean; numMoves(): number; reverseMoveIterator(): Iterator<Move>; lastMove(): Move | null };
  active(): boolean;
  active(p: number): boolean;
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

/** @java policies.softmax.SoftmaxPolicy */
type SoftmaxPolicy = object;

/** @java policies.Policy — learnedSelectionPolicy return type */
type LearnedSelectionPolicy = {
  computeDistribution(ctx: Context, moves: FastArrayList<Move>, thresholded: boolean): FVector;
  /** @java Policy.computeLogit(Context, Move) */
  computeLogit(ctx: Context, move: Move): number;
  __isSoftmaxPolicy?: boolean;
};

/** @java search.mcts.MCTS */
type MCTS = {
  backpropFlags(): number;
  qInit(): unknown;
  learnedSelectionPolicy(): LearnedSelectionPolicy | null;
  playoutStrategy(): {
    computeDistribution(ctx: Context, moves: FastArrayList<Move>, thresholded: boolean): FVector;
  };
  copyContext(ctx: Context): Context;
  heuristics(): unknown;
  heuristicStats(): unknown;
  playoutValueWeight(): number;
  maxNGramLength(): number;
  getOrCreateActionStatsEntry(key: unknown): unknown;
  getOrCreateNGramActionStatsEntry(key: unknown): unknown;
};

// ---------------------------------------------------------------------------

/**
 * Node class for Open-Loop implementations of MCTS.
 *
 * @java search.mcts.nodes.OpenLoopNode
 */
export class OpenLoopNode extends BaseNode {

  // -------------------------------------------------------------------------

  /** @java OpenLoopNode.children */
  protected readonly children: OpenLoopNode[] = [];

  /**
   * Context object for current iteration.
   * Java uses ThreadLocal — JS is single-threaded, so we use a plain field.
   * @java OpenLoopNode.currentItContext
   */
  protected currentItContext: Context | null = null;

  /**
   * Root nodes will keep a deterministic context reference.
   * @java OpenLoopNode.deterministicContext
   */
  protected deterministicContext: Context | null = null;

  /**
   * For the root, we no longer need thread-local current-legal move lists.
   * @java OpenLoopNode.rootLegalMovesList
   */
  protected rootLegalMovesList: FastArrayList<Move> | null = null;

  /**
   * Current list of legal moves.
   * @java OpenLoopNode.currentLegalMoves
   */
  protected currentLegalMoves: FastArrayList<Move> | null = null;

  /**
   * Distribution over legal moves in current iteration, as computed by
   * learned Selection policy.
   * @java OpenLoopNode.learnedSelectionPolicy (ThreadLocal)
   */
  protected _learnedSelectionPolicy: FVector | null = null;

  /**
   * Learned selection policy for root node (not thread-local).
   * @java OpenLoopNode.rootLearnedSelectionPolicy
   */
  protected rootLearnedSelectionPolicy: FVector | null = null;

  /**
   * Mapping from move index to child node (thread-local in Java).
   * @java OpenLoopNode.moveIdxToNode
   */
  protected moveIdxToNode: (OpenLoopNode | null)[] | null = null;

  /**
   * Mapping from move index to child node for root.
   * @java OpenLoopNode.rootMoveIdxToNode
   */
  protected rootMoveIdxToNode: (OpenLoopNode | null)[] | null = null;

  /**
   * Cached logit computed according to learned selection policy.
   * Java uses ThreadLocal<Float> initialised to NaN.
   * @java OpenLoopNode.logit
   */
  protected logit: number = NaN;

  // -------------------------------------------------------------------------

  /**
   * @java OpenLoopNode(MCTS, BaseNode, Move, Move, Game)
   */
  public constructor(
    mcts: MCTS,
    parent: BaseNode | null,
    parentMove: Move | null,
    parentMoveWithoutConseq: Move | null,
    game: Game,
  ) {
    super(
      // OpenLoopNode's MCTS / Game types are local aliases; cast to BaseNode's expected types.
      mcts as unknown as ConstructorParameters<typeof BaseNode>[0],
      parent,
      parentMove,
      parentMoveWithoutConseq,
      game as unknown as ConstructorParameters<typeof BaseNode>[4],
    );
  }

  // -------------------------------------------------------------------------

  /** @java OpenLoopNode.addChild(BaseNode, int) */
  public override addChild(child: BaseNode, _moveIdx: number): void {
    this.children.push(child as OpenLoopNode);

    if (this.parentNode() === null && this.deterministicContext !== null) {
      this.updateLegalMoveDependencies(true);
    }
  }

  /** @java OpenLoopNode.childForNthLegalMove(int) */
  public override childForNthLegalMove(n: number): OpenLoopNode | null {
    if (this.rootMoveIdxToNode !== null) {
      return this.rootMoveIdxToNode[n] ?? null;
    }
    return (this.moveIdxToNode?.[n]) ?? null;
  }

  /** @java OpenLoopNode.contextRef() */
  public override contextRef(): Context | null {
    return this.currentItContext;
  }

  /** @java OpenLoopNode.deterministicContextRef() */
  public override deterministicContextRef(): Context | null {
    return this.deterministicContext;
  }

  /** @java OpenLoopNode.findChildForMove(Move) */
  public override findChildForMove(move: Move): OpenLoopNode | null {
    let result: OpenLoopNode | null = null;

    for (const child of this.children) {
      if (child.parentMoveWithoutConseq !== null && move.equals(child.parentMoveWithoutConseq)) {
        result = child;
        break;
      }
    }

    return result;
  }

  /** @java OpenLoopNode.learnedSelectionPolicy() */
  public override learnedSelectionPolicy(): FVector {
    if (this.rootLearnedSelectionPolicy !== null) {
      return this.rootLearnedSelectionPolicy;
    }
    // Fallback: uniform over current legal moves
    if (this._learnedSelectionPolicy !== null) {
      return this._learnedSelectionPolicy;
    }
    const n = this.numLegalMoves();
    return new FVector(n, n > 0 ? 1.0 / n : 0.0);
  }

  /** @java OpenLoopNode.movesFromNode() */
  public override movesFromNode(): FastArrayList<Move> {
    if (this.rootLegalMovesList !== null) {
      return this.rootLegalMovesList;
    }
    return this.currentLegalMoves ?? new FastArrayList<Move>(0);
  }

  /** @java OpenLoopNode.nodeColour() */
  public override nodeColour(): number {
    return 0; // could be anyone
  }

  /** @java OpenLoopNode.nthLegalMove(int) */
  public override nthLegalMove(n: number): Move {
    return this.movesFromNode().get(n)!;
  }

  /** @java OpenLoopNode.numLegalMoves() */
  public override numLegalMoves(): number {
    return this.movesFromNode().size();
  }

  /** @java OpenLoopNode.playoutContext() */
  public override playoutContext(): Context {
    // Don't need to copy context
    return this.currentItContext!;
  }

  /** @java OpenLoopNode.rootInit(Context) */
  public override rootInit(context: Context): void {
    this.deterministicContext = context;
    this.currentItContext = this.mcts.copyContext(context as unknown as Parameters<typeof this.mcts.copyContext>[0]) as unknown as Context;
    this.updateLegalMoveDependencies(true);
  }

  /** @java OpenLoopNode.startNewIteration(Context) */
  public override startNewIteration(context: Context): void {
    // Make a copy of given context
    this.currentItContext = this.mcts.copyContext(context as unknown as Parameters<typeof this.mcts.copyContext>[0]) as unknown as Context;
  }

  /** @java OpenLoopNode.sumLegalChildVisits() */
  public override sumLegalChildVisits(): number {
    // Collect visits of children that are currently legal
    let sum = 0;

    for (let i = 0; i < this.numLegalMoves(); ++i) {
      const child = this.childForNthLegalMove(i);
      if (child !== null) {
        sum += child.numVisits();
      }
    }

    return sum;
  }

  /** @java OpenLoopNode.traverse(int) */
  public override traverse(moveIdx: number): Context {
    // No need to copy current context, just modify it
    const context = this.currentItContext!;
    context.game().apply(context, this.movesFromNode().get(moveIdx)!);
    return context;
  }

  /** @java OpenLoopNode.updateContextRef() */
  public override updateContextRef(): void {
    if (this.parent !== null) {
      // Take the same reference as our parent node
      this.currentItContext = this.parent.contextRef() as Context | null;

      // Update computations based on legal moves
      this.updateLegalMoveDependencies(false);
    }
  }

  /** @java OpenLoopNode.cleanThreadLocals() */
  public override cleanThreadLocals(): void {
    this.currentItContext = null;
    this.currentLegalMoves = null;
    this._learnedSelectionPolicy = null;
    this.moveIdxToNode = null;
    this.logit = NaN;

    this.getLock().lock();
    try {
      for (const child of this.children) {
        child.cleanThreadLocals();
      }
    } finally {
      this.getLock().unlock();
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Update any internal data that depends on the list of legal moves
   * in the current Context reference.
   * @param root Whether this node is (or just turned into) a root node
   * @java OpenLoopNode.updateLegalMoveDependencies(boolean)
   */
  private updateLegalMoveDependencies(root: boolean): void {
    this.getLock().lock();
    try {
      const context = root ? this.deterministicContext! : this.currentItContext!;
      let legalMoves: FastArrayList<Move>;

      if (root) {
        this.rootLegalMovesList = new FastArrayList<Move>(context.game().moves(context).moves());
        this.currentLegalMoves = null;
        legalMoves = this.rootLegalMovesList;
      } else {
        legalMoves = new FastArrayList<Move>(context.game().moves(context).moves());
        this.currentLegalMoves = legalMoves;
      }

      if (root) {
        // Remove children with moves that are not legal
        for (let i = this.children.length - 1; i >= 0; --i) {
          const child = this.children[i]!;
          if (child.parentMoveWithoutConseq === null || !legalMoves.contains(child.parentMoveWithoutConseq)) {
            this.children.splice(i, 1);
            child.cleanThreadLocals();
          }
        }
      }

      // Update mapping from legal move index to child node
      const mapping: (OpenLoopNode | null)[] = new Array<OpenLoopNode | null>(legalMoves.size()).fill(null);

      if (root) {
        this.rootMoveIdxToNode = mapping;
        this.moveIdxToNode = null;
      } else {
        this.moveIdxToNode = mapping;
      }

      for (let i = 0; i < mapping.length; ++i) {
        const move = legalMoves.get(i)!;

        for (let j = 0; j < this.children.length; ++j) {
          const child = this.children[j]!;
          if (child.parentMoveWithoutConseq !== null && move.equals(child.parentMoveWithoutConseq)) {
            mapping[i] = child;
            break;
          }
        }
      }

      // Update learned policy distribution
      // Cast to LearnedSelectionPolicy which includes computeLogit (Java's Policy abstract method)
      const learnedPol = this.mcts.learnedSelectionPolicy() as LearnedSelectionPolicy | null;
      if (learnedPol !== null) {
        const logits = new Float32Array(mapping.length);

        for (let i = 0; i < logits.length; ++i) {
          // mapping is (OpenLoopNode | null)[] — Java guarantees index i is always present
          const mapped = mapping[i]!; // non-null assertion: array was sized to logits.length
          if (mapped !== null && !isNaN(mapped.logit)) {
            logits[i] = mapped.logit;
          } else {
            logits[i] = learnedPol.computeLogit(context, legalMoves.get(i)!);

            if (mapped !== null) {
              mapped.logit = logits[i]!;
            }
          }
        }

        const dist = FVector.wrap(logits);

        // Check if it's a SoftmaxPolicy by duck-typing
        if ((learnedPol as unknown as { __isSoftmaxPolicy?: boolean }).__isSoftmaxPolicy === true) {
          dist.softmax();
        } else {
          dist.normalise();
        }

        if (root) {
          this.rootLearnedSelectionPolicy = dist;
          this._learnedSelectionPolicy = null;
        } else {
          this._learnedSelectionPolicy = dist;
        }
      }
    } finally {
      this.getLock().unlock();
    }
  }

  // -------------------------------------------------------------------------
}
