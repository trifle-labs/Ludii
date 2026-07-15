// @java Core/src/game/rules/play/moves/nonDecision/effect/Select.java

/**
 * Selects either a site or a pair of "from" and "to" locations.
 *
 * @java game/rules/play/moves/nonDecision/effect/Select.java
 *
 * Java: public final class Select extends Effect
 *   - region: IntArrayFromRegion — from-sites region
 *   - condition: BooleanFunction — from-site condition
 *   - regionTo: IntArrayFromRegion | null — optional to-sites region
 *   - conditionTo: BooleanFunction — to-site condition
 *   - typeFrom / typeTo: SiteType
 *   - levelFromFn / levelToFn: IntFunction | null
 *   - mover: RoleType | null
 *
 * eval(): for each site in the from-region that satisfies `condition`,
 * emit ActionSelect moves. If a `to` region is specified, pair each
 * from-site with each to-site that satisfies `conditionTo`.
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import { ActionSelect } from "../../../../../../../action/action-select.js";
import { applyPostStateThen } from "./Then.js";
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";
import type { From } from "../../../../../util/moves/From.js";
import type { To } from "../../../../../util/moves/To.js";
import type { RoleTypeFull } from "../../../../../types/play/RoleType.js";

const TRUE_FUNCTION: BooleanFunction = { eval: () => true };

function sitesArray(value: unknown): number[] {
  if (Array.isArray(value)) return value.filter((site): site is number => Number.isInteger(site));
  if (value !== null && typeof value === "object") {
    const sites = (value as { sites?: () => unknown }).sites;
    if (typeof sites === "function") {
      const listed = sites.call(value);
      return Array.isArray(listed) ? listed.filter((site): site is number => Number.isInteger(site)) : [];
    }
    if (typeof (value as Iterable<unknown>)[Symbol.iterator] === "function") {
      return Array.from(value as Iterable<unknown>).filter((site): site is number => Number.isInteger(site));
    }
  }
  return Number.isInteger(value) ? [value as number] : [];
}

function regionFromLocOrRegion(
  loc: IntFunction | null,
  region: RegionFunction | null,
  fallbackField: "_evalFrom" | "_evalTo"
): RegionFunction {
  if (region !== null) return region;
  if (loc !== null) return { eval: (ctx) => [loc.eval(ctx)] };
  return { eval: (ctx) => [ctx[fallbackField]] };
}

/**
 * Select effect — emits ActionSelect for each valid from/to site pair.
 *
 * @java game/rules/play/moves/nonDecision/effect/Select.java
 */
export class Select extends Effect {
  /** @java Select.region — from-sites region */
  private readonly region: RegionFunction;

  /** @java Select.condition — from-site filter */
  private readonly condition: BooleanFunction;

  /** @java Select.regionTo — optional to-sites region */
  private readonly regionTo: RegionFunction | null;

  /** @java Select.conditionTo — to-site filter */
  private readonly conditionTo: BooleanFunction;

  /** @java Select.levelFromFn */
  private readonly levelFromFn: IntFunction | null;

  /** @java Select.levelToFn */
  private readonly levelToFn: IntFunction | null;

  /** @java Select.mover */
  private readonly mover: RoleTypeFull | null;

  private readonly thenRef: ThenLike | null;

  // -------------------------------------------------------------------------

