/**
 * Java parity: a focused port of the dice-driven race / push-your-luck
 * family — equivalent to Java Ludii's `(equipment { (dice "Die" N M) })`
 * coupled with a `(play (move (roll))` / `(move (stop))` decision pair.
 *
 * Two flavours are supported:
 *
 *   - "pig"  — classic Pig. Each turn the mover may Roll or Hold. Rolling
 *              re-rolls the dice; if any die shows 1 the turn total is
 *              lost and the turn ends. Holding banks the accumulated
 *              total into the mover's score and ends the turn. First to
 *              `goalScore` wins.
 *
 *   - "race" — single-roll race. Each turn the mover Rolls and advances
 *              along a 1-D track by the pip total. First to reach/exceed
 *              `trackLength` wins. There is no decision branching: the
 *              only legal move is Roll.
 *
 * Rolls are consumed from `context.rng` so playouts and replays remain
 * deterministic given a seed. Roll outcomes are stored in
 * `state.diceValues` and the per-turn accumulator lives in
 * `state.temp(mover)` to keep `State` immutable.
 */

import { ActionSetScore, ActionSetTemp } from "./action/index.js";
import { ConceptSet } from "./concept.js";
import { Context } from "./context.js";
import type { Game } from "./game.js";
import { Move } from "./move.js";
import { SeededRng } from "./rng.js";
import { State } from "./state.js";
import { Trial } from "./trial.js";

export type DiceMode = "pig" | "race";

export interface DiceGameOptions {
  readonly id: string;
  readonly name: string;
  readonly numPlayers: number;
  readonly numDice?: number;
  readonly diceFaces?: number;
  readonly mode?: DiceMode;
  /** Pig-mode target score; required when mode === "pig". */
  readonly goalScore?: number;
  /** Race-mode track length; required when mode === "race". */
  readonly trackLength?: number;
  readonly initialMover?: number;
  readonly componentLabels?: readonly string[];
  /** Default RNG seed used when start() is called without a custom one. */
  readonly defaultSeed?: number;
}

const DEFAULT_LABELS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];

function rollDice(rng: SeededRng, numDice: number, faces: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < numDice; i += 1) {
    out.push(rng.nextInt(faces) + 1);
  }
  return out;
}

function nextMover(mover: number, numPlayers: number): number {
  return (mover % numPlayers) + 1;
}

export class DiceGame implements Game {
  public readonly id: string;
  public readonly name: string;
  public readonly numPlayers: number;
  public readonly numDice: number;
  public readonly diceFaces: number;
  public readonly mode: DiceMode;
  public readonly goalScore: number;
  public readonly trackLength: number;
  public readonly componentLabels: readonly string[];
  public readonly width = 1;
  public readonly height = 1;
  private readonly initialMover: number;
  private readonly defaultSeed: number;

  public get siteCount(): number {
    return 1;
  }
  public get numSites(): number {
    return 1;
  }

  public constructor(options: DiceGameOptions) {
    if (!Number.isInteger(options.numPlayers) || options.numPlayers < 2) {
      throw new Error(
        `numPlayers must be an integer >= 2; got ${options.numPlayers}.`,
      );
    }
    this.id = options.id;
    this.name = options.name;
    this.numPlayers = options.numPlayers;
    this.numDice = options.numDice ?? 2;
    this.diceFaces = options.diceFaces ?? 6;
    this.mode = options.mode ?? "pig";
    if (this.numDice < 1 || !Number.isInteger(this.numDice)) {
      throw new Error(
        `numDice must be a positive integer; got ${this.numDice}.`,
      );
    }
    if (this.diceFaces < 2 || !Number.isInteger(this.diceFaces)) {
      throw new Error(
        `diceFaces must be an integer >= 2; got ${this.diceFaces}.`,
      );
    }
    if (this.mode === "pig") {
      this.goalScore = options.goalScore ?? 100;
      this.trackLength = 0;
      if (this.goalScore < 1) {
        throw new Error(`goalScore must be >= 1; got ${this.goalScore}.`);
      }
    } else {
      this.trackLength = options.trackLength ?? 30;
      this.goalScore = 0;
      if (this.trackLength < 1) {
        throw new Error(`trackLength must be >= 1; got ${this.trackLength}.`);
      }
    }
    const labels =
      options.componentLabels ?? DEFAULT_LABELS.slice(0, options.numPlayers);
    if (labels.length < options.numPlayers) {
      throw new Error(
        `componentLabels needs ${options.numPlayers} entries; got ${labels.length}.`,
      );
    }
    this.componentLabels = Object.freeze([...labels]);
    const mover = options.initialMover ?? 1;
    if (!Number.isInteger(mover) || mover < 1 || mover > this.numPlayers) {
      throw new Error(
        `initialMover must be 1..${this.numPlayers}; got ${mover}.`,
      );
    }
    this.initialMover = mover;
    this.defaultSeed = options.defaultSeed ?? 0x9e3779b1;
  }

