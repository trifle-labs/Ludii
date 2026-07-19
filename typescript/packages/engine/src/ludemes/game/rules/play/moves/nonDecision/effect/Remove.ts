// @java Core/src/game/rules/play/moves/nonDecision/effect/Remove.java
/**
 * Removes an item from a site.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/Remove.java
 *
 * @remarks If the site is empty, the move is not applied. Coverage-only
 *          transliteration — NOT registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../context.js";
import type { IntFunction, MovesFunction, RegionFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import { applyPostStateThen, type Then } from "./Then.js";
import { ActionRemoveNonApplied } from "../../../../../../../action/action-remove-non-applied.js";
import { ActionRemove } from "../../../../../../../action/action-remove.js";
import { Move as LudiiMove } from "../../../../../../../move.js";
import { Level } from "../../../../../functions/ints/iterator/Level.js";

/** OFF constant matching Java's Constants.OFF = -1 */
const OFF = -1;

export class Remove implements MovesFunction {
  /** @java Remove.regionFunction — which sites to remove from */
  private readonly locationFn: IntFunction | null;
  private readonly regionFn: RegionFunction | null;

  /** @java Remove.countFn — number of pieces to remove [default 1] */
  private readonly countFn: IntFunction;

  /** @java Remove.levelFn — level of the piece to remove [default top] */
  private readonly levelFn: IntFunction | null;

  /** @java Remove.type — site type */
  private readonly type: string | null;

