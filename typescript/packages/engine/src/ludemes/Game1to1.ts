/**
 * @java game/Game.java Game (1:1 port subset)
 *
 * The core game object for the 1:1 Java→TS port.
 *
 * Supports placement, movement, and hand-based games, including phase games:
 *   - start(): builds the initial Context applying start rules
 *   - moves(ctx): generates legal moves via the current phase's play.eval(ctx)
 *   - apply(ctx, move): applies a move, checks end conditions, advances mover,
 *                       and runs phase-transition logic after every move.
 *   - over(ctx): true if the trial is over
 *
 * Phase logic mirrors Java Game.apply() / applyInternal():
 *   @java game/Game.java:3119–3141
 *   After applying the move (and checking end conditions), if the game has
 *   phases and the game is still active, iterate all players 1..numPlayers
 *   and evaluate their current phase's nextPhase conditions in order;
 *   the first condition whose eval != UNDEFINED fires and advances that
 *   player to the returned phase index.
 *
 * Per-phase end rules:
 *   @java game/Game.java:3061–3066
 *   Before evaluating the global end rule, evaluate the current mover's
 *   current phase's end rule (if present).
 *
 * Phase-aware move generation:
 *   @java game/Game.java:2850–2852
 *   For alternating-move games, look up phases[state.currentPhase(mover)].play.
 *
 * Start rules supported:
 *   (place "PieceName1" {sites...})          — place pieces at given sites
 *   (place "PieceName" "Hand" count:N)       — fill hand with N pieces
 *   (place "PieceName" coord)                — place piece at named coord
 *   (start (set Score ...))                  — no-op (scores default to 0)
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
import type { Phase } from "./game/rules/phase/Phase.js";
import type { StartRule } from "./game/rules/start/StartRule.js";
import type { CellFlatRadials } from "./topology-radials.js";
import type { Trajectories } from "../eval/graph/trajectories.js";

// ---------------------------------------------------------------------------
// Extended context type for the 1:1 path
// ---------------------------------------------------------------------------

/**
 * A Context augmented with the radials table and eval-scratch.
 * The 1:1 ludemes access ctx._radials (board radials) and ctx._evalTo (pivot).
 * For graph boards, _trajectories is also attached for direction-aware queries.
 */
export type Context1to1 = Context & {
  _radials: readonly CellFlatRadials[];
  /** Graph Trajectories object for non-square boards; null for square boards. */
  _trajectories?: Trajectories | null;
};

function attachRadials(
  ctx: Context,
  radials: readonly CellFlatRadials[],
  trajectories?: Trajectories | null,
): Context1to1 {
  const c = ctx as Context1to1;
  c._radials = radials;
  c._trajectories = trajectories ?? null;
  c._evalTo = -1;
  c._evalFrom = -1;
  c._evalValue = 0;
  return c;
}

