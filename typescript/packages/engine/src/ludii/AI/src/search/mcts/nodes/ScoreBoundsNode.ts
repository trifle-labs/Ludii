// @java AI/src/search/mcts/nodes/ScoreBoundsNode.java

/**
 * Node for MCTS tree that tracks pessimistic and optimistic score bounds, for
 * solving of nodes.
 *
 * @java search.mcts.nodes.ScoreBoundsNode
 * @author Dennis Soemers
 */

import { RankUtils } from "../../../../../../ludemes/other/RankUtils.js";
import { BaseNode } from "./BaseNode.js";
import { DeterministicNode } from "./DeterministicNode.js";

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
  active(): boolean;
  active(p: number): boolean;
  computeNextLossRank(): number;
  computeNextWinRank(): number;
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
type MCTS = ConstructorParameters<typeof DeterministicNode>[0];

// ---------------------------------------------------------------------------

/**
 * Node for MCTS tree that tracks pessimistic and optimistic score bounds.
 *
 * @java search.mcts.nodes.ScoreBoundsNode
 */
export class ScoreBoundsNode extends DeterministicNode {

  // -------------------------------------------------------------------------

  /** @java ScoreBoundsNode.pessimisticScores */
  private readonly pessimisticScores: number[];

  /** @java ScoreBoundsNode.optimisticScores */
  private readonly optimisticScores: number[];

  /**
   * True when this node is "soft" pruned.
   * @java ScoreBoundsNode.pruned
   */
  private pruned: boolean = false;

  // -------------------------------------------------------------------------

