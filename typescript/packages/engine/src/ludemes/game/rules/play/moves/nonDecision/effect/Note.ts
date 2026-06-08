// @java Core/src/game/rules/play/moves/nonDecision/effect/Note.java

/**
 * Makes a note to a player or to all the players.
 *
 * @java game/rules/play/moves/nonDecision/effect/Note.java
 *
 * Java: public final class Note extends Effect
 *   - playerFn: IntFunction — which player to send to (ALL by default)
 *   - playerMessage: IntFunction | null — optional player prefix in message
 *   - message / messageInt / etc — one of the message variants
 *
 * eval() builds the message string then emits ActionNote moves for target player(s).
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import { ActionNote } from "../../../../../../../action/action-note.js";
import type { BooleanFunction, DirectionsFunction, EvalScratch, FloatFunction, IntArrayFunction, IntFunction, RegionFunction } from "../../../../../../base.js";
import type { GraphFunction } from "../../../../../functions/graph/GraphFunction.js";
import type { RangeFunction1to1, RangeResult } from "../../../../../functions/range/Range1to1.js";
import type { Player1to1 } from "../../../../../util/moves/Player1to1.js";
import { Effect } from "./Effect.js";

type RoleTypeName = string;
type DirectionName = string;
type PlayerArg = Player1to1 | { index(): IntFunction };
type RangeFunctionLike = RangeFunction1to1 | {
  eval(ctx: Context & EvalScratch): { min(ctx: Context): number; max(ctx: Context): number } | RangeResult;
};

/**
 * Note effect — sends a message to one or all players.
 *
 * @java game/rules/play/moves/nonDecision/effect/Note.java
 */
export class Note extends Effect {
  /** @java Note.playerFn — target player index function (ALL → iterate all players) */
  private readonly playerFn: IntFunction;

  /** @java Note.playerMessage — optional player index to prefix in message */
  private readonly playerMessage: IntFunction | null;

  /** @java Note.role — the RoleType string ("All" → all players) */
  private readonly role: RoleTypeName | null;

  /** @java Note.roleMessage — optional role to prefix in message */
  private readonly roleMessage: RoleTypeName | null;

