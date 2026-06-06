// @java Core/src/game/rules/play/moves/nonDecision/operators/foreach/site/ForEachSite.java

/**
 * Applies a move for each site in a region.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/site/ForEachSite.java
 * @author mrraow and cambolbro and Eric.Piette
 *
 * @remarks Useful when a move has to be applied to all sites of a region
 *          according to some conditions.
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { MovesFunction, RegionFunction } from "../../../../../../../../base.js";
import { Effect } from "../../../../nonDecision/effect/Effect.js";
import type { ThenLike } from "../../../../Moves.js";

/**
 * Applies a move for each site in a region.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/site/ForEachSite.java
 *
 * Java: public final class ForEachSite extends Effect
 */
export class ForEachSite extends Effect {
  /** @java ForEachSite.regionFn — location of the piece */
  private readonly regionFn: RegionFunction;

  /** @java ForEachSite.generator — the moves to apply */
  private readonly generator: MovesFunction;

  /**
   * @java ForEachSite.elseMoves — the moves to apply if the list of moves
   * resulting from the generator is empty.
   */
  private readonly elseMoves: MovesFunction | null;

  // -------------------------------------------------------------------------

  /**
   * @param regionFn  The region used.
   * @param generator The move to apply.
   * @param noMoveYet The moves to apply if the list of moves resulting from the
   *                  generator is empty.
   * @param then      The moves applied after that move is applied.
   * @java ForEachSite(RegionFunction, Moves, Moves, Then)
   */
  public constructor(
    regionFn: RegionFunction,
    generator: MovesFunction,
    noMoveYet: MovesFunction | null = null,
    then: ThenLike | null = null,
  ) {
    super(then);
    this.regionFn = regionFn;
    this.generator = generator;
    this.elseMoves = noMoveYet;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/operators/foreach/site/ForEachSite.java — eval(Context)
   */
  public override eval(context: Context): Move[] {
    // @java final Region sites = regionFn.eval(context);
    const sites = this.regionFn.eval(context);

    // @java final Moves moves = new BaseMoves(super.then());
    const moves: Move[] = [];

    // @java final int savedTo = context.to();
    // @java final int originSiteValue = context.site();
    const ctx = context as unknown as {
      to(): number;
      setTo(v: number): void;
      site(): number;
      setSite(v: number): void;
    };
    const savedTo = ctx.to();
    const originSiteValue = ctx.site();

    // @java for (int site = sites.bitSet().nextSetBit(0); site >= 0; site = sites.bitSet().nextSetBit(site + 1))
    for (const site of sites) {
      if (site < 0) continue;
      // @java context.setTo(site); context.setSite(site);
      ctx.setTo(site);
      ctx.setSite(site);
      // @java final FastArrayList<Move> generatedMoves = generator.eval(context).moves();
      const generatedMoves = this.generator.eval(context);
      for (const m of generatedMoves) moves.push(m);
    }

    // @java if (moves.moves().isEmpty() && elseMoves != null) return elseMoves.eval(context);
    if (moves.length === 0 && this.elseMoves !== null) {
      return this.elseMoves.eval(context);
    }

    // @java if (then() != null) for (j ...) moves.moves().get(j).then().add(then().moves());
    // NOTE: In this TS port, Move.then is readonly; then-chaining approximated at generation level.

    // @java context.setTo(savedTo); context.setSite(originSiteValue);
    ctx.setTo(savedTo);
    ctx.setSite(originSiteValue);

    return moves;
  }

  // -------------------------------------------------------------------------

  /** @java ForEachSite.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java ForEachSite.preprocess(Game) */
  public override preprocess(): void {
    (this.regionFn as unknown as { preprocess?(): void }).preprocess?.();
    (this.generator as unknown as { preprocess?(): void }).preprocess?.();
    if (this.elseMoves !== null) {
      (this.elseMoves as unknown as { preprocess?(): void }).preprocess?.();
    }
    super.preprocess();
  }

  /** @java ForEachSite.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missing = false;
    missing = missing || ((this.regionFn as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    missing = missing || ((this.generator as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    if (this.elseMoves !== null) {
      missing = missing || ((this.elseMoves as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    }
    return missing;
  }

  /** @java ForEachSite.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || ((this.regionFn as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    willCrash = willCrash || ((this.generator as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    if (this.elseMoves !== null) {
      willCrash = willCrash || ((this.elseMoves as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    }
    return willCrash;
  }

  /** @java ForEachSite.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    let text = "";
    if (this.regionFn !== null) {
      text = "Each turn, where the site is within " +
        ((this.regionFn as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "") +
        ", " +
        ((this.generator as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "");
    }
    return text;
  }
}
