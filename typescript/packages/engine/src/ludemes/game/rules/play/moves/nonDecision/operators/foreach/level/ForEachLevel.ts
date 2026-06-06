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
    const stackSize: number = cs
      ? (cs as unknown as { sizeStack(site: number, type: unknown): number }).sizeStack(site, realType) ?? 0
      : (context.state.stacks[site]?.length ?? 0);

    // @java if (stackDirection.equals(StackDirection.FromBottom))
    if (this.stackDirection === "FromBottom") {
      for (let level = 0; level < stackSize; level++) {
        // @java context.setLevel(level);
        (context as unknown as { setLevel(l: number): void }).setLevel?.(level);
        // @java final FastArrayList<Move> generatedMoves = generator.eval(context).moves();
        const generatedMoves = this.generator.eval(context);
        moves.moves().push(...generatedMoves);
      }
    } else {
      // @java for (int level = stackSize-1; level >= 0; level--)
      for (let level = stackSize - 1; level >= 0; level--) {
        // @java context.setLevel(level);
        (context as unknown as { setLevel(l: number): void }).setLevel?.(level);
        // @java final FastArrayList<Move> generatedMoves = generator.eval(context).moves();
        const generatedMoves = this.generator.eval(context);
        moves.moves().push(...generatedMoves);
      }
    }

    // @java if (then() != null) for each move add then moves
    if (this.then() !== null) {
      const thenMoves = this.then()!.moves();
      for (const m of moves.moves()) {
        const mThen = (m as unknown as { then?: Move[] }).then;
        if (Array.isArray(mThen)) {
          const thenArr = (thenMoves as unknown as { eval?(ctx: Context): Move[]; moves?(): Move[] });
          if (typeof thenArr.eval === "function") {
            mThen.push(...thenArr.eval(context));
          } else if (typeof thenArr.moves === "function") {
            mThen.push(...thenArr.moves());
          }
        }
      }
    }

    // @java context.setTo(savedTo);
    context._evalTo = savedTo;

    // @java context.setSite(originSiteValue);
    if (context._evalSite !== undefined) {
      context._evalSite = originSiteValue;
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
