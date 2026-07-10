// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/max/distance/MaxDistance.java
/**
 * `(max Distance …)` — nominally "keep only the moves allowing the maximum
 * distance on a track in a turn". In Java this is a NO-OP (returns the moves
 * unfiltered); see eval() below. Kept as a faithful pass-through wrapper.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/requirement/max/distance/MaxDistance.java
 */

import type { Context } from "../../../../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../../../../base.js";
import type { Move } from "../../../../../../../../../../move.js";
import type { Then } from "../../../Then.js";

export class MaxDistance implements MovesFunction {
  /** @java MaxDistance.moves */
  private readonly moves: MovesFunction;

  /** @java MaxDistance.trackName */
  private readonly trackName: string | null;

  /** @java MaxDistance.owner */
  private readonly owner: string | null;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/max/distance/MaxDistance.java — constructor
   *
   * @param trackName The name of the track [null = any track]
   * @param owner     The role type of the owner [null = any owner]
   * @param moves     The moves to filter
   * @param then      Subsequent moves
   */
  public constructor(
    trackName: string | null,
    owner: string | null,
    moves: MovesFunction,
    then: Then | null = null,
  ) {
    this.trackName = trackName;
    this.owner = owner;
    this.moves = moves;
    this.thenClause = then;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/max/distance/MaxDistance.java — eval(Context)
   *
   * IMPORTANT — this ludeme is a NO-OP in Java. Its eval() computes the
   * per-move track distances and builds `returnMoves` (the max-distance subset,
   * MaxDistance.java:69,113-124), but that list is then DISCARDED: lines 126-132
   *
   *     final Moves toReturn = moves.eval(context);   // fresh, UNFILTERED eval
   *     for (...) toReturn.moves().get(j).setMovesLudeme(toReturn);
   *     return toReturn;                              // returns ALL moves
   *
   * i.e. Java returns `moves.eval(context)` unfiltered — the distance filtering
   * (and the whole getDistanceCount recursion) is dead code. This is a latent
   * Java bug, but Java is the source of truth for parity, so we must replicate
   * the observable behavior: return the full unfiltered move list.
   *
   * (Nard/Tavla/backgammon-family: at a ply where a shorter-distance die move is
   * legal alongside the max-distance one, Java offers BOTH; a filtering TS port
   * dropped the shorter move — e.g. Nard could not reproduce Java's recorded
   * 5→8 while offering only the longer 9→11/10→12 — a MOVE_MISMATCH.)
   *
   * Java also does not apply MaxDistance's own `then` in this path: `super.then()`
   * is referenced only by the discarded `returnMoves = new BaseMoves(super.then())`,
   * so a MaxDistance-level then is likewise dead. The moves returned carry their
   * OWN inner then (e.g. Nard's `(forEach Die … (then ("ReplayNotAllDiceUsed")))`),
   * which `moves.eval(ctx)` already attaches. We mirror that: no then applied here.
   */
  public eval(ctx: Context): Move[] {
    // @java MaxDistance.java:126,132 — `return toReturn` where
    // `toReturn = moves.eval(context)`. The track lookup + distance filtering
    // above it in Java produce `returnMoves`, which is never returned.
    return this.moves.eval(ctx);
  }

  /** @java MaxDistance.moves */
  public getMoves(): MovesFunction { return this.moves; }
}
