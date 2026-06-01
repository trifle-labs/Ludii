/**
 * @java game/Game.java Game (1:1 port subset)
 *
 * The core game object for the 1:1 Java→TS port.
 *
 * Supports the placement-game case (Tic-Tac-Toe):
 *   - create(): builds the initial Context
 *   - start(ctx): applies start rules (none for TTT), returns initial Context
 *   - moves(ctx): generates legal moves via rules.play.eval(ctx)
 *   - apply(ctx, move): applies a move, checks end conditions, advances mover
 *   - over(ctx): true if the trial is over
 *
 * The play loop mirrors Java's Game.apply() / applyInternal():
 *   1. Apply the move's actions to the state.
 *   2. Evaluate end rules. If one fires, mark the trial over.
 *   3. If not over, check for all-pass draw (both players forced-pass).
 *   4. Advance the mover (rotate to next player).
 *   5. Check if the new mover is stalemated (no legal moves → forced pass flag).
 *   6. Record the move in the trial.
 *
 * The Context is augmented with `_radials` (the board's precomputed radials)
 * and `_evalTo` (mutable eval scratch) for IsLine to read.
 *
 * @java game/Game.java — create/start/moves/apply/over
 */

import { Context } from "../context.js";
import type { Game } from "../game.js";
import { Move } from "../move.js";
import { ActionPass } from "../action/action-pass.js";
import { State } from "../state.js";
import { Trial } from "../trial.js";

import type { Equipment1to1 } from "./game/equipment/Equipment1to1.js";
import type { Rules1to1 } from "./game/rules/Rules1to1.js";
import type { CellFlatRadials } from "./topology-radials.js";

// ---------------------------------------------------------------------------
// Extended context type for the 1:1 path
// ---------------------------------------------------------------------------

/**
 * A Context augmented with the radials table and eval-scratch.
 * The 1:1 ludemes access ctx._radials (board radials) and ctx._evalTo (pivot).
 */
export type Context1to1 = Context & {
  _radials: readonly CellFlatRadials[];
};

function attachRadials(ctx: Context, radials: readonly CellFlatRadials[]): Context1to1 {
  const c = ctx as Context1to1;
  c._radials = radials;
  c._evalTo = -1;
  c._evalFrom = -1;
  c._evalValue = 0;
  return c;
}

// ---------------------------------------------------------------------------
// Game1to1
// ---------------------------------------------------------------------------

export class Game1to1 implements Game {
  /** @java Game.name */
  public readonly name: string;
  /** @java Game.id — same as name for 1:1 port */
  public readonly id: string;
  /** Number of players. @java Game.players().count() */
  public readonly numPlayers: number;
  /** @java Game.board().width() */
  public readonly width: number;
  /** @java Game.board().height() */
  public readonly height: number;
  /** @java Game.numSites() */
  public readonly numSites: number;
  /** Equipment (board + pieces). */
  public readonly equipment: Equipment1to1;
  /** Rules (play + end). */
  public readonly rules: Rules1to1;

  /** Component labels array (index 0 unused, 1-based). */
  private readonly componentLabels: string[];

  public constructor(
    name: string,
    numPlayers: number,
    equipment: Equipment1to1,
    rules: Rules1to1,
  ) {
    this.name = name;
    this.id = name;
    this.numPlayers = numPlayers;
    this.equipment = equipment;
    this.rules = rules;
    this.width = equipment.board.width;
    this.height = equipment.board.height;
    this.numSites = equipment.board.numSites;

    // Build component labels: [unused, piece1label, piece2label, ...]
    // @java Game.componentLabels() — used to populate State.componentLabels
    this.componentLabels = new Array(equipment.pieces.length + 1).fill("");
    for (const piece of equipment.pieces) {
      this.componentLabels[piece.index] = `${piece.name}${piece.owner}`;
    }
  }

  /**
   * @java game/Game.java — start(context)
   *
   * Returns the initial Context for a new game. For TTT there are no start
   * rules (no (start ...) block), so we just create the empty initial state.
   */
  public start(): Context {
    const numSites = this.equipment.board.numSites;
    const cells = new Array<number>(numSites).fill(0);

    const state = new State(1, cells, this.componentLabels, {
      numPlayers: this.numPlayers,
    });

    const trial = new Trial([], false, -1);
    const ctx = new Context(this, state, trial);

    return attachRadials(ctx, this.equipment.board.radials);
  }

