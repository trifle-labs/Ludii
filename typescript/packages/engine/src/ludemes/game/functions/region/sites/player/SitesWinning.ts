// @java Core/src/game/functions/region/sites/player/SitesWinning.java

/**
 * Returns the winning positions for a player.
 *
 * @java game/functions/region/sites/player/SitesWinning.java
 * @author Eric.Piette and cambolbro
 *
 * @remarks Useful to avoid the "kingmaker" effect in multiplayer games.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { MovesLike } from "../../../../rules/play/moves/Moves.js";

/**
 * Returns the winning positions for a player.
 *
 * @java game/functions/region/sites/player/SitesWinning.java
 *
 * Java parity:
 *   - If mover: generate legal moves, for each move apply to TempContext, check winners.
 *   - If not mover: build Context for that player, generate their legal moves,
 *     apply to TempContext, check winners.
 */
export class SitesWinning extends BaseRegionFunction {
  /** @java SitesWinning — indexFn */
  private readonly indexFn: IntFunction | null;

  /** @java SitesWinning — movesGenerator */
  private readonly movesGenerator: MovesLike;

  /**
   * @param indexFn        The index of the player (from RoleType or player.index()).
   * @param movesGenerator The moves for which to check which ones lead to wins.
   * @java SitesWinning(Player|RoleType, NonDecision)
   */
  public constructor(indexFn: IntFunction | null, movesGenerator: MovesLike) {
    super();
    this.indexFn = indexFn;
    this.movesGenerator = movesGenerator;
  }

  /**
   * Returns positions that lead to a win for the given player.
   *
   * @java SitesWinning.eval(Context)
   *
   * Java parity:
   *   if (indexFn == null) return new Region();
   *   final int pid = indexFn.eval(context);
   *   if (pid == context.state().mover()) {
   *     for each legal move m:
   *       if m.toNonDecision() != -1 && not already added:
   *         newContext = TempContext(context); apply m; if newContext.winners.contains(mover) add site
   *   } else {
   *     newContext = copy of context, setMoverAndImpliedPrevAndNext(pid)
   *     for each legal move m of pid:
   *       if m.toNonDecision() != -1 && not already added:
   *         newNewContext = TempContext(newContext); apply m; if newNewContext.winners.contains(pid) add site
   *   }
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const winningPositions: number[] = [];

    // @java if (indexFn == null) return new Region()
    if (this.indexFn === null) {
      return [];
    }

    // @java final int pid = indexFn.eval(context)
    const pid = this.indexFn.eval(ctx);

    // @java if (pid == context.state().mover())
    const mover = ctx.state.mover;

    if (pid === mover) {
      // @java final Moves legalMoves = movesGenerator.eval(context)
      const legalMovesObj = this.movesGenerator.eval(ctx);
      const legalMoves = legalMovesObj.moves();

      for (const m of legalMoves) {
        // @java if (m.toNonDecision() != -1 && !winningPositions.contains(m.toNonDecision()))
        const toNonDec = (m as unknown as { toNonDecision?: () => number }).toNonDecision?.() ?? m.to();
        if (toNonDec !== -1 && !winningPositions.includes(toNonDec)) {
          // @java final Context newContext = new TempContext(context); newContext.game().apply(newContext, m)
          const newCtx = this.cloneContext(ctx);
          try {
            const gameApply = (newCtx.game as unknown as { apply?: (c: unknown, m: unknown) => void }).apply;
            if (typeof gameApply === "function") {
              gameApply.call(newCtx.game, newCtx, m);
            }
            // @java if (newContext.winners().contains(mover))
            const newWinners = this.getWinners(newCtx);
            if (newWinners.has(mover)) {
              winningPositions.push(toNonDec);
              newWinners.delete(mover);
            }
          } catch {
            // Ignore apply errors (game may crash for illegal moves)
          }
        }
      }
    } else {
      // @java final Context newContext = new Context(context); newContext.setMoverAndImpliedPrevAndNext(pid)
      const newCtx = this.cloneContext(ctx);
      const setMover = (newCtx as unknown as {
        setMoverAndImpliedPrevAndNext?: (pid: number) => void;
        _setMover?: (pid: number) => void;
      });
      if (typeof setMover.setMoverAndImpliedPrevAndNext === "function") {
        setMover.setMoverAndImpliedPrevAndNext(pid);
      } else if (typeof setMover._setMover === "function") {
        setMover._setMover(pid);
      }

      // @java final Moves legalMoves = movesGenerator.eval(newContext)
      const legalMovesObj = this.movesGenerator.eval(newCtx);
      const legalMoves = legalMovesObj.moves();

      for (const m of legalMoves) {
        // @java if (m.toNonDecision() != -1 && !winningPositions.contains(m.toNonDecision()))
        const toNonDec = (m as unknown as { toNonDecision?: () => number }).toNonDecision?.() ?? m.to();
        if (toNonDec !== -1 && !winningPositions.includes(toNonDec)) {
          // @java final Context newNewContext = new TempContext(newContext); newNewContext.game().apply(newNewContext, m)
          const newNewCtx = this.cloneContext(newCtx);
          try {
            const gameApply = (newNewCtx.game as unknown as { apply?: (c: unknown, m: unknown) => void }).apply;
            if (typeof gameApply === "function") {
              gameApply.call(newNewCtx.game, newNewCtx, m);
            }
            // @java if (newNewContext.winners().contains(pid))
            const newNewWinners = this.getWinners(newNewCtx);
            if (newNewWinners.has(pid)) {
              winningPositions.push(toNonDec);
              newNewWinners.delete(pid);
            }
          } catch {
            // Ignore apply errors
          }
        }
      }
    }

    return winningPositions;
  }

  /**
   * Clone a context for lookahead (mirrors Java's new TempContext(context)).
   * @java new TempContext(context) / new Context(context)
   */
  private cloneContext(ctx: Context & EvalScratch): Context & EvalScratch {
    const cloned = (ctx as unknown as {
      copy?: () => Context;
      clone?: () => Context;
    }).copy?.() ?? (ctx as unknown as { clone?: () => Context }).clone?.() ?? ctx;
    return cloned as Context & EvalScratch;
  }

  /**
   * Get the set of current winners from a context (mutable for removal).
   * @java Context.winners() — returns a set of winner player indices
   */
  private getWinners(ctx: Context): Set<number> {
    const winners = (ctx as unknown as {
      winners?: () => Set<number> | number[];
      _winners?: Set<number>;
    }).winners?.();
    if (!winners) return new Set<number>();
    if (winners instanceof Set) return winners;
    return new Set<number>(winners);
  }

  /** @java SitesWinning.isStatic() — false */
  public override isStatic(): boolean {
    return false;
  }

  /** @java SitesWinning.toString() */
  public override toString(): string {
    return "SitesWinning()";
  }
}
