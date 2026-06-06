// @java Core/src/game/rules/play/moves/nonDecision/effect/Trigger.java
/**
 * Sets the 'triggered' value for a player for a specific event.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/Trigger.java
 *
 * @remarks Emits a single Move carrying ActionTrigger(event, player).
 *          The event name is cosmetic; Java's `(is Triggered …)` only tests
 *          the player's bit.
 */

import type { Context } from "../../../../../../../context.js";
import type { IntFunction, MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import type { Then } from "./Then.js";
import { ActionTrigger } from "../../../../../../../action/action-trigger.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

export class Trigger implements MovesFunction {
  /** @java Trigger.playerFunction — index of the player to trigger */
  private readonly playerFunction: IntFunction;

  /** @java Trigger.event — event name (cosmetic) */
  private readonly event: string;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Trigger.java — constructor
   *
   * Exactly one of (indexPlayer / role) must be non-null.
   *
   * @param event        The event name (cosmetic; used only for display)
   * @param indexPlayer  Direct IntFunction for the player index [null if role is used]
   * @param role         Role string for the player [null if indexPlayer is used]
   * @param thenClause   Subsequent moves [null]
   */
  public constructor(
    event: string,
    indexPlayer: IntFunction | null,
    role: string | null,
    thenClause: Then | null = null,
  ) {
    // @java Trigger.java:54-61 — @Or validation
    const numNonNull = (indexPlayer !== null ? 1 : 0) + (role !== null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("Trigger(): Exactly one Or parameter must be non-null.");
    }

    // @java Trigger.java:63-66 — playerFunction assignment
    if (indexPlayer !== null) {
      this.playerFunction = indexPlayer;
    } else {
      this.playerFunction = roleToIntFunction(role!);
    }

    this.event = event;
    this.thenClause = thenClause;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Trigger.java — eval(Context)
   *
   * Evaluates the player function to get the victim player index, then
   * emits one Move with ActionTrigger(event, victim).
   */
  public eval(ctx: Context): Move[] {
    // @java Trigger.java:75 — final int victim = playerFunction.eval(context)
    const victim = this.playerFunction.eval(ctx);
    const mover = ctx.state.mover;

    // @java Trigger.java:78 — moves.moves().add(new Move(new ActionTrigger(event, victim)))
    const action = new ActionTrigger(this.event, victim);

    const move = new LudiiMove({
      id: `trigger:${mover}:${victim}:${this.event}`,
      label: `Trigger(${this.event},P${victim})`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [action],
    });

    // @java Trigger.java — no then-clause handling in eval (BaseMoves carries it)
    // but for completeness mirror the pattern used by sibling effects:
    if (this.thenClause !== null) {
      const thenMoves = this.thenClause.eval(ctx);
      const thenActions = thenMoves.flatMap(tm => [...tm.actions]);
      return [move.withConsequence(thenActions, false)];
    }

    return [move];
  }

  /** @java Trigger.isStatic() — delegates to playerFunction */
  public isStatic(): boolean {
    return (this.playerFunction as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
  }

  /** @java Trigger.canMoveTo() — always false */
  public canMoveTo(_ctx: Context, _target: number): boolean {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers

/**
 * Minimal port of Java's RoleType.toIntFunction — maps a role string to
 * an IntFunction that resolves the player index from context at eval time.
 *
 * @java game.types.play.RoleType.toIntFunction(RoleType)
 */
function roleToIntFunction(role: string): IntFunction {
  return {
    eval: (ctx: Context) => {
      switch (role) {
        case "Mover":
          return ctx.state.mover;
        case "Next": {
          const n = ctx.state.mover;
          const numP = ctx.numPlayers();
          return (n % numP) + 1;
        }
        case "P1":
          return 1;
        case "P2":
          return 2;
        case "P3":
          return 3;
        case "P4":
          return 4;
        default:
          return ctx.state.mover;
      }
    },
  };
}