  /**
   * @java Select(From from, @Opt To to, @Opt RoleType mover, @Opt Then then)
   */
  public constructor(
    from: From,
    to?: To | null,
    mover?: RoleTypeFull | null,
    then?: ThenLike | null
  ) {
    super(then ?? null);
    this.thenRef = then ?? null;

    this.region = regionFromLocOrRegion(from.loc(), from.region(), "_evalFrom");

    if (to === null || to === undefined) {
      this.regionTo = null;
    } else if (to.region() !== null) {
      this.regionTo = regionFromLocOrRegion(null, to.region(), "_evalTo");
    } else if (to.loc() !== null) {
      this.regionTo = regionFromLocOrRegion(to.loc(), null, "_evalTo");
    } else {
      this.regionTo = null;
    }

    this.condition = from.cond() ?? TRUE_FUNCTION;
    this.conditionTo = to?.cond() ?? TRUE_FUNCTION;
    this.levelFromFn = from.level();
    this.levelToFn = to?.level() ?? null;
    this.mover = mover ?? null;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Select.java — eval(Context)
   *
   * Java lines 119-228:
   *   1. Iterate sites in region.
   *   2. For each site: set context.from = context.to = site, check condition.
   *   3. If no regionTo: emit single ActionSelect(site, site).
   *   4. If regionTo: for each to-site, check conditionTo, emit ActionSelect(site, to).
   *
   * @java Select.java:145-149 — levelFrom is computed here and, critically,
   * mirrored onto levelTo for the no-regionTo case:
   *   final int levelFrom = !gameUsesStacking ? Constants.UNDEFINED
   *       : (levelFromFn != null) ? levelFromFn.eval(context) : cs.sizeStack(site, typeFrom) - 1;
   *   ...
   *   new ActionSelect(typeFrom, site, levelFrom, null, Constants.UNDEFINED, levelFrom);
   * TS's `action-select.ts` ActionSelect never carried level info (only
   * `(from, to)`), so `Move.levelTo()` (move.ts:480-483, itself a documented
   * prior fix for `(last LevelTo)`) always fell back to its `?? 0` default —
   * i.e. every `(move Select (from (from) level:(level)) (then (set State
   * at:(last To) level:(last LevelTo) ...))))` silently wrote level 0 instead
   * of the mover's own selected level. Es-Sig/Sig wa Duqqan's "TopRightSquare"/
   * "CentralSquare" activation counters (state incremented once per Sig throw
   * until reaching the forced-escape threshold) landed on the WRONG stacked
   * piece's level (typically level 0, the bottom of the stack) whenever more
   * than one piece occupied the site — corrupting an unrelated piece's state
   * and eventually producing phantom forced-escape moves / missed passes.
   */
  public override eval(ctx: Context): Move[] {
    // @java Select.eval iterates EXACTLY the compiled from-region. (A legacy
    // TS crutch pushed the last-sown hole into the set during sow relays; it
    // made Kisolo's empty pending-relay region {23} sprout the occupied
    // LastHole 24 and offer a move where Java force-passes.)
    const sites = sitesArray(this.region.eval(ctx));
    const mover = ctx.state.mover;

    const origTo = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;
    const origFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;

    const result: Move[] = [];

    // @java Select.java:421 `gameUsesStacking = game.isStacking();`
    // Context.game is typed against the lightweight `game.ts` Game facade
    // (start/moves/apply/over only); the real ludemes/Game.ts class carries
    // `isStacking()` but isn't in that interface, so duck-type through —
    // same pattern Game.ts itself uses for its own `usesStacking` flag.
    const gameUsesStacking =
      (ctx.game as unknown as { isStacking?: () => boolean }).isStacking?.() === true;

    for (const site of sites) {
      if (site < 0) continue;

      // @java Select.java:153-154
      (ctx as unknown as { _evalFrom?: number })._evalFrom = site;
      (ctx as unknown as { _evalTo?: number })._evalTo = site;

      if (!this.condition.eval(ctx)) continue;

      // @java Select.java:145-149
      const levelFrom = !gameUsesStacking
        ? -1
        : this.levelFromFn !== null
          ? this.levelFromFn.eval(ctx)
          : ctx.state.stackSize(site) - 1;

      if (this.regionTo === null) {
        // @java Select.java:159-168 — single-site select; levelTo mirrors
        // levelFrom (Java passes `levelFrom` as BOTH the 3rd and 6th ctor arg).
        const action = new ActionSelect(site, site);
        action.setLevelFrom(levelFrom);
        action.setLevelTo(levelFrom);
        result.push(this.withThen(ctx, new Move({
          id: `select:${mover}:${site}:${site}`,
          label: `Select(${site})`,
          siteIndices: [site],
          mover,
          placedOwner: mover,
          actions: [action],
        })));
      } else {
        // @java Select.java:172-215 — from + to select
        const sitesTo = sitesArray(this.regionTo.eval(ctx));
        for (const siteTo of sitesTo) {
          if (siteTo < 0) continue;
          (ctx as unknown as { _evalTo?: number })._evalTo = siteTo;
          if (!this.conditionTo.eval(ctx)) continue;

          // @java Select.java:189-190
          const levelTo = this.levelToFn !== null
            ? this.levelToFn.eval(ctx)
            : ctx.state.stackSize(siteTo) - 1;

          const action = new ActionSelect(site, siteTo);
          action.setLevelFrom(levelFrom);
          action.setLevelTo(levelTo);
          result.push(this.withThen(ctx, new Move({
            id: `select:${mover}:${site}:${siteTo}`,
            label: `Select(${site}→${siteTo})`,
            siteIndices: [site, siteTo],
            mover,
            placedOwner: mover,
            actions: [action],
          })));
        }
      }
    }

    // Restore context scratch
    (ctx as unknown as { _evalTo?: number })._evalTo = origTo;
    (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;

    return result;
  }

  private withThen(ctx: Context, move: Move): Move {
    if (this.thenRef === null) return move;
    // @java other/move/Move.java — then() clauses are carried on the move and
    // evaluated at APPLY time, after ALL actions (Dubblets: ForEachDie appends
    // ActionUseDie after this Select's then was attached; the consequence
    // ("ReplayNotAllDiceUsed") must see the die consumed).
    return applyPostStateThen(this.thenRef, ctx, move);
  }

  // -------------------------------------------------------------------------

  /** @java Select.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