  // Message variants (one must be non-null)
  /** @java Note.message */
  private readonly message: string | null;
  /** @java Note.messageInt */
  private readonly messageInt: IntFunction | null;
  /** @java Note.messageIntArray */
  private readonly messageIntArray: IntArrayFunction | null;
  /** @java Note.messageFloat */
  private readonly messageFloat: FloatFunction | null;
  /** @java Note.messageBoolean */
  private readonly messageBoolean: BooleanFunction | null;
  /** @java Note.messageRegion */
  private readonly messageRegion: RegionFunction | null;
  /** @java Note.messageRange */
  private readonly messageRange: RangeFunctionLike | null;
  /** @java Note.messageDirection */
  private readonly messageDirection: DirectionsFunction | null;
  /** @java Note.messageGraph */
  private readonly messageGraph: GraphFunction | null;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Note.java — constructor
   *
   * Java order:
   * Note(@Opt @Or @Name IntFunction player,
   *      @Opt @Or @Name RoleType Player,
   *      @Or2 String message,
   *      @Or2 IntFunction messageInt,
   *      @Or2 IntArrayFunction messageIntArray,
   *      @Or2 FloatFunction messageFloat,
   *      @Or2 BooleanFunction messageBoolean,
   *      @Or2 RegionFunction messageRegion,
   *      @Or2 RangeFunction messageRange,
   *      @Or2 Direction messageDirection,
   *      @Or2 GraphFunction messageGraph,
   *      @Opt @Or @Name game.util.moves.Player to,
   *      @Opt @Or @Name RoleType To)
   */
  public constructor(
    player: IntFunction | null,
    Player: RoleTypeName | null,
    message: string | null,
    messageInt: IntFunction | null,
    messageIntArray: IntArrayFunction | null,
    messageFloat: FloatFunction | null,
    messageBoolean: BooleanFunction | null,
    messageRegion: RegionFunction | null,
    messageRange: RangeFunctionLike | null,
    messageDirection: DirectionName | DirectionsFunction | null,
    messageGraph: GraphFunction | null,
    to: PlayerArg | null = null,
    To: RoleTypeName | null = null,
  ) {
    super(null);

    let numNonNull = 0;
    if (Player !== null) numNonNull += 1;
    if (player !== null) numNonNull += 1;
    if (numNonNull > 1) {
      throw new Error("Note(): Only one 'playerMessage' or 'roleMessage' parameters can be non-null.");
    }

    numNonNull = 0;
    if (to !== null) numNonNull += 1;
    if (To !== null) numNonNull += 1;
    if (numNonNull > 1) {
      throw new Error("Note(): Only one 'to' or 'role' parameters can be non-null.");
    }

    numNonNull = 0;
    if (message !== null) numNonNull += 1;
    if (messageInt !== null) numNonNull += 1;
    if (messageIntArray !== null) numNonNull += 1;
    if (messageFloat !== null) numNonNull += 1;
    if (messageBoolean !== null) numNonNull += 1;
    if (messageRegion !== null) numNonNull += 1;
    if (messageRange !== null) numNonNull += 1;
    if (messageDirection !== null) numNonNull += 1;
    if (messageGraph !== null) numNonNull += 1;
    if (numNonNull !== 1) {
      throw new Error(
        "Note(): One 'message', 'messageInt', 'messageIntArray', messageFloat', 'messageBoolean', 'messageRegion', 'messageRange', 'messageDirection' or 'messageGraph' parameters must be non-null.",
      );
    }

    this.playerFn = (to !== null) ? to.index() : (To !== null) ? roleToIntFunction(To) : roleToIntFunction("All");
    this.role = (to === null && To === null) ? "All" : To;
    this.message = message;
    this.messageInt = messageInt;
    this.messageIntArray = messageIntArray;
    this.messageFloat = messageFloat;
    this.messageBoolean = messageBoolean;
    this.messageRegion = messageRegion;
    this.messageRange = messageRange;
    this.messageDirection = directionToFunction(messageDirection);
    this.messageGraph = messageGraph;
    this.playerMessage = (Player !== null) ? roleToIntFunction(Player) : player;
    this.roleMessage = Player;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Note.java — eval(Context)
   *
   * Java lines 208-253:
   *   Build the message string from whichever message variant is non-null.
   *   Prepend "P{n} " if playerMessage is set.
   *   If role == All: emit ActionNote for each player 1..numPlayers.
   *   Otherwise: emit ActionNote for playerFn.eval(context).
   */
  public override eval(ctx: Context): Move[] {
    // @java Note.java:208-231 — build message string
    let msg: string;
    if (this.message !== null) {
      msg = this.message;
    } else if (this.messageInt !== null) {
      msg = String(this.messageInt.eval(ctx));
    } else if (this.messageIntArray !== null) {
      msg = JSON.stringify(this.messageIntArray.eval(ctx));
    } else if (this.messageFloat !== null) {
      msg = String(this.messageFloat.eval(ctx));
    } else if (this.messageBoolean !== null) {
      msg = String(this.messageBoolean.eval(ctx));
    } else if (this.messageRegion !== null) {
      msg = formatArray(this.messageRegion.eval(ctx));
    } else if (this.messageRange !== null) {
      const range = this.messageRange.eval(ctx as Context & EvalScratch);
      msg = `[${rangeMin(range, ctx)};${rangeMax(range, ctx)}]`;
    } else if (this.messageDirection !== null) {
      msg = formatArray(this.messageDirection.eval(ctx as Context & EvalScratch));
    } else if (this.messageGraph !== null) {
      msg = String(evalGraph(this.messageGraph, ctx));
    } else {
      msg = "";
    }

    // @java Note.java:233 — prepend player prefix if playerMessage set
    const messageToSend = (this.playerMessage === null)
      ? msg
      : `P${this.playerMessage.eval(ctx)} ${msg}`;

    const result: Move[] = [];
    const mover = (ctx as { state?: { mover?: number } }).state?.mover ?? 0;

    // @java Note.java:235-252 — send to all or specific player
    if (this.role === "All") {
      // @java: for(int i = 1; i < context.game().players().size(); i++)
      const numPlayers = (ctx as unknown as { numPlayers?: number }).numPlayers ?? 2;
      for (let i = 1; i <= numPlayers; i++) {
        result.push(new Move({
          id: `note:${mover}:${i}`,
          label: `Note(${messageToSend})`,
          siteIndices: [0],
          mover,
          placedOwner: mover,
          actions: [new ActionNote(messageToSend, i)],
        }));
      }
    } else {
      const pid = this.playerFn.eval(ctx);
      if (pid > 0) {
        result.push(new Move({
          id: `note:${mover}:${pid}`,
          label: `Note(${messageToSend})`,
          siteIndices: [0],
          mover,
          placedOwner: mover,
          actions: [new ActionNote(messageToSend, pid)],
        }));
      }
    }

    return result;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Note.canMove(Context)
   */
  public override canMove(_ctx: Context): boolean {
    return false;
  }

  /**
   * @java Note.canMoveTo(Context, int)
   */
  public override canMoveTo(_ctx: Context, _target: number): boolean {
    return false;
  }

  /**
   * @java Note.isStatic()
   */
  public override isStatic(): boolean {
    return false;
  }
}

function directionToFunction(direction: DirectionName | DirectionsFunction | null): DirectionsFunction | null {
  if (direction === null) return null;
  if (typeof direction === "string") return { eval: () => [direction] };
  return direction;
}

function roleToIntFunction(role: RoleTypeName): IntFunction {
  return {
    eval(ctx): number {
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (role === "Prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (role === "Player") return (ctx as Context & EvalScratch)._evalPlayer ?? ctx.state.mover;
      if (role === "Shared" || role === "Neutral" || role === "All") return 0;
      const match = /^P(\d+)$/.exec(role);
      return match ? Number(match[1]) : 0;
    },
  };
}

function formatArray(values: readonly unknown[]): string {
  return `[${values.join(", ")}]`;
}

function rangeMin(range: RangeResult | { min(ctx: Context): number }, ctx: Context): number {
  return typeof range.min === "number" ? range.min : range.min(ctx);
}

function rangeMax(range: RangeResult | { max(ctx: Context): number }, ctx: Context): number {
  return typeof range.max === "number" ? range.max : range.max(ctx);
}

function evalGraph(graph: GraphFunction, ctx: Context): unknown {
  const defaultSite = (ctx as unknown as { board?: { defaultSite?: string } }).board?.defaultSite ?? "Cell";
  const evalFn = graph.eval as unknown as ((siteType: string) => unknown) & ((context: Context, siteType: string) => unknown);
  return evalFn.length >= 2 ? evalFn(ctx, defaultSite) : evalFn(defaultSite);
}