  /**
   * @java ScoreBoundsNode(MCTS, BaseNode, Move, Move, Context)
   */
  public constructor(
    mcts: MCTS,
    parent: BaseNode | null,
    parentMove: Move | null,
    parentMoveWithoutConseq: Move | null,
    context: Context,
  ) {
    super(mcts, parent, parentMove, parentMoveWithoutConseq, context as unknown as ConstructorParameters<typeof DeterministicNode>[4]);

    const numPlayers = context.game().players().count();
    this.pessimisticScores = new Array<number>(numPlayers + 1).fill(0.0);
    this.optimisticScores = new Array<number>(numPlayers + 1).fill(0.0);

    const nextWorstScore = RankUtils.rankToUtil(context.computeNextLossRank(), numPlayers);
    const nextBestScore = RankUtils.rankToUtil(context.computeNextWinRank(), numPlayers);
    const currentUtils = RankUtils.agentUtilities(context as unknown as Parameters<typeof RankUtils.agentUtilities>[0]);

    for (let p = 1; p <= numPlayers; ++p) {
      if (!context.active(p)) {
        // Proven outcome
        this.pessimisticScores[p] = currentUtils[p]!;
        this.optimisticScores[p] = currentUtils[p]!;
      } else {
        this.pessimisticScores[p] = nextWorstScore;
        this.optimisticScores[p] = nextBestScore;
      }
    }

    // Update bounds in parents
    if (parent !== null) {
      for (let p = 1; p <= numPlayers; ++p) {
        if (currentUtils[p]! !== 0.0) {
          (parent as unknown as ScoreBoundsNode).updatePessBounds(p, this.pessimisticScores[p]!, this);
          (parent as unknown as ScoreBoundsNode).updateOptBounds(p, this.optimisticScores[p]!, this);
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /** @java ScoreBoundsNode.expectedScore(int) */
  public override expectedScore(agent: number): number {
    if (this.pessimisticScores[agent] === this.optimisticScores[agent]) {
      return this.pessimisticScores[agent]!;
    }
    return super.expectedScore(agent);
  }

  /** @java ScoreBoundsNode.exploitationScore(int) */
  public override exploitationScore(agent: number): number {
    if (this.pruned && this.parent !== null) {
      const sbParent = this.parent as unknown as ScoreBoundsNode;
      if (sbParent.optBound(agent) > this.pessBound(agent)) {
        return -10_000.0;
      }
    }
    return super.exploitationScore(agent);
  }

  /** @java ScoreBoundsNode.isValueProven(int) */
  public override isValueProven(agent: number): boolean {
    return this.pessimisticScores[agent] === this.optimisticScores[agent];
  }

  // -------------------------------------------------------------------------

  /**
   * One of our children has an updated pessimistic bound for the given agent.
   * @java ScoreBoundsNode.updatePessBounds(int, double, ScoreBoundsNode)
   */
  public updatePessBounds(agent: number, pessBound: number, _fromChild: ScoreBoundsNode): void {
    const oldPess = this.pessimisticScores[agent]!;

    if (pessBound > oldPess) {
      const ctx = this.contextRef() as unknown as Context;
      const moverAgent = ctx.state().playerToAgent(ctx.state().mover());

      if (moverAgent === agent) {
        // Agent to move in this node — update directly
        this.pessimisticScores[agent] = pessBound;

        // Mark any children with an optimistic bound <= new pessimistic bound as pruned
        for (let i = 0; i < this.children.length; ++i) {
          const child = this.children[i] as ScoreBoundsNode | null;
          if (child !== null) {
            if (child.optBound(agent) <= pessBound) {
              child.markPruned();
            }
          }
        }

        if (this.parent !== null) {
          (this.parent as unknown as ScoreBoundsNode).updatePessBounds(agent, pessBound, this);
        }
      } else {
        // Take minimum pessimistic bound over all children
        let minPess = pessBound;

        for (let i = 0; i < this.children.length; ++i) {
          const child = this.children[i] as ScoreBoundsNode | null;

          if (child === null) {
            return; // Can't update if we have an unvisited child
          } else {
            const pess = child.pessBound(agent);
            if (pess < minPess) {
              if (pess === oldPess) {
                return; // Won't be able to update
              }
              minPess = pess;
            }
          }
        }

        if (minPess < oldPess) {
          console.error("ERROR in updatePessBounds()!");
          console.error("oldPess = " + oldPess);
          console.error("minPess = " + minPess);
          console.error("pessBound = " + pessBound);
        }

        this.pessimisticScores[agent] = minPess;
        if (this.parent !== null) {
          (this.parent as unknown as ScoreBoundsNode).updatePessBounds(agent, minPess, this);
        }
      }
    }
  }

  /**
   * One of our children has an updated optimistic bound for the given agent.
   * @java ScoreBoundsNode.updateOptBounds(int, double, ScoreBoundsNode)
   */
  public updateOptBounds(agent: number, optBound: number, fromChild: ScoreBoundsNode): void {
    const ctx = this.contextRef() as unknown as Context;
    const moverAgent = ctx.state().playerToAgent(ctx.state().mover());
    if (moverAgent === agent) {
      if (optBound <= this.pessimisticScores[agent]!) {
        fromChild.markPruned();
      }
    }

    const oldOpt = this.optimisticScores[agent]!;

    if (optBound < oldOpt) {
      // Always take maximum optimistic bound over all children
      let maxOpt = optBound;

      for (let i = 0; i < this.children.length; ++i) {
        const child = this.children[i] as ScoreBoundsNode | null;

        if (child === null) {
          return; // Can't update if we have an unvisited child
        } else {
          const opt = child.optBound(agent);
          if (opt > maxOpt) {
            if (opt === oldOpt) {
              return; // Won't be able to update
            }
            maxOpt = opt;
          }
        }
      }

      if (maxOpt > oldOpt) {
        console.error("ERROR in updateOptBounds()!");
      }

      this.optimisticScores[agent] = maxOpt;
      if (this.parent !== null) {
        (this.parent as unknown as ScoreBoundsNode).updateOptBounds(agent, maxOpt, this);
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @param agent
   * @return Current pessimistic bound for given agent
   * @java ScoreBoundsNode.pessBound(int)
   */
  public pessBound(agent: number): number {
    return this.pessimisticScores[agent]!;
  }

  /**
   * @param agent
   * @return Current optimistic bound for given agent
   * @java ScoreBoundsNode.optBound(int)
   */
  public optBound(agent: number): number {
    return this.optimisticScores[agent]!;
  }

  /**
   * Mark this node as being "pruned".
   * @java ScoreBoundsNode.markPruned()
   */
  public markPruned(): void {
    this.pruned = true;
  }

  /**
   * @return Did this node get marked as "pruned"?
   * @java ScoreBoundsNode.isPruned()
   */
  public isPruned(): boolean {
    return this.pruned;
  }

  // -------------------------------------------------------------------------
}
