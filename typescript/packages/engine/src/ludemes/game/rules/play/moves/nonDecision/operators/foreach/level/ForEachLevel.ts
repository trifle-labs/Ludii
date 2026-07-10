// @java Core/src/game/rules/play/moves/nonDecision/operators/foreach/level/ForEachLevel.java

/**
 * Applies a move for each level of a site.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/level/ForEachLevel.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { BaseMoves } from "../../../../BaseMoves.js";
import { Effect } from "../../../effect/Effect.js";
import { applyPostStateThen } from "../../../effect/Then.js";
import type { ThenLike } from "../../../../Moves.js";

/**
 * Stack direction type mirroring Java's StackDirection enum.
 * @java game/util/directions/StackDirection.java
 */
export type StackDirection = "FromTop" | "FromBottom";

/**
 * Applies a move for each level of a site.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/level/ForEachLevel.java
 */
export class ForEachLevel extends Effect {
  /** @java ForEachLevel.siteFn */
  private readonly siteFn: IntFunction;

  /** @java ForEachLevel.generator */
  private readonly generator: MovesFunction;

  /** @java ForEachLevel.type — SiteType (Cell/Edge/Vertex) */
  private type: string | null;

  /** @java ForEachLevel.stackDirection */
  private readonly stackDirection: StackDirection;

  /**
   * @java ForEachLevel(SiteType, IntFunction, StackDirection, Moves, Then)
   *
   * @param type           The type of the graph elements of the group [default SiteType of the board].
   * @param siteFn         The site to iterate through.
   * @param stackDirection The direction to count in the stack [FromTop].
   * @param generator      The move to apply.
   * @param then           The moves applied after that move is applied.
   */
  public constructor(
    type: string | null,
    siteFn: IntFunction,
    stackDirection: StackDirection | null,
    generator: MovesFunction,
    then: ThenLike | null = null,
  ) {
    super(then);
    this.siteFn = siteFn;
    this.generator = generator;
    this.type = type;
    // @java this.stackDirection = (stackDirection == null) ? StackDirection.FromTop : stackDirection;
    this.stackDirection = stackDirection ?? "FromTop";
  }