  /** @java Remove.when — when to apply removal (null = immediately, "EndOfTurn" = deferred) */
  private readonly when: string | null;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Remove.java — constructor
   *
   * @param locationFn  Single-site function (mutually exclusive with regionFn)
   * @param regionFn    Multi-site region function (mutually exclusive with locationFn)
   * @param countFn     Number of pieces to remove [1]
   * @param levelFn     Level to remove from [top]
   * @param type        Site type [null = default]
   * @param when        "EndOfTurn" or null for immediate
   * @param thenClause  Subsequent moves
   */
  public constructor(opts: {
    locationFn?: IntFunction | null;
    regionFn?: RegionFunction | null;
    countFn?: IntFunction | null;
    levelFn?: IntFunction | null;
    type?: string | null;
    when?: string | null;
    then?: Then | null;
  }) {
    this.locationFn = opts.locationFn ?? null;
    this.regionFn = opts.regionFn ?? null;
    this.countFn = opts.countFn ?? { eval: () => 1 };
    this.levelFn = opts.levelFn ?? null;
    this.type = opts.type ?? null;
    this.when = opts.when ?? null;
    this.thenClause = opts.then ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Remove.java — eval(Context)
   *
   * For each location in the region (or single location), emit a remove move
   * if the site is non-empty.
   */
  public eval(ctx: Context): Move[] {
    // @java Remove.java:107 — locs = regionFunction.eval(context)
    const locs: number[] = (this.regionFn != null)
      ? this.regionFn.eval(ctx)
      : [this.locationFn != null ? this.locationFn.eval(ctx) : ctx._evalTo];

    const count = this.countFn.eval(ctx);
    const mover = ctx.state.mover;
    const moves: LudiiMove[] = [];

    for (const loc of locs) {
      if (loc < 0) continue;

      // @java Remove.java:127-129 — skip empty sites. Dual-SiteType: an
      // explicitly typed remove consults its channel (@java cs.what(loc, type)).
      let what = ctx.state.what(loc);
      if (what <= 0 && this.type !== null) {
        const typed = (ctx.state as unknown as { typedSites?: ReadonlyMap<string, { what: readonly number[]; count: readonly number[] }> }).typedSites;
        const ch = typed?.get(this.type);
        if (ch) what = (ch.what[loc] ?? 0) > 0 ? ch.what[loc]! : ((ch.count[loc] ?? 0) > 0 ? 1 : 0);
      }
      if (what <= 0) continue;

      // @java Remove.java:131 — applyNow = when != EndOfTurn
      const applyNow = this.when !== "EndOfTurn";

      const actions: import("../../../../../../../action/index.js").Action[] = [];

      // @java ActionRemove.construct(realType, loc, level, applied) —
      // applied=false dispatches to ActionRemoveNonApplied: the piece stays
      // on the board, the site joins state.sitesToRemove, and the step-1b
      // end-of-turn flush removes it for real. Mid-chain the pending piece
      // still BLOCKS hop paths (Frisian king chains).
      // @java ActionRemove carries the LEVEL: (remove X level:0) removes the
      // BOTTOM of a stack (and shifts the rest down), not the whole pile —
      // Complica trims a full column by removing level 0. Pass it through.
      const rawLvl = this.levelFn != null ? this.levelFn.eval(ctx) : undefined;
      let lvl = rawLvl;
      // @java Remove.java:127-129 — `level = (!isStacking() ||
      // sizeStack(loc)==level+1) ? UNDEFINED : level` — an explicit level:
      // collapses to level-less (UNDEFINED) whenever it names the stack's
      // CURRENT top (or the game isn't stacking at all) at evaluation time,
      // routing to the clean, level-less remove instead of the dirty,
      // shift-loop explicit-level remove. NARROWLY scoped here (wave-15c,
      // see boolik3-open.md lead #3, following the revert of the blanket
      // version in 87c88c9ce2/043e85554c): only applied when BOTH (a) this
      // Remove's level: argument is structurally the enclosing loop's own
      // `(level)` iterator (`this.levelFn instanceof Level`, not some other
      // expression that merely happens to evaluate to the same number), AND
      // (b) this Remove is evaluated directly inside that loop's own FromTop
      // generator body (`ctx._inForEachLevelFromTop`, set by
      // ForEachLevel.ts's eval()) — i.e. exactly the `RemoveCapturedPieces`
      // (Boolik.lud line 55) / Pahada-Keliya-capture-handler
      // (`Pahada Keliya.lud` line ~93) idiom: `(forEach Level ... FromTop
      // (... (remove ... level:(level)) ...))`. A standalone `(remove X
      // level:(level))` that is NOT nested in a ForEachLevel...FromTop body
      // (e.g. Pahada Keliya's own track-end self-removal, `Pahada
      // Keliya.lud` line 75) is deliberately left on the unconditional
      // dirty explicit-level path below, byte-for-byte unchanged from
      // before this fix — the blanket version of this collapse (applied to
      // every Remove node regardless of nesting) regressed elsewhere and
      // was reverted; this narrower gate never touches that code path.
      if (
        rawLvl !== undefined &&
        this.levelFn instanceof Level &&
        (ctx as unknown as { _inForEachLevelFromTop?: boolean })._inForEachLevelFromTop === true
      ) {
        const clampedLvl = rawLvl < 0 ? 0 : rawLvl;
        lvl = (!ctx.state.stackingGame || ctx.state.stackSize(loc) === clampedLvl + 1)
          ? undefined
          : clampedLvl;
      }
      const mkRemove = () => applyNow
        ? new ActionRemove({
            to: loc,
            ...(this.type ? { type: this.type as never } : {}),
            ...(lvl !== undefined && lvl >= 0 ? { level: lvl } : {}),
          })
        : new ActionRemoveNonApplied(loc);

      // @java Remove.java:139 — primary remove action
      actions.push(mkRemove());

      // @java Remove.java:144-149 — additional removes for count > 1
      let remaining = count - 1;
      while (remaining > 0) {
        actions.push(mkRemove());
        remaining--;
      }

      const move = new LudiiMove({
        id: `remove:${mover}:${loc}`,
        label: `Remove(${loc})`,
        siteIndices: [loc],
        mover,
        placedOwner: mover,
        actions,
      });
      moves.push(move);
    }

    // @java Remove.java:154-155 — then clause
    if (this.thenClause != null) {
      // @java Then.java — consequence evaluated in the POST-MOVE context (per move).
      return moves.map(m => applyPostStateThen(this.thenClause, ctx, m));
    }

    return moves;
  }
}