// Java constant: UNDEFINED = -1
const UNDEFINED = -1;

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
  /** Equipment (board + pieces + hands). */
  public readonly equipment: Equipment1to1;
  /** Rules (play + end + optional phases). */
  public readonly rules: Rules1to1;
  /** Optional start rules. @java game/rules/start/StartRules.java */
  public readonly startRules: readonly StartRule[];

  /**
   * Whether the game uses explicit (move Pass) ludemes.
   * When true, the all-pass draw heuristic is disabled.
   *
   * @java game/rules/play/moves/nonDecision/effect/Pass.java — gameFlags |= GameType.NotAllPass
   * @java game/Game.java:requiresAllPass() — returns false when NotAllPass is set
   */
  public readonly notAllPass: boolean;

  /** Component labels array (index 0 unused, 1-based). */
  private readonly componentLabels: string[];

  public constructor(
    name: string,
    numPlayers: number,
    equipment: Equipment1to1,
    rules: Rules1to1,
    startRules: StartRule[] = [],
    notAllPass = false,
  ) {
    this.name = name;
    this.id = name;
    this.numPlayers = numPlayers;
    this.equipment = equipment;
    this.rules = rules;
    this.startRules = startRules;
    this.notAllPass = notAllPass;
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
   * Returns the initial Context for a new game. Applies start rules to
   * set up the initial board position.
   */
  public start(): Context {
    // Use totalSites to include hand slots in the state.
    const totalSites = this.equipment.totalSites;
    const cells = new Array<number>(totalSites).fill(0);
    const whats = new Array<number>(totalSites).fill(0);
    const countAt = new Array<number>(totalSites).fill(0);

    // Apply start rules.
    // @java game/Game.java — start(): applies ActionAdd for each start placement
    for (const rule of this.startRules) {
      rule.applyToInitialState(cells, whats, countAt, this.equipment, this.numPlayers);
    }

    // Compute initial phase indices for each player.
    // @java other/state/State.java — initPhase(game)
    // For each player, scan phases in order and assign the first matching one:
    //   - phase.ownerPlayerId === pid → assign that phase
    //   - phase.ownerPlayerId === 0 (Shared) → assign that phase
    const initialPhases = new Array(this.numPlayers + 1).fill(0);
    if (this.rules.phases !== null) {
      const phases = this.rules.phases;
      for (let pid = 1; pid <= this.numPlayers; pid++) {
        for (let idx = 0; idx < phases.length; idx++) {
          const phase = phases[idx]!;
          const owner = phase.ownerPlayerId;
          if (owner === pid || owner === 0) {
            initialPhases[pid] = idx;
            break;
          }
        }
      }
    }

    const state = new State(1, cells, this.componentLabels, {
      numPlayers: this.numPlayers,
      whats,
      countAt,
      phases: initialPhases,
    });

    const trial = new Trial([], false, -1);
    const ctx = new Context(this, state, trial);

    return attachRadials(ctx, this.equipment.board.radials, this.equipment.board.trajectories);
  }

  /**
   * @java game/Game.java — moves(context)
   *
   * Returns legal moves for the current state.
   *
   * For phase games: uses phases[state.currentPhase(mover)].play.
   * @java game/Game.java:2849–2852
   *
   * If no moves are available, returns a single forced-pass move
   * (Java's stalemated player behaviour).
   */
  public moves(context: Context): readonly Move[] {
    const ctx = context as Context1to1;
    // Ensure radials are always attached (survives withRng/withState copies).
    ctx._radials = ctx._radials ?? this.equipment.board.radials;
    ctx._trajectories = ctx._trajectories ?? this.equipment.board.trajectories;
    ctx._evalTo = -1;
    ctx._evalFrom = -1;
    ctx._evalValue = 0;

    const movesGen = this.getPlayForMover(ctx);
    const generated = movesGen.moves.eval(ctx);
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
   *   3a. Evaluate per-phase end rule (if game has phases).   @java 3061–3066
   *   3b. Evaluate global end rules.
   *   4. If not over, check all-pass draw.
   *   5. If still active, evaluate nextPhase conditions for all players.  @java 3119–3141
   *   6. Advance mover (rotate).
   *   7. Update stalemated flag for new mover.
   *   8. Record move in trial.
   */
  public apply(context: Context, move: Move): Context {
    if (context.over) {
      throw new Error("Cannot apply a move to a finished game.");
    }

    const mover = context.state.mover;

    // Step 1: Apply move actions.
    const newState = move.applyTo(context.state, context.rng);

    // Step 2: Build eval context with the move recorded.
    // Set _evalTo so IsLine's (through: LastTo) resolves to the placed site.
    const evalTrial = context.trial.withMove(move, false, -1);
    const evalCtx = new Context(this, newState, evalTrial, context.rng) as Context1to1;
    evalCtx._radials = (context as Context1to1)._radials ?? this.equipment.board.radials;
    evalCtx._trajectories = (context as Context1to1)._trajectories ?? this.equipment.board.trajectories;
    evalCtx._evalTo = move.to();
    evalCtx._evalFrom = move.from();
    evalCtx._evalValue = 0;

    // Step 3a: Evaluate per-phase end rule.
    // @java game/Game.java:3061–3066 — end rule of current phase for mover
    let over = false;
    let winner = -1;
    let ranking: readonly number[] | undefined;

    if (this.rules.phases !== null) {
      const phaseIdx = newState.phase(mover);
      const phases = this.rules.phases;
      if (phaseIdx >= 0 && phaseIdx < phases.length) {
        const phaseEnd = phases[phaseIdx]!.end;
        if (phaseEnd !== null) {
          const phaseEndResult = phaseEnd.eval(evalCtx);
          if (phaseEndResult !== null && phaseEndResult.over) {
            over = true;
            winner = phaseEndResult.winner;
            ranking = phaseEndResult.ranking;
          }
        }
      }
    }

    // Step 3b: Evaluate global end rules.
    if (!over) {
      const endResult = this.rules.end.eval(evalCtx);
      if (endResult !== null && endResult.over) {
        over = true;
        winner = endResult.winner;
        ranking = endResult.ranking;
      }
    }

    // Step 4: All-pass draw.
    // @java game/Game.java:End.eval — only fires if requiresAllPass() (i.e. no explicit (move Pass))
    // @java game/rules/play/moves/nonDecision/effect/Pass.java — sets GameType.NotAllPass flag
    if (!over && !this.notAllPass && this.allPassed(evalTrial)) {
      over = true;
      winner = 0; // draw
    }

    // Step 5: Phase transitions (only when game is still active).
    // @java game/Game.java:3117–3141
    // "We update the current Phase for each player if this is a game with phases."
    let stateAfterPhase = newState;
    if (!over && this.rules.phases !== null) {
      const phases = this.rules.phases;
      for (let pid = 1; pid <= this.numPlayers; pid++) {
        const currentPhaseIdx = stateAfterPhase.phase(pid);
        if (currentPhaseIdx < 0 || currentPhaseIdx >= phases.length) continue;
        const currentPhase = phases[currentPhaseIdx]!;

        for (const np of currentPhase.nextPhases) {
          // @java NextPhase.who().eval(context): who == players.count()+1 means Shared/All
          const whoVal = np.who.eval(evalCtx);
          const isShared = whoVal === this.numPlayers + 1;
          if (!isShared && pid !== whoVal) continue;

          // @java NextPhase.eval(context): returns targetPhaseIdx or UNDEFINED
          if (np.cond.eval(evalCtx)) {
            // Resolve target index
            let targetIdx: number;
            if (np.targetName === null) {
              // Wrap to next in list
              targetIdx = (currentPhaseIdx + 1) % phases.length;
            } else {
              targetIdx = np.targetIndex;
            }
            if (targetIdx !== UNDEFINED && targetIdx !== currentPhaseIdx) {
              stateAfterPhase = stateAfterPhase.withPhase(pid, targetIdx);
            }
            break; // first firing condition wins
          }
        }
      }
    }

    // Step 6: Advance mover.
    // @java game/Game.java:3193–3206 — rotate mover unless move.moveAgain or
    // the current move includes an ActionSetNextPlayer that overrides the player.
    //
    // Key: only use state.next if it was SET by the CURRENT MOVE's actions.
    // This avoids picking up a stale next-player from a previous (then (moveAgain)).
    let advanced = stateAfterPhase;
    if (!over) {
      // Find the ActionSetNextPlayer in the current move's actions, if any.
      // @java Game.java:3195 — the "next" override from ActionSetNextPlayer
      const setNextAction = move.actions.find(a => a.actionType() === "SetNextPlayer");
      const dynamicNextOverride: number = setNextAction ? setNextAction.who() : 0;

      let nextMover: number;
      if (move.moveAgain) {
        // Static (then (moveAgain)) flag: keep the same player.
        // The ActionSetNextPlayer(mover) we added also sets next=mover (same).
        nextMover = newState.mover;
      } else if (dynamicNextOverride > 0) {
        // Dynamic ActionSetNextPlayer from current move's effects.
        nextMover = dynamicNextOverride;
      } else {
        nextMover = (newState.mover % this.numPlayers) + 1;
      }
      advanced = advanced.withMover(nextMover);
      // Always clear state.next after consumption.
      // @java ludeme-game.ts — advanced = phased.withMover(nextMover).withNext(0)
      advanced = advanced.withNext(0);
      if (nextMover !== newState.mover) {
        // @java Game.java:3200 — bump numTurn when player changes
        advanced = advanced.withNewTurn();
      }
      // Increment counter (Java: state.incrCounter())
      advanced = advanced.withCounter(advanced.counter + 1);
    } else {
      // Still increment counter even when over.
      advanced = advanced.withCounter(advanced.counter + 1);
    }

    // Step 7: Update stalemated flag for the new mover.
    // @java Game.java — computeStalemated: called after advancing the mover
    // so that (no Moves Next) can read the correct cached value.
    if (!over) {
      advanced = this.computeStalemated(advanced, evalCtx);
    }

    // Step 8: Record move in trial.
    const finalWinner = over ? winner : -1;
    let trial = context.trial.withMove(move, over, finalWinner);
    if (ranking !== undefined) trial = trial.withRanking(ranking);
    trial = trial.saveState(advanced);

    const newCtx = new Context(this, advanced, trial, context.rng) as Context1to1;
    newCtx._radials = (context as Context1to1)._radials ?? this.equipment.board.radials;
    newCtx._trajectories = (context as Context1to1)._trajectories ?? this.equipment.board.trajectories;
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
   * Return the play rules for the current mover.
   *
   * For phase games: looks up phases[state.currentPhase(mover)].play.
   * @java game/Game.java:2849–2852 — indexPhase = state.currentPhase(mover)
   *
   * For bare games: returns rules.play.
   */
  private getPlayForMover(ctx: Context1to1): Rules1to1["play"] {
    if (this.rules.phases !== null) {
      const mover = ctx.state.mover;
      const phaseIdx = ctx.state.phase(mover);
      const phases = this.rules.phases;
      if (phaseIdx >= 0 && phaseIdx < phases.length) {
        return phases[phaseIdx]!.play;
      }
      // Fallback to phase 0 if index out of range
      return phases[0]!.play;
    }
    return this.rules.play;
  }

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

  /**
   * Update the stalemated flag for the new mover.
   * @java Game.java — computeStalemated(Context)
   *
   * Temporarily builds a context for the new mover and checks if they have
   * any legal moves. Updates state.stalemated[newMover] accordingly.
   */
  private computeStalemated(state: State, baseCtx: Context1to1): State {
    const newMover = state.mover;
    // Build a temporary context for the new mover to check for legal moves.
    const tempTrial = baseCtx.trial;
    const tempCtx = new Context(this, state, tempTrial, baseCtx.rng) as Context1to1;
    tempCtx._radials = baseCtx._radials;
    tempCtx._trajectories = baseCtx._trajectories;
    tempCtx._evalTo = -1;
    tempCtx._evalFrom = -1;
    tempCtx._evalValue = 0;

    const playForMover = this.getPlayForMover(tempCtx);
    const legalMoves = playForMover.moves.eval(tempCtx);
    const isStalemated = legalMoves.length === 0;

    return state.withStalemated(newMover, isStalemated);
  }
}
