// @java Core/src/game/rules/play/moves/nonDecision/operators/foreach/team/ForEachTeam.java

/**
 * Applies a move for each team.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/team/ForEachTeam.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../../base.js";
import { Effect } from "../../../../nonDecision/effect/Effect.js";
import type { ThenLike } from "../../../../Moves.js";

/**
 * Applies a move for each team.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/team/ForEachTeam.java
 *
 * Java: public final class ForEachTeam extends Effect
 */
export class ForEachTeam extends Effect {
  /** @java ForEachTeam.generator — the moves to apply */
  private readonly generator: MovesFunction;

  // -------------------------------------------------------------------------

  /**
   * @param generator The move to apply.
   * @param then      The moves applied after that move is applied.
   * @java ForEachTeam(Moves, Then)
   */
  public constructor(generator: MovesFunction, then: ThenLike | null = null) {
    super(then);
    this.generator = generator;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/operators/foreach/team/ForEachTeam.java — eval(Context)
   */
  public override eval(context: Context): Move[] {
    // @java final Moves moves = new BaseMoves(super.then());
    const moves: Move[] = [];

    // @java final int[] savedTeam = context.team();
    const ctx = context as unknown as {
      team(): number[] | null;
      setTeam(t: number[]): void;
      game(): { players(): { size(): number } };
      state(): { playerInTeam?(pid: number, tid: number): boolean };
    };
    const savedTeam = ctx.team();

    // @java for (int tid = 1; tid < context.game().players().size(); tid++)
    const numPlayers = (context.game as unknown as { numPlayers: number }).numPlayers ??
      (ctx.game().players().size() - 1);

    for (let tid = 1; tid < numPlayers + 1; tid++) {
      // @java final TIntArrayList team = new TIntArrayList();
      const team: number[] = [];

      // @java for (int pid = 1; pid < context.game().players().size(); pid++)
      for (let pid = 1; pid < numPlayers + 1; pid++) {
        // @java if (context.state().playerInTeam(pid, tid)) team.add(pid);
        const state = ctx.state();
        if (state?.playerInTeam?.(pid, tid)) {
          team.push(pid);
        }
      }

      if (team.length > 0) {
        // @java context.setTeam(team.toArray());
        ctx.setTeam(team);
        // @java final FastArrayList<Move> generatedMoves = generator.eval(context).moves();
        const generatedMoves = this.generator.eval(context);
        for (const m of generatedMoves) moves.push(m);
      }
    }

    // @java if (then() != null) for (j ...) moves.moves().get(j).then().add(then().moves());
    // NOTE: In this TS port, Move.then is readonly; then-chaining approximated at generation level.

    // @java context.setTeam(savedTeam);
    if (savedTeam !== null) {
      ctx.setTeam(savedTeam);
    }

    return moves;
  }

  // -------------------------------------------------------------------------

  /** @java ForEachTeam.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java ForEachTeam.preprocess(Game) */
  public override preprocess(): void {
    (this.generator as unknown as { preprocess?(): void }).preprocess?.();
    super.preprocess();
  }

  /** @java ForEachTeam.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missing = false;
    missing = missing || ((this.generator as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    return missing;
  }

  /** @java ForEachTeam.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || ((this.generator as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    return willCrash;
  }
}
