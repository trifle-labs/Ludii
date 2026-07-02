// @java Core/src/game/rules/play/moves/nonDecision/effect/Propose.java

/**
 * Is used to propose something to the other players.
 *
 * @java game/rules/play/moves/nonDecision/effect/Propose.java
 * @author Eric.Piette and cambolbro
 *
 * @example (propose "End")
 */

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../base.js";
import { ActionPropose } from "../../../../../../../action/action-propose.js";
import { Move as LudiiMove } from "../../../../../../../move.js";
import type { Then } from "./Then.js";

/** @java Constants.OFF = -1 */
const OFF = -1;

/** @java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * @java game/rules/play/moves/nonDecision/effect/Propose.java
 *
 * Java parity:
 *   public final class Propose extends Effect
 *   eval(Context): for each propositionInt, emit ActionPropose wrapped in a Move.
 */
export class Propose implements MovesFunction {
  /**
   * All the propositions (string labels).
   * @java Propose.propositions
   */
  private readonly propositions: string[];

  /**
   * The int representations of all the propositions.
   * @java Propose.propositionInts
   */
  private propositionInts: number[];

  /**
   * Optional subsequent moves.
   * @java Effect.then
   */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java Propose(String proposition, String[] propositions, Then then)
   *
   * @Or: pass either a single string (proposition) or string[] (propositions).
   *
   * @param proposition  A single proposition string.
   * @param propositions An array of proposition strings.
   * @param then         Optional subsequent moves.
   */
  public constructor(
    proposition: string | null,
    propositions: string[] | null,
    then?: Then | null,
  ) {
    // @java Propose.java:52-74
    let numNonNull = 0;
    if (proposition != null) {
      numNonNull++;
    }
    if (propositions != null) {
      numNonNull++;
    }

    if (numNonNull > 1) {
      throw new Error("Only one Or parameter can be non-null.");
    }

    if (propositions != null) {
      // @java Propose.java:64-66 — this.propositions = propositions;
      this.propositions = propositions;
    } else if (proposition != null) {
      // @java Propose.java:68-71 — this.propositions = new String[1]; [0] = proposition;
      this.propositions = [proposition];
    } else {
      this.propositions = [];
    }

    // @java Propose.java:73-74 — propositionInts = new int[...]; Arrays.fill(-1)
    this.propositionInts = new Array<number>(this.propositions.length).fill(UNDEFINED);
    this.thenMoves = then?.moves() ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Propose.java — eval(Context)
   *
   * Java parity (Propose.eval lines 80-106):
   *   1. new BaseMoves(super.then())
   *   2. For each propositionInt:
   *      a. ActionPropose(context.game().voteString(proposition), proposition)
   *      b. if isDecision() → action.setDecision(true)
   *      c. new Move(action)
   *      d. move.setFromNonDecision(Constants.OFF)
   *      e. move.setToNonDecision(Constants.OFF)
   *      f. move.setMover(context.state().mover())
   *      g. moves.moves().add(move)
   *   3. if then() != null: append then().moves() to each move's then()
   *   4. setMovesLudeme(this) meta-tag
   *   5. return moves
   */
  public eval(ctx: Context): Move[] {
    // @java Propose.java:82 — final BaseMoves moves = new BaseMoves(super.then());
    const mover = ctx.state.mover;

    // @java Then moves are consequents evaluated AT APPLY TIME, after the
    // Propose action has recorded the proposition. Evaluating them eagerly
    // here ran `(then (if (is Proposed "Conclude") (add …)))` BEFORE the
    // proposition existed, so Abrobad's conclude fill+scoring silently
    // no-opped. Defer via deferredThens like the other effect ludemes.
    const deferredThens = this.thenMoves != null
      ? [{ eval: (c: Context): Move[] => this.thenMoves!.eval(c) }]
      : [];

    const moves: Move[] = [];

    const game = ctx.game as unknown as {
      voteString?: (i: number) => string;
      registerVoteString?: (s: string) => number;
    };

    for (let pi = 0; pi < this.propositionInts.length; pi += 1) {
      // The compiler runs no preprocess pass, so propositionInts stay -1 until
      // registered LAZILY here (same pattern as IsDecided.eval). Without this,
      // game.voteString(-1) produced "-1" and the ActionPropose carried "-1"
      // instead of the proposition text — (is Proposed "Conclude") never
      // matched and Abrobad's conclude-end never fired.
      if (this.propositionInts[pi] === UNDEFINED && typeof game.registerVoteString === "function") {
        this.propositionInts[pi] = game.registerVoteString(this.propositions[pi]!);
      }
      const propositionInt = this.propositionInts[pi]!;
      // @java Propose.java:87 — context.game().voteString(proposition)
      const propositionText = propositionInt !== UNDEFINED && typeof game.voteString === "function"
        ? game.voteString(propositionInt)
        : this.propositions[pi]!;

      // @java Propose.java:87 — new ActionPropose(voteString, propositionInt)
      // TS ActionPropose takes a single string arg
      const action = new ActionPropose(propositionText);

      // @java Propose.java:88-89 — if (isDecision()) action.setDecision(true)
      // (isDecision() is a Moves-level flag; not tracked per-instance here)

      // @java Propose.java:90 — new Move(action)
      // @java Propose.java:91 — move.setFromNonDecision(Constants.OFF)
      // @java Propose.java:92 — move.setToNonDecision(Constants.OFF)
      // @java Propose.java:93 — move.setMover(context.state().mover())
      const move = new LudiiMove({
        id: "propose",
        label: `propose:${propositionText}`,
        siteIndices: [],
        mover,
        placedOwner: mover,
        actions: [action],
        fromSite: OFF,
        toSite: OFF,
      });

      // @java Propose.java:94 — moves.moves().add(move)
      // @java Propose.java:97-99 — if then(): append then().moves() as
      // APPLY-TIME consequents (deferredThens), not pre-evaluated moves.
      if (deferredThens.length === 0) {
        moves.push(move);
      } else {
        moves.push(new LudiiMove({
          id: "propose",
          label: `propose:${propositionText}`,
          siteIndices: [],
          mover,
          placedOwner: mover,
          actions: [action],
          fromSite: OFF,
          toSite: OFF,
          deferredThens,
        }));
      }
    }

    // @java Propose.java:101-103 — setMovesLudeme(this) on each move
    // (meta-tag only — no runtime effect in TS; skipped)

    return moves;
  }

  /**
   * @java Propose.canMoveTo(Context, int)
   * Returns false — Propose never generates a move to a target site.
   */
  public canMoveTo(_ctx: Context, _target: number): boolean {
    // @java Propose.java:111-114
    return false;
  }

  /**
   * @java Propose.isStatic()
   * Always returns false for Propose.
   */
  public isStatic(): boolean {
    // @java Propose.java:190-194
    return false;
  }

  /**
   * @java Propose.preprocess(Game)
   *
   * Registers each proposition string with the game's vote registry,
   * storing the resulting integer index in propositionInts.
   */
  public preprocess(game: unknown): void {
    // @java Propose.java:198-203
    const g = game as unknown as { registerVoteString?: (s: string) => number };
    for (let i = 0; i < this.propositions.length; ++i) {
      if (typeof g.registerVoteString === "function") {
        this.propositionInts[i] = g.registerVoteString(this.propositions[i]!);
      }
    }
    if (this.thenMoves != null) {
      (this.thenMoves as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    }
  }

  /**
   * @java Propose.gameFlags(Game)
   * Returns GameType.Vote flag.
   */
  public gameFlags(game: unknown): number {
    // @java Propose.java:119-127 — GameType.Vote | super.gameFlags(game) | then
    // GameType.Vote = 1L << 20 in Java; use a symbolic constant here.
    const VOTE_FLAG = 1 << 20;
    let flags = VOTE_FLAG;
    if (this.thenMoves != null) {
      flags |= (this.thenMoves as unknown as { gameFlags?: (g: unknown) => number }).gameFlags?.(game) ?? 0;
    }
    return flags;
  }

  /**
   * @java Propose.toEnglish(Game)
   */
  public toEnglish(game: unknown): string {
    let thenString = "";
    if (this.thenMoves != null) {
      thenString = " then " + ((this.thenMoves as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? "");
    }
    return `propose the following options ${JSON.stringify(this.propositions)}${thenString}`;
  }
}
