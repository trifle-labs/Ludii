// @java AI/src/search/pns/ProofNumberSearch.java

/**
 * Proof-number search.
 *
 * @java search/pns/ProofNumberSearch.java
 * @author Dennis Soemers
 */

import {
  PNSNode,
  PNSNodeTypes,
  PNSNodeValues,
  ProofGoals,
} from "./PNSNode.js";
import type { Context as PNSContext, Move } from "./PNSNode.js";

// Re-export ProofGoals so callers can import from either file
export { ProofGoals } from "./PNSNode.js";
export type { Move } from "./PNSNode.js";

//-------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** @java game.Game */
export interface Game {
  players(): { count(): number };
  isStochasticGame(): boolean;
  isAlternatingMoveGame(): boolean;
  hiddenInformation(): boolean;
  moves(ctx: unknown): { moves(): { size(): number; get(i: number): Move } };
  apply(ctx: unknown, move: Move): void;
}

/** @java other.context.Context (extended for ProofNumberSearch) */
export interface ProofContext {
  state(): { mover(): number };
  trial(): { over(): boolean; ranking(): number[] };
  game(): {
    moves(ctx: ProofContext): { moves(): { size(): number; get(i: number): Move } };
    apply(ctx: ProofContext, move: Move): void;
  };
  computeNextWinRank(): number;
  computeNextLossRank(): number;
}

//-------------------------------------------------------------------------

/** @java other.AI base */
abstract class AIBase {
  public friendlyName: string = "";

  public initAI(_game: unknown, _playerID: number): void { /* base */ }
  public closeAI(): void { /* base */ }
  public supportsGame(_game: unknown): boolean { return true; }

  /** @java AI.copyContext(Context) */
  protected copyContext(context: ProofContext): ProofContext {
    return (
      context as unknown as { _copyContext(): ProofContext }
    )._copyContext?.() ?? context;
  }

  public abstract selectAction(
    game: unknown,
    context: unknown,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): import("./PNSNode.js").Move | null;
}

//-------------------------------------------------------------------------

/**
 * Proof-number search.
 *
 * @java search.pns.ProofNumberSearch
 */
export class ProofNumberSearch extends AIBase {

  //-------------------------------------------------------------------------

  /** Our proof goal
   * @java ProofNumberSearch.proofGoal */
  protected readonly proofGoal: ProofGoals;

  /** The player for which we aim to prove either a win or a loss
   * @java ProofNumberSearch.proofPlayer */
  protected proofPlayer: number = -1;

  /** The best possible rank we can get from the root state we're searching for
   * @java ProofNumberSearch.bestPossibleRank */
  protected bestPossibleRank: number = -1.0;

  /** The worst possible rank we can get from the root state we're searching for
   * @java ProofNumberSearch.worstPossibleRank */
  protected worstPossibleRank: number = -1.0;

  //-------------------------------------------------------------------------

  /**
   * Constructor (no args — defaults to PROVE_WIN)
   * @java ProofNumberSearch()
   * @java ProofNumberSearch(ProofGoals)
   */
  public constructor(proofGoal: ProofGoals = ProofGoals.PROVE_WIN) {
    super();
    this.proofGoal = proofGoal;
    this.friendlyName = "Proof-Number Search";
  }

  //-------------------------------------------------------------------------