  /**
   * @java ForEachLevel.eval(Context)
   *
   * Iterates over each level of the stack at the given site and collects moves.
   */
  public override eval(context: Context): Move[] {
    // @java final int site = siteFn.eval(context);
    const site = this.siteFn.eval(context);

    const moves = new BaseMoves(super.then());

    // @java final int savedTo = context.to();
    const savedTo = context._evalTo;

    // @java final int originSiteValue = context.site();
    const originSiteValue = context._evalSite ?? -1;

    // @java final int cid = site >= context.containerId().length ? 0 : context.containerId()[site];
    const containerId = (context as unknown as { containerId?(): readonly number[] }).containerId?.() ?? [];
    const cid = site >= containerId.length ? 0 : (containerId[site] ?? 0);

    // @java SiteType realType = type; if (cid > 0) realType = SiteType.Cell; else if (realType == null) realType = context.board().defaultSite();
    let realType: string | null = this.type;
    if (cid > 0) {
      realType = "Cell";
    } else if (realType === null) {
      realType = (context as unknown as { board?(): { defaultSite(): string } }).board?.()?.defaultSite() ?? "Cell";
    }

    // @java final ContainerState cs = context.state().containerStates()[cid];
    const cs = (context as unknown as { containerState(i: number): unknown }).containerState?.(cid);

    // @java final int stackSize = cs.sizeStack(site, realType);
    // Java's ContainerState.sizeStack returns the true ITEM count: a largeStack
    // mancala hole with 6 seeds reports 6 (each seed is a stack item). The TS
    // ContainerState.sizeStack is a raw ENTRY accessor that returns the length of
    // the per-level `stacks[]` array — for a count-backed pile (one entry with
    // countAt=6, the memory-efficient seed model) it reports 1, so ForEachLevel
    // generated only ONE per-level move and a mancala capture
    // (forEach Level (hole) FromTop (fromTo (from hole level:(level)) …)) dropped
    // 5 of 6 seeds (Yucebao/Ceelkoqyuqkoqiji sow-family divergence). When the site
    // is a count-backed pile (countAt exceeds the raw entry length) take the true
    // height from countAt — the faithful equivalent of Java's item-count sizeStack.
    // Gated on countAt (not the SiteType, which a mancalaBoard reports as Vertex),
    // so genuine per-level stacks (Lasca/Focus: countAt at its default 1 ≤ length)
    // and empty edge/vertex sites (countAt 0) are never inflated.
    const rawStackSize: number = cs
      ? (cs as unknown as { sizeStack(site: number, type: unknown): number }).sizeStack(site, realType) ?? 0
      : (context.state.stacks[site]?.length ?? 0);
    const countAtSite: number = context.state.countAt?.[site] ?? 0;
    const stackSize: number = Math.max(rawStackSize, countAtSite);

    // @java context.setLevel(level) — the engine Context has no setLevel method
    // (the optional chain below is a silent no-op); the TS-native iterator field
    // is _evalLevel, which (level)/Level.eval reads. Set it explicitly each
    // iteration (mirroring ForEachPiece) so (who at:s level:(level)) and
    // (fromTo (from … level:(level))) resolve the CURRENT stack level instead of
    // always 0 — the Pachisi-family capture-return (forEach Level (last To) FromTop
    // …) lost every capture because (level) collapsed to 0. Save/restore to avoid
    // leaking the iterator value to the surrounding scope.
    const savedLevel = (context as unknown as { _evalLevel?: number })._evalLevel;
    // @java if (stackDirection.equals(StackDirection.FromBottom))
    if (this.stackDirection === "FromBottom") {
      for (let level = 0; level < stackSize; level++) {
        (context as unknown as { setLevel(l: number): void }).setLevel?.(level);
        (context as unknown as { _evalLevel?: number })._evalLevel = level;
        // @java final FastArrayList<Move> generatedMoves = generator.eval(context).moves();
        const generatedMoves = this.generator.eval(context);
        moves.moves().push(...generatedMoves);
      }
    } else {
      // @java for (int level = stackSize-1; level >= 0; level--)
      for (let level = stackSize - 1; level >= 0; level--) {
        (context as unknown as { setLevel(l: number): void }).setLevel?.(level);
        (context as unknown as { _evalLevel?: number })._evalLevel = level;
        // @java final FastArrayList<Move> generatedMoves = generator.eval(context).moves();
        const generatedMoves = this.generator.eval(context);
        moves.moves().push(...generatedMoves);
      }
    }
    (context as unknown as { _evalLevel?: number })._evalLevel = savedLevel;

    // @java context.setTo(savedTo);
    context._evalTo = savedTo;

    // @java context.setSite(originSiteValue);
    if (context._evalSite !== undefined) {
      context._evalSite = originSiteValue;
    }

    // @java ForEachLevel.java:106-108 — `moves.moves().get(j).then().add(then().moves())`:
    // attach this ForEachLevel's own (then …) consequence to EACH generated move.
    // TS Move.then is a FROZEN immutable array, so mutating it in place threw
    // "Cannot add property 0, object is not extensible" (So Long Sucker's
    // (forEach Level … (then …)) at ply 17). Mirror the sibling ForEachSite:
    // bake the post-state consequence + moveAgain into a NEW move via
    // applyPostStateThen. Same recipe as If/Do/MaxDistance/ForEachPiece.
    const thenObj = this.then() as unknown as { moves?: () => { eval(c: Context): Move[] }; eval?(c: Context): Move[] } | null;
    if (thenObj !== null) {
      const thenLike = typeof thenObj.moves === "function"
        ? (thenObj as { moves(): { eval(c: Context): Move[] } })
        : { moves: () => thenObj as { eval(c: Context): Move[] } };
      return moves.moves().map((m) => applyPostStateThen(thenLike, context, m));
    }

    return moves.moves();
  }

  /**
   * @java ForEachLevel.isStatic()
   */
  public override isStatic(): boolean {
    return false;
  }

  /**
   * @java ForEachLevel.preprocess(Game)
   */
  public override preprocess(): void {
    // @java if (type == null) type = game.board().defaultSite();
    // (type already resolved in eval)
    super.preprocess();
    (this.siteFn as unknown as { preprocess?(): void }).preprocess?.();
    (this.generator as unknown as { preprocess?(): void }).preprocess?.();
  }
}
