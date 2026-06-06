// @java Core/src/game/rules/play/moves/nonDecision/effect/Vote.java

/**
 * Is used to vote something to the other players.
 *
 * @java game/rules/play/moves/nonDecision/effect/Vote.java
 * @author Eric.Piette and cambolbro
 *
 * @example (vote "End")
 */

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../base.js";
import { ActionVote } from "../../../../../../../action/action-vote.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

/** @java Constants.OFF = -1 */
const OFF = -1;

/** @java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * @java game/rules/play/moves/nonDecision/effect/Vote.java
 *
 * Java parity:
 *   public final class Vote extends Effect
 *   eval(Context): for each voteInt, emit ActionVote wrapped in a Move.
 */
export class Vote implements MovesFunction {
  /**
   * All the votes (string labels).
   * @java Vote.votes
   */
  private readonly votes: string[];

  /**
   * The int representations of all the votes.
   * @java Vote.voteInts
   */
  private voteInts: number[];

  /**
   * Optional subsequent moves.
   * @java Effect.then
   */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java Vote(String vote, String[] votes, Then then)
   *
   * @Or: pass either a single string (vote) or string[] (votes).
   *
   * @param vote      A single vote string.
   * @param votes     An array of vote strings.
   * @param thenMoves Optional subsequent moves.
   */
  public constructor(opts: {
    vote?: string | null;
    votes?: string[] | null;
    then?: MovesFunction | null;
  }) {
    // @java Vote.java:52-74
    if (opts.votes != null) {
      // @java Vote.java:64-66 — this.votes = votes;
      this.votes = opts.votes;
    } else if (opts.vote != null) {
      // @java Vote.java:68-71 — this.votes = new String[1]; [0] = vote;
      this.votes = [opts.vote];
    } else {
      this.votes = [];
    }

    // @java Vote.java:73-74 — voteInts = new int[...]; Arrays.fill(-1)
    this.voteInts = new Array<number>(this.votes.length).fill(UNDEFINED);
    this.thenMoves = opts.then ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Vote.java — eval(Context)
   *
   * Java parity (Vote.eval lines 82-103):
   *   1. new BaseMoves(super.then())
   *   2. For each voteInt:
   *      a. ActionVote(context.game().voteString(vote), vote)
   *      b. if isDecision() → action.setDecision(true)
   *      c. new Move(action)
   *      d. move.setFromNonDecision(Constants.OFF)
   *      e. move.setToNonDecision(Constants.OFF)
   *      f. move.setMover(context.state().mover())
   *      g. moves.moves().add(move)
   *   3. if then() != null: append then().moves() to each move's then()
   *   4. return moves (no setMovesLudeme in Vote — Vote.java omits that loop)
   */
  public eval(ctx: Context): Move[] {
    // @java Vote.java:84 — final BaseMoves moves = new BaseMoves(super.then());
    const mover = ctx.state.mover;

    // @java Vote.java:86 — for (final int vote : voteInts)
    const thenList: Move[] = this.thenMoves != null ? this.thenMoves.eval(ctx) : [];

    const moves: Move[] = [];

    const game = ctx.game as unknown as { voteString?: (i: number) => string };

    for (const voteInt of this.voteInts) {
      // @java Vote.java:88 — NOTE: if -1 here, preprocess() was not called!
      // @java Vote.java:89 — context.game().voteString(vote)
      const voteText = typeof game.voteString === "function"
        ? game.voteString(voteInt)
        : String(voteInt);

      // @java Vote.java:89 — new ActionVote(voteString, voteInt)
      // TS ActionVote takes a single string arg
      const action = new ActionVote(voteText);

      // @java Vote.java:90-91 — if (isDecision()) action.setDecision(true)
      // (isDecision() is a Moves-level flag; not tracked per-instance here)

      // @java Vote.java:92 — new Move(action)
      // @java Vote.java:93 — move.setFromNonDecision(Constants.OFF)
      // @java Vote.java:94 — move.setToNonDecision(Constants.OFF)
      // @java Vote.java:95 — move.setMover(context.state().mover())
      const move = new LudiiMove({
        id: "vote",
        label: `vote:${voteText}`,
        siteIndices: [],
        mover,
        placedOwner: mover,
        actions: [action],
        fromSite: OFF,
        toSite: OFF,
      });

      // @java Vote.java:96 — moves.moves().add(move)
      // @java Vote.java:99-101 — if then(): append then().moves() to each move's then()
      if (thenList.length === 0) {
        moves.push(move);
      } else {
        moves.push(new LudiiMove({
          id: "vote",
          label: `vote:${voteText}`,
          siteIndices: [],
          mover,
          placedOwner: mover,
          actions: [action],
          fromSite: OFF,
          toSite: OFF,
          then: thenList,
        }));
      }
    }

    // @java Vote.java — NOTE: Vote.java does NOT have the setMovesLudeme loop
    // that Propose.java has; parity is correct to omit it.

    return moves;
  }

  /**
   * @java Vote.isStatic()
   * Always returns false for Vote.
   */
  public isStatic(): boolean {
    // @java Vote.java:182-185
    return false;
  }

  /**
   * @java Vote.preprocess(Game)
   *
   * Registers each vote string with the game's vote registry,
   * storing the resulting integer index in voteInts.
   */
  public preprocess(game: unknown): void {
    // @java Vote.java:188-193
    const g = game as unknown as { registerVoteString?: (s: string) => number };
    for (let i = 0; i < this.votes.length; ++i) {
      if (typeof g.registerVoteString === "function") {
        this.voteInts[i] = g.registerVoteString(this.votes[i]!);
      }
    }
    if (this.thenMoves != null) {
      (this.thenMoves as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    }
  }

  /**
   * @java Vote.gameFlags(Game)
   * Returns GameType.Vote flag.
   */
  public gameFlags(game: unknown): number {
    // @java Vote.java:108-115 — GameType.Vote | super.gameFlags(game) | then
    // GameType.Vote = 1L << 20 in Java; use a symbolic constant here.
    const VOTE_FLAG = 1 << 20;
    let flags = VOTE_FLAG;
    if (this.thenMoves != null) {
      flags |= (this.thenMoves as unknown as { gameFlags?: (g: unknown) => number }).gameFlags?.(game) ?? 0;
    }
    return flags;
  }

  /**
   * @java Vote.toEnglish(Game)
   */
  public toEnglish(game: unknown): string {
    let thenString = "";
    if (this.thenMoves != null) {
      thenString = " then " + ((this.thenMoves as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? "");
    }
    return `cast a vote with possible vote options ${JSON.stringify(this.votes)}${thenString}`;
  }
}
