// @java Core/src/game/rules/play/moves/nonDecision/effect/Deal.java

/**
 * Deals cards or dominoes to each player.
 *
 * @java game/rules/play/moves/nonDecision/effect/Deal.java
 *
 * Java: public final class Deal extends Effect
 *   - countFn: IntFunction — number to deal (default 1)
 *   - type: DealableType — Cards | Dominoes
 *   - beginWith: IntFunction | null — which player starts
 *
 * eval() dispatches to evalCards() or evalDominoes() based on type.
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import type { IntFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";

/** @java game/types/component/DealableType.java */
export type DealableType = "Cards" | "Dominoes";

/**
 * Deal effect — deals Cards or Dominoes to each player.
 *
 * @java game/rules/play/moves/nonDecision/effect/Deal.java
 */
export class Deal extends Effect {
  /** @java Deal.countFn */
  private readonly countFn: IntFunction;

  /** @java Deal.type */
  private readonly dealType: DealableType;

  /** @java Deal.beginWith — optional starting player (1-based) */
  private readonly beginWith: IntFunction | null;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Deal.java — constructor
   */
  public constructor(
    dealType: DealableType,
    countFn: IntFunction,
    beginWith: IntFunction | null = null,
    then: ThenLike | null = null,
  ) {
    super(then);
    this.dealType = dealType;
    this.countFn = countFn;
    this.beginWith = beginWith;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Deal.java — eval(Context)
   */
  public override eval(ctx: Context): Move[] {
    if (this.dealType === "Cards") return this.evalCards(ctx);
    if (this.dealType === "Dominoes") return this.evalDominoes(ctx);
    return [];
  }

  // -------------------------------------------------------------------------

  /**
   * @java Deal.evalCards(Context)
   *
   * Java lines 94-144:
   *   - Find hand containers (isHand && !isDeck && !isDice) → handIndex[]
   *   - Get deck from context.game().handDeck().get(0)
   *   - Deal count cards per player in round-robin
   */
  public evalCards(ctx: Context): Move[] {
    const ctxAny = ctx as unknown as {
      handIndices?: number[];
      deckSiteIndex?: number;
      deckStackSize?: number;
      numPlayers?: number;
      state?: { mover?: number };
    };

    // @java: handIndex = list of per-player hand site start indices
    const handIndices = ctxAny.handIndices;
    if (!handIndices || handIndices.length === 0) {
      // No hands — cannot deal
      throw new Error("not yet wired: Deal.evalCards requires handIndices on context");
    }

    const deckSiteIndex = ctxAny.deckSiteIndex ?? 0;
    const deckStackSize = ctxAny.deckStackSize ?? 0;
    const count = this.countFn.eval(ctx);
    const numPlayers = ctxAny.numPlayers ?? handIndices.length;
    const mover = ctx.state.mover;

    if (deckStackSize < count * handIndices.length) {
      throw new Error("Deal.evalCards: not enough cards in deck.");
    }

    // @java Deal.java:120 — hand index starts at beginWith or 0
    let hand = (this.beginWith === null) ? 0 : (this.beginWith.eval(ctx) - 1);
    const result: Move[] = [];
    let counter = 0;

    // @java Deal.java:122-133 — deal count * handIndices.length cards
    for (let indexCard = 0; indexCard < count * handIndices.length; indexCard++) {
      const from = deckSiteIndex;
      const to = handIndices[hand]!;
      // @java ActionMove(SiteType.Cell, deckSite, deckStackSize-1-counter, SiteType.Cell, handSite, OFF, ...)
      result.push(new Move({
        id: `deal:${mover}:${indexCard}`,
        label: `Deal(${indexCard})`,
        siteIndices: [from, to],
        mover,
        placedOwner: mover,
        actions: [new ActionMove({ from, to })],
      }));

      if (hand === numPlayers - 1) hand = 0;
      else hand++;
      counter++;
    }

    return result;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Deal.evalDominoes(Context)
   *
   * Java lines 153-213:
   *   - Randomly assign dominoes to each player hand
   *   - Each player gets `count` dominoes
   */
  public evalDominoes(_ctx: Context): Move[] {
    // Dominoes dealing requires RNG and component access not wired in TS
    throw new Error("not yet wired: Deal.evalDominoes requires component/RNG subsystem");
  }

  // -------------------------------------------------------------------------

  /** @java Deal.canMove(Context) */
  public override canMove(_ctx: Context): boolean {
    return false;
  }

  /** @java Deal.canMoveTo(Context, int) */
  public override canMoveTo(_ctx: Context, _target: number): boolean {
    return false;
  }

  /** @java Deal.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