  public start(rng?: SeededRng): Context {
    const cells = [0];
    const state = new State(this.initialMover, cells, this.componentLabels);
    const trial = new Trial([], false, -1).saveState(state);
    return new Context(
      this,
      state,
      trial,
      rng ?? new SeededRng(this.defaultSeed),
    );
  }

  public moves(context: Context): readonly Move[] {
    if (context.over) return [];
    const mover = context.state.mover;
    const label = this.componentLabels[mover - 1] ?? `P${mover}`;
    if (this.mode === "race") {
      return [this.buildRollMove(context, mover, label)];
    }
    return [
      this.buildRollMove(context, mover, label),
      this.buildHoldMove(context, mover, label),
    ];
  }

  private buildRollMove(context: Context, mover: number, label: string): Move {
    return new Move({
      id: `m${context.trial.numMoves}:roll:${mover}`,
      label: `Roll ${label}`,
      siteIndices: [0],
      mover,
      placedOwner: mover,
      // No actions: roll is realised in apply() via the RNG, which is
      // outside the pure Action surface.
    });
  }

  private buildHoldMove(context: Context, mover: number, label: string): Move {
    const turnTotal = context.state.temp(mover);
    const banked = context.state.score(mover) + turnTotal;
    return new Move({
      id: `m${context.trial.numMoves}:hold:${mover}`,
      label: `Hold ${label} (+${turnTotal} → ${banked})`,
      siteIndices: [0],
      mover,
      placedOwner: mover,
      actions: [
        new ActionSetScore({ player: mover, score: banked }),
        new ActionSetTemp(mover, 0),
      ],
    });
  }

  public apply(context: Context, move: Move): Context {
    if (context.over) {
      throw new Error("Cannot apply a move to a terminal trial.");
    }
    if (move.mover !== context.state.mover) {
      throw new Error(
        `Move mover (${move.mover}) does not match state mover (${context.state.mover}).`,
      );
    }
    const isRoll = move.actions.length === 0;
    let placed = move.applyTo(context.state);
    let winner = -1;
    let over = false;

    if (isRoll) {
      const rolled = rollDice(context.rng, this.numDice, this.diceFaces);
      placed = placed.withDiceValues(rolled);
      if (this.mode === "pig") {
        const bust = rolled.includes(1);
        if (bust) {
          placed = placed.withTemp(move.mover, 0);
        } else {
          const sum = rolled.reduce((a, b) => a + b, 0);
          placed = placed.withTemp(move.mover, placed.temp(move.mover) + sum);
        }
      } else {
        // race: advance position stored in amounts[mover]; first to
        // reach/exceed trackLength wins.
        const sum = rolled.reduce((a, b) => a + b, 0);
        const advanced = placed.amount(move.mover) + sum;
        placed = placed.withAmount(move.mover, advanced);
        if (advanced >= this.trackLength) {
          winner = move.mover;
          over = true;
        }
      }
    } else {
      // Hold: banked score change just applied via ActionSetScore.
      if (this.mode === "pig" && placed.score(move.mover) >= this.goalScore) {
        winner = move.mover;
        over = true;
      }
    }

    // Pig: Roll while bust ends the turn; non-bust Roll continues. Hold
    // always ends the turn. Race: Roll always ends the turn (one roll
    // per turn).
    const endsTurn =
      !isRoll || this.mode === "race" || placed.temp(move.mover) === 0;
    const tentativeMover = endsTurn
      ? nextMover(placed.mover, this.numPlayers)
      : placed.mover;
    const advanced = placed.withMover(tentativeMover);

    const finalState = over ? placed : advanced;
    const trial = context.trial
      .withMove(move, over, winner)
      .saveState(finalState);
    return new Context(this, finalState, trial, context.rng);
  }

  public over(context: Context): boolean {
    return context.over;
  }

  public concepts(context?: Context): ConceptSet {
    let set = ConceptSet.of("AlternatingTurns", "PieceOwnership");
    if (context) {
      for (const move of this.moves(context)) {
        set = set.union(move.concepts());
      }
    }
    return set;
  }
}
