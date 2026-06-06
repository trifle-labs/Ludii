// @java Core/src/game/rules/play/moves/nonDecision/effect/set/site/SetValue.java

/**
 * Sets the piece value of a location.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/site/SetValue.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetValue } from "../../../../../../../../../action/action-set-value.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";
import type { SiteType } from "../../../../../../../../../action/site-type.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Sets the piece value of a location.
 *
 * Java parity (SetValue.eval lines 74-98):
 *   1. Evaluate level (UNDEFINED if levelFn is null).
 *   2. Evaluate valueInt = value.eval(context).
 *   3. Guard: if valueInt < 0 || level < UNDEFINED, return empty.
 *   4. Emit ActionSetValue(type, site, level, valueInt) wrapped in a Move.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/site/SetValue.java
 */
export class SetValue implements MovesFunction {
  /** The site. @java SetValue.siteFn */
  protected readonly siteFn: IntFunction;

  /** The level. @java SetValue.levelFn */
  private readonly levelFn: IntFunction | null;

  /** The value. @java SetValue.value */
  protected readonly valueFn: IntFunction;

  /** Cell/Edge/Vertex. @java SetValue.type */
  private readonly type: SiteType | null;

  /** Optional subsequent moves. @java SetValue.then() */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java SetValue(SiteType, IntFunction, IntFunction, IntFunction, Then)
   *
   * @param type      The graph element type [default SiteType of the board].
   * @param siteFn    The site to modify.
   * @param levelFn   The level to modify [null → UNDEFINED].
   * @param valueFn   The new piece value.
   * @param thenMoves The moves applied after that move is applied.
   */
  public constructor(
    type: SiteType | null,
    siteFn: IntFunction,
    levelFn: IntFunction | null,
    valueFn: IntFunction,
    thenMoves: MovesFunction | null = null,
  ) {
    this.type = type;
    this.siteFn = siteFn;
    this.levelFn = levelFn;
    this.valueFn = valueFn;
    this.thenMoves = thenMoves;
  }

  /**
   * @java SetValue.eval(Context)
   *
   * Java parity (SetValue.eval lines 74-98):
   *   1. level = levelFn == null ? UNDEFINED : levelFn.eval(context)
   *   2. valueInt = value.eval(context)
   *   3. if (valueInt < 0 || level < UNDEFINED) return moves (empty)
   *   4. ActionSetValue(type, site, level, valueInt)
   *   5. wrap in Move; attach then consequences; store MovesLudeme
   */
  public eval(ctx: Context): Move[] {
    // @java SetValue.java:79 — level = levelFn == null ? UNDEFINED : levelFn.eval(context)
    const level = this.levelFn == null ? UNDEFINED : this.levelFn.eval(ctx);
    // @java SetValue.java:80 — valueInt = value.eval(context)
    const valueInt = this.valueFn.eval(ctx);

    // @java SetValue.java:82-83 — guard
    if (valueInt < 0 || level < UNDEFINED) {
      return [];
    }

    const site = this.siteFn.eval(ctx);
    const mover = ctx.state.mover;

    // @java SetValue.java:85 — ActionSetValue(type, site, level, valueInt)
    // TS ActionSetValue only takes {to, value}; type and level are deferred
    const action = new ActionSetValue({ to: site, value: valueInt });

    const move = new LudiiMove({
      id: `setValue:${site}:${valueInt}`,
      label: `SetValue(site=${site}, value=${valueInt})`,
      siteIndices: [site],
      mover,
      placedOwner: mover,
      actions: [action],
    });

    // @java SetValue.java:89-91 — attach then consequences
    if (this.thenMoves != null) {
      const thenList = this.thenMoves.eval(ctx);
      if (thenList.length > 0) {
        return [new LudiiMove({
          id: `setValue:${site}:${valueInt}`,
          label: `SetValue(site=${site}, value=${valueInt})`,
          siteIndices: [site],
          mover,
          placedOwner: mover,
          actions: [action],
          then: thenList,
        })];
      }
    }

    return [move];
  }

  /**
   * @java SetValue.isStatic()
   *
   * Java parity:
   *   if (levelFn != null && !levelFn.isStatic()) return false;
   *   return siteFn.isStatic() && value.isStatic();
   */
  public isStatic(): boolean {
    if (this.levelFn != null && !(this.levelFn as unknown as { isStatic?: () => boolean }).isStatic?.()) {
      return false;
    }
    const siteStatic = (this.siteFn as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
    const valStatic = (this.valueFn as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
    return siteStatic && valStatic;
  }

  /**
   * @java SetValue.toString()
   */
  public toString(): string {
    return `SetValue [siteFn=${this.siteFn}, value=${this.valueFn}then=${this.thenMoves}]`;
  }

  /**
   * @java SetValue.toEnglish(Game)
   */
  public toEnglish(): string {
    const typeName = this.type ?? "cell";
    const levelString = this.levelFn != null ? ` at ${this.levelFn}` : "";
    const thenString = this.thenMoves != null ? ` then ${this.thenMoves}` : "";
    return `set the count of ${String(typeName).toLowerCase()} ${this.siteFn}${levelString} to ${this.valueFn}${thenString}`;
  }
}
