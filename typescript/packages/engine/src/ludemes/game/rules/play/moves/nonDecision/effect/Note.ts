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
import type { BooleanFunction, FloatFunction, IntArrayFunction, IntFunction, RegionFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";

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
  private readonly role: string;

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

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Note.java — constructor
   *
   * @param opts.playerFn        Target player function (eval returns player idx)
   * @param opts.role            "All" or player role string (default "All")
   * @param opts.playerMessage   Optional player index to prefix in message
   * @param opts.message         String message variant
   * @param opts.messageInt      Int message variant
   * @param opts.messageIntArray IntArray message variant
   * @param opts.messageFloat    Float message variant
   * @param opts.messageBoolean  Boolean message variant
   * @param opts.messageRegion   Region message variant
   */
  public constructor(opts: {
    playerFn: IntFunction;
    role?: string;
    playerMessage?: IntFunction | null;
    message?: string | null;
    messageInt?: IntFunction | null;
    messageIntArray?: IntArrayFunction | null;
    messageFloat?: FloatFunction | null;
    messageBoolean?: BooleanFunction | null;
    messageRegion?: RegionFunction | null;
  }) {
    super(null);
    this.playerFn = opts.playerFn;
    this.role = opts.role ?? "All";
    this.playerMessage = opts.playerMessage ?? null;
    this.message = opts.message ?? null;
    this.messageInt = opts.messageInt ?? null;
    this.messageIntArray = opts.messageIntArray ?? null;
    this.messageFloat = opts.messageFloat ?? null;
    this.messageBoolean = opts.messageBoolean ?? null;
    this.messageRegion = opts.messageRegion ?? null;
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
      msg = JSON.stringify(this.messageRegion.eval(ctx));
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
