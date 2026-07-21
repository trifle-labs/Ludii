/**
 * @java game/rules/play/moves/nonDecision/effect/set/player/SetScore.java
 *
 * Sets the score of a player (given by playerFn) to scoreFn's value.
 *
 * Java parity (SetScore.eval lines 70-103):
 *   - Evaluate playerId = playerFn.eval(context)
 *   - Evaluate score = scoreFn.eval(context)
 *   - Emit ActionSetScore(playerId, score, false)
 *
 * NOTE: coverage-only transliteration; NOT registered in the 1:1 moves registry
 * (the interpreter-path SetScore.ts already covers this via the old compile.ts).
 *
 * @java game/rules/play/moves/nonDecision/effect/set/player/SetScore.java — eval(Context)
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetScore } from "../../../../../../../../../action/action-set-score.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";
import type { RoleTypeFull } from "../../../../../../../types/play/RoleType.js";
import type { Player } from "../../../../../../../util/moves/Player.js";
import type { Then } from "../../Then.js";
import { PlayersIndices } from "../../../../../../../../other/PlayersIndices.js";

export class SetScore implements MovesFunction {
  /**
   * Evaluates to the player index whose score is set.
   * @java SetScore.playerFn
   */
  private readonly playerFn: IntFunction;

  /**
   * Evaluates to the new score value.
   * @java SetScore.scoreFn
   */
  private readonly scoreFn: IntFunction;

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/player/SetScore.java — constructor
   * @param player The index of the player.
   * @param role   The roleType of the player.
   * @param score  The new score.
   * @param then   The moves applied after that move is applied.
   */
  /**
   * The roleType, retained so eval can expand multi-player roles (All, Enemy,
   * NonMover, TeamN…) into one ActionSetScore per real player.
   * @java SetScore.role
   */
  private readonly role: RoleTypeFull | null;

  public constructor(
    player: Player | null,
    role: RoleTypeFull | null,
    score: IntFunction,
    then: Then | null = null,
  ) {
    this.thenClause = then ?? null;
    // @java SetScore.<init> — playerFn = (player==null)? RoleType.toIntFunction(role) : player.index()
    this.playerFn = player === null ? roleToIntFunction(role) : player.index();
    this.role = player === null ? role : null;
    this.scoreFn = score;
  }

  /** @java Effect.then — the (then ...) consequence on this set-score move. */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/player/SetScore.java — eval(Context)
   */
  public eval(ctx: Context): Move[] {
    // @java SetScore.java:72-74 — playerId = playerFn.eval, score = scoreFn.eval
    const playerId = this.playerFn.eval(ctx);
    const score = this.scoreFn.eval(ctx);
    const mover = ctx.state.mover;

    // @java SetScore.eval — the (then ...) consequence applies AFTER the score
    // is set (Brood's (set Score Mover 0 (then (forEach Piece (addScore ...))))
    // accumulates the per-piece score; dropping the then left scores at 0 and
    // byScore picked the wrong winner). Attach as a deferredThen (post-apply).
    const deferredThens = this.thenClause != null
      ? [{ eval: (c: Context): LudiiMove[] => {
          const r = (this.thenClause as unknown as { moves(): { eval(c: Context): LudiiMove[] | { moves(): LudiiMove[] } } }).moves().eval(c);
          return Array.isArray(r) ? r : r.moves();
        } }]
      : [];

    const makeMove = (pid: number): LudiiMove => new LudiiMove({
      // @java SetScore.eval — ActionSetScore(pid, score, Boolean.FALSE)
      id: `setscore:${mover}:p${pid}:${score}`,
      label: `SetScore(P${pid}=${score})`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [new ActionSetScore({ player: pid, score, add: false })],
      deferredThens,
    });

    // @java SetScore.eval — when a roleType is given, expand to the real player
    // ids it denotes (All -> every player 1..n, Enemy/NonMover -> many, …) and
    // emit ONE set-score move per player. Resolving the role to a single
    // IntFunction (e.g. numPlayers+1 for All) wrote past the scores array and
    // crashed (Bide: pid 3 out of range [0, 3)).
    if (this.role != null) {
      const adapter = playersIndicesAdapter(ctx);
      const idPlayers = PlayersIndices.getIdRealPlayers(adapter, this.role);
      const moves: LudiiMove[] = [];
      for (const pid of idPlayers) moves.push(makeMove(pid));
      return moves;
    }

    if (playerId < 1) return [];
    return [makeMove(playerId)];
  }
}

/**
 * Minimal Context adapter exposing the method-shaped surface that
 * PlayersIndices.getIdRealPlayers calls, backed by the TS Context.
 * Teams are unsupported in the current TS state, so requiresTeams()=false and
 * the team accessors return neutral values (mirrors NoPieces' inlined handling).
 * @java other/context/Context — the subset PlayersIndices reads.
 */
function playersIndicesAdapter(ctx: Context): Parameters<typeof PlayersIndices.getIdRealPlayers>[0] {
  const st = ctx.state as unknown as { mover: number; next?: number; prev?: number };
  const numPlayers = ctx.game.numPlayers;
  const evalPlayer = (ctx as unknown as { _evalPlayer?: number })._evalPlayer;
  return {
    game: () => ({
      // @java game.players().size() == numPlayers + 1 (player list is 1-based, slot 0 reserved).
      players: () => ({ size: () => numPlayers + 1 }),
      requiresTeams: () => false,
    }),
    state: () => ({
      mover: () => st.mover,
      next: () => st.next ?? 0,
      prev: () => st.prev ?? 0,
      getTeam: () => 0,
      playerInTeam: () => false,
    }),
    player: () => evalPlayer ?? st.mover,
  };
}

function roleToIntFunction(role: RoleTypeFull | null): IntFunction {
  if (role === null) {
    throw new Error("SetScore: exactly one of player or role must be non-null.");
  }

  const owner = staticRoleOwner(role);
  if (owner !== null) return { eval: () => owner };

  return {
    eval: (ctx): number => {
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (role === "Prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (role === "Player") return ctx._evalPlayer ?? ctx.state.mover;
      if (role === "Shared" || role === "All") return ctx.game.numPlayers + 1;
      return ctx.state.mover;
    },
  };
}

function staticRoleOwner(role: RoleTypeFull): number | null {
  if (/^P\d+$/.test(role)) return Number(role.slice(1));
  if (role === "Neutral" || role === "Shared") return 0;
  return null;
}