  /**
   * @java ProofNumberSearch.selectAction(Game, Context, double, int, int)
   */
  public override selectAction(
    game: Game,
    context: ProofContext,
    _maxSeconds: number,
    _maxIterations: number,
    _maxDepth: number
  ): import("./PNSNode.js").Move | null {
    this.bestPossibleRank = context.computeNextWinRank();
    this.worstPossibleRank = context.computeNextLossRank();

    if (this.proofPlayer !== context.state().mover()) {
      console.error(
        "Warning: Current mover = " +
        context.state().mover() +
        ", but proof player = " +
        this.proofPlayer + "!"
      );
    }

    const root = new PNSNode(
      null, this.copyContext(context) as unknown as import("./PNSNode.js").Context,
      this.proofGoal, this.proofPlayer
    );
    this.evaluate(root);
    ProofNumberSearch.setProofAndDisproofNumbers(root);

    let currentNode: PNSNode = root;

    while (root.proofNumber() !== 0 && root.disproofNumber() !== 0) {
      const mostProvingNode = ProofNumberSearch.selectMostProvingNode(currentNode);
      this.expandNode(mostProvingNode);
      currentNode = ProofNumberSearch.updateAncestors(mostProvingNode);
    }

    if (this.proofGoal === ProofGoals.PROVE_WIN) {
      if (root.proofNumber() === 0)
        console.log("Proved a win!");
      else
        console.log("Disproved a win!");
    } else {
      if (root.proofNumber() === 0)
        console.log("Proved a loss!");
      else
        console.log("Disproved a loss!");
    }

    return root.legalMoves[Math.trunc(Math.random() * root.legalMoves.length)] ?? null;
  }

  //-------------------------------------------------------------------------