  /**
   * @java game/Game.java — moves(context)
   *
   * Returns legal moves for the current state. If no moves are available,
   * returns a single forced-pass move (Java's stalemated player behaviour).
   */
  public moves(context: Context): readonly Move[] {
    const ctx = context as Context1to1;
    // Ensure radials are always attached (survives withRng/withState copies).
    ctx._radials = ctx._radials ?? this.equipment.board.radials;
    ctx._evalTo = -1;
    ctx._evalFrom = -1;
    ctx._evalValue = 0;

    const generated = this.rules.play.moves.eval(ctx);
    if (generated.length > 0) {
      return generated;
    }

    // Stalemated: emit a forced pass.
    // @java Game.java — forced pass when no legal moves
    const passAction = new ActionPass();
    const passMove = new Move({
      id: "pass",
      label: "Pass",
      siteIndices: [0], // dummy site; Pass move is valid
      mover: ctx.state.mover,
      placedOwner: ctx.state.mover,
      actions: [passAction],
    });
    return [passMove];
  }

  /**
   * @java game/Game.java — apply(context, move)
   *
   * Applies a move and returns the new Context.
   *
   * Play loop (mirroring Java Game.apply / applyInternal):
   *   1. Apply move actions to state.
   *   2. Set _evalTo to move.to() for end-rule evaluation.
   *   3. Evaluate end rules. If one fires, mark trial over.
   *   4. If not over, check all-pass draw.
   *   5. Advance mover (rotate).
   *   6. Record move in trial.
   */
  public apply(context: Context, move: Move): Context {
    if (context.over) {
      throw new Error("Cannot apply a move to a finished game.");
    }

    // Step 1: Apply move actions.
    const newState = move.applyTo(context.state, context.rng);

    // Step 2: Build eval context with the move recorded.
    // Set _evalTo so IsLine's (through: LastTo) resolves to the placed site.
    const evalTrial = context.trial.withMove(move, false, -1);
    const evalCtx = new Context(this, newState, evalTrial, context.rng) as Context1to1;
    evalCtx._radials = (context as Context1to1)._radials ?? this.equipment.board.radials;
    evalCtx._evalTo = move.to();
    evalCtx._evalFrom = move.from();
    evalCtx._evalValue = 0;

    // Step 3: Evaluate end rules.
    let over = false;
    let winner = -1;
    let ranking: readonly number[] | undefined;

    const endResult = this.rules.end.eval(evalCtx);
    if (endResult !== null && endResult.over) {
      over = true;
      winner = endResult.winner;
      ranking = endResult.ranking;
    }

    // Step 4: All-pass draw.
    // Java parity: if not over and all players have force-passed, it's a draw.
    // We detect this by checking if the last N moves (one per player) were all passes.
    if (!over && this.allPassed(evalTrial)) {
      over = true;
      winner = 0; // draw
    }

    // Step 5: Advance mover.
    let advanced = newState;
    if (!over) {
      const nextMover = (newState.mover % this.numPlayers) + 1;
      advanced = newState.withMover(nextMover);
      // @java Game.java:3200 — bump numTurn when player changes
      advanced = advanced.withNewTurn();
      // Increment counter (Java: state.incrCounter())
      advanced = advanced.withCounter(advanced.counter + 1);
    } else {
      // Still increment counter even when over.
      advanced = newState.withCounter(newState.counter + 1);
    }

    // Step 6: Record move in trial.
    const finalWinner = over ? winner : -1;
    let trial = context.trial.withMove(move, over, finalWinner);
    if (ranking !== undefined) trial = trial.withRanking(ranking);
    trial = trial.saveState(advanced);

    const newCtx = new Context(this, advanced, trial, context.rng) as Context1to1;
    newCtx._radials = (context as Context1to1)._radials ?? this.equipment.board.radials;
    newCtx._evalTo = -1;
    newCtx._evalFrom = -1;
    newCtx._evalValue = 0;
    return newCtx;
  }

  /** @java game/Game.java — over(context). Returns context.over. */
  public over(context: Context): boolean {
    return context.over;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Detect all-pass draw: if the last `numPlayers` moves in the trial are all
   * forced passes, the game is a draw.
   *
   * @java game/Game.java — allPassed (End.eval implicit draw for no-pass games)
   */
  private allPassed(trial: Trial): boolean {
    const moves = trial.moves;
    const n = this.numPlayers;
    if (moves.length < n) return false;
    for (let i = moves.length - 1; i >= moves.length - n; i--) {
      const m = moves[i];
      if (!m || !m.isPass()) return false;
    }
    return true;
  }
}