  /**
   * Evaluates the given node
   * @param node
   * @java ProofNumberSearch.evaluate(PNSNode)
   */
  private evaluate(node: PNSNode): void {
    const context = node.context() as unknown as ProofContext;

    if (context.trial().over()) {
      const rank: number = context.trial().ranking()[this.proofPlayer] ?? 0;

      if (rank === this.bestPossibleRank) {
        if (this.proofGoal === ProofGoals.PROVE_WIN)
          node.setValue(PNSNodeValues.TRUE);
        else
          node.setValue(PNSNodeValues.FALSE);
      } else if (rank === this.worstPossibleRank) {
        if (this.proofGoal === ProofGoals.PROVE_WIN)
          node.setValue(PNSNodeValues.FALSE);
        else
          node.setValue(PNSNodeValues.TRUE);
      } else {
        node.setValue(PNSNodeValues.FALSE);
      }
    } else {
      node.setValue(PNSNodeValues.UNKNOWN);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Sets proof and disproof numbers for given node
   * @param node
   * @java ProofNumberSearch.setProofAndDisproofNumbers(PNSNode)
   */
  private static setProofAndDisproofNumbers(node: PNSNode): void {
    const INT_MAX = Number.MAX_SAFE_INTEGER;

    if (node.isExpanded()) { // internal node
      if (node.nodeType() === PNSNodeTypes.AND_NODE) {
        node.setProofNumber(0);
        node.setDisproofNumber(INT_MAX);

        for (const child of node.children()) {
          if (child === null) continue;
          if (node.proofNumber() === INT_MAX || child.proofNumber() === INT_MAX)
            node.setProofNumber(INT_MAX);
          else
            node.setProofNumber(node.proofNumber() + child.proofNumber());

          if (child.disproofNumber() < node.disproofNumber())
            node.setDisproofNumber(child.disproofNumber());
        }
      } else { // OR node
        node.setProofNumber(INT_MAX);
        node.setDisproofNumber(0);

        for (const child of node.children()) {
          if (child === null) continue;
          if (node.disproofNumber() === INT_MAX || child.disproofNumber() === INT_MAX)
            node.setDisproofNumber(INT_MAX);
          else
            node.setDisproofNumber(node.disproofNumber() + child.disproofNumber());

          if (child.proofNumber() < node.proofNumber())
            node.setProofNumber(child.proofNumber());
        }
      }
    } else { // leaf node
      switch (node.value()) {
        case PNSNodeValues.FALSE:
          node.setProofNumber(INT_MAX);
          node.setDisproofNumber(0);
          break;
        case PNSNodeValues.TRUE:
          node.setProofNumber(0);
          node.setDisproofNumber(INT_MAX);
          break;
        case PNSNodeValues.UNKNOWN:
          // Init as described in 7.1 of
          // "GAME-TREE SEARCH USING PROOF NUMBERS: THE FIRST TWENTY YEARS"
          if (node.nodeType() === PNSNodeTypes.AND_NODE) {
            node.setProofNumber(Math.max(1, node.legalMoves.length));
            node.setDisproofNumber(1);
          } else { // OR node
            node.setProofNumber(1);
            node.setDisproofNumber(Math.max(1, node.legalMoves.length));
          }
          break;
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @param inCurrentNode
   * @return Most proving node in subtree rooted in given current node
   * @java ProofNumberSearch.selectMostProvingNode(PNSNode)
   */
  private static selectMostProvingNode(inCurrentNode: PNSNode): PNSNode {
    let current: PNSNode = inCurrentNode;

    while (current.isExpanded()) {
      const children = current.children();
      let nextIdx = 0;
      let next: PNSNode | null = children[nextIdx] ?? null;

      if (current.nodeType() === PNSNodeTypes.OR_NODE) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (next !== null) {
            if (next.proofNumber() === current.proofNumber())
              break;
          }

          ++nextIdx;
          if (nextIdx < children.length)
            next = children[nextIdx] ?? null;
          else
            break;
        }
      } else { // AND node
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (next !== null) {
            if (next.disproofNumber() === current.disproofNumber())
              break;
          }

          ++nextIdx;
          if (nextIdx < children.length)
            next = children[nextIdx] ?? null;
          else
            break;
        }
      }

      current = next!;
    }

    return current;
  }

  //-------------------------------------------------------------------------

  /**
   * Expands the given node
   * @param node
   * @java ProofNumberSearch.expandNode(PNSNode)
   */
  private expandNode(node: PNSNode): void {
    const children = node.children();

    for (let i = 0; i < children.length; ++i) {
      // Create new context clone (Context.copy() — escape hatch)
      const nodeCtx = node.context();
      const newContext = (
        nodeCtx as unknown as { _copy(): typeof nodeCtx }
      )._copy?.() ?? nodeCtx;

      newContext.game().apply(newContext, node.legalMoves[i] as Move);
      const child = new PNSNode(node, newContext, this.proofGoal, this.proofPlayer);
      children[i] = child;

      this.evaluate(child);
      ProofNumberSearch.setProofAndDisproofNumbers(child);

      if (
        (node.nodeType() === PNSNodeTypes.OR_NODE && child.proofNumber() === 0) ||
        (node.nodeType() === PNSNodeTypes.AND_NODE && child.disproofNumber() === 0)
      ) {
        break;
      }
    }

    node.setExpanded(true);
  }

  //-------------------------------------------------------------------------

  /**
   * Updates proof and disproof numbers for all ancestors of given node
   * @param inNode
   * @return Node from which to search for next most proving node
   * @java ProofNumberSearch.updateAncestors(PNSNode)
   */
  private static updateAncestors(inNode: PNSNode): PNSNode {
    let node: PNSNode = inNode;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const oldProof = node.proofNumber();
      const oldDisproof = node.disproofNumber();

      ProofNumberSearch.setProofAndDisproofNumbers(node);

      if (node.proofNumber() === oldProof && node.disproofNumber() === oldDisproof) {
        // No change on the path
        return node;
      }

      // Delete (dis)proved subtrees
      if (node.proofNumber() === 0 || node.disproofNumber() === 0)
        node.deleteSubtree();

      if (node.parent === null)
        return node;

      node = node.parent;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java ProofNumberSearch.initAI(Game, int)
   */
  public override initAI(_game: unknown, playerID: number): void {
    this.proofPlayer = playerID;
  }

  /** @java ProofNumberSearch.supportsGame(Game) */
  public override supportsGame(game: Game): boolean {
    if (game.players().count() !== 2)
      return false;

    if (game.isStochasticGame())
      return false;

    if (game.hiddenInformation())
      return false;

    return game.isAlternatingMoveGame();
  }

  //-------------------------------------------------------------------------
}
