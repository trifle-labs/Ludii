// @java Core/src/game/functions/ints/dice/Face.java

/**
 * Returns the face of the die according to the current state of the position
 * of the die.
 *
 * @java game/functions/ints/dice/Face.java
 * @author Eric Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Returns the face of the die according to the current state of the position
 * of the die.
 *
 * @java game/functions/ints/dice/Face.java
 */
export class Face extends BaseIntFunction {
  /** Which location. @java Face.locn */
  private readonly locn: JavaIntFunction;

  /**
   * @param locn The location of the die.
   * @java Face(IntFunction)
   */
  public constructor(locn: JavaIntFunction) {
    super();
    this.locn = locn;
  }

  /**
   * @java Face.eval(Context)
   *
   * Returns the face of the die at the given location.
   */
  public override eval(context: Context): number {
    const loc = this.locn.eval(context);
    if (loc === OFF) return OFF;

    // Engine path: the die at global site `loc` lives in a dice container at
    // sitesFrom[dice.index()] + dieIndex, and its CURRENT FACE VALUE is
    // state.diceValues[dieIndex] (the engine stores resolved values where
    // Java stores the face index in the site-state channel and resolves
    // faces[state] here — same result).
    // @java Face.java — return component.getFaces()[cs.stateCell(loc)]
    {
      const game = context.game as unknown as {
        handDice?: () => Array<{ index(): number; numLocs(): number }>;
        sitesFrom?: () => number[];
      };
      const st = context.state as unknown as { diceValues?: readonly number[] };
      if (typeof game.handDice === "function" && typeof game.sitesFrom === "function" && Array.isArray(st.diceValues)) {
        const sitesFrom = game.sitesFrom();
        for (const dice of game.handDice()) {
          const base = sitesFrom[dice.index()] ?? -1;
          if (base >= 0 && loc >= base && loc < base + dice.numLocs()) {
            return st.diceValues[loc - base] ?? OFF;
          }
        }
      }
    }

    // Java: if (loc == Constants.OFF || context.containerId().length <= loc)
    const containerId_arr = (context as unknown as { containerId?: () => number[] }).containerId?.();
    if (loc === OFF || (containerId_arr !== undefined && containerId_arr.length <= loc))
      return OFF;

    // Java: final int containerId = context.containerId()[loc];
    const containerId = containerId_arr !== undefined ? containerId_arr[loc]! : 0;

    // Java: final ContainerState cs = context.state().containerStates()[containerId];
    const cs = (context.state as unknown as {
      containerStates?: () => Array<{
        whatCell(loc: number): number;
        stateCell(loc: number): number;
      }>;
    }).containerStates?.()?.[containerId];

    if (cs === undefined) return OFF;

    // Java: final int what = cs.whatCell(loc);
    const what = cs.whatCell(loc);
    if (what < 1)
      return OFF;

    // Java: final Component component = context.components()[what];
    const component = (context as unknown as {
      components?: () => Array<{
        isDie(): boolean;
        getFaces(): number[];
      }>;
    }).components?.()?.[what];

    if (component === undefined) return OFF;
    if (!component.isDie())
      return OFF;

    // Java: final int state = cs.stateCell(loc);
    const state = cs.stateCell(loc);
    if (state < 0)
      return OFF;

    // Java: return component.getFaces()[state];
    return component.getFaces()[state] ?? OFF;
  }

  /** @java Face.isStatic() */
  public isStatic(): boolean {
    // we're looking at state in a specific context, so not static
    return false;
  }

  /** @java Face.gameFlags(Game) */
  public gameFlags(game: unknown): number {
    return (this.locn as unknown as { gameFlags?(g: unknown): number }).gameFlags?.(game) ?? 0;
  }

  /** @java Face.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    for (const bit of this.locn.concepts(game)) {
      concepts.add(bit);
    }
    // Java: concepts.set(Concept.Dice.id(), true) — Dice concept bit
    // We skip the Concept enum bit since Concept is not ported yet.
    return concepts;
  }

  /** @java Face.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    for (const bit of this.locn.writesEvalContextRecursive()) {
      writeEvalContext.add(bit);
    }
    return writeEvalContext;
  }

  /** @java Face.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    for (const bit of this.locn.readsEvalContextRecursive()) {
      readEvalContext.add(bit);
    }
    return readEvalContext;
  }

  /** @java Face.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.locn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
  }

  /** @java Face.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;

    // Java: if (locn instanceof IntConstant) { ... check numCells ... }
    // We use escape hatch to check isStatic() as a proxy for IntConstant.
    const locnIsStatic = (this.locn as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    if (locnIsStatic) {
      // Java: check game.hasHandDice() — deferred
      // We cannot fully replicate the numCells check without full topology access,
      // so we fall through to the hasHandDice check below.
    }

    // Java: if (!game.hasHandDice()) { ... missingRequirement = true; }
    const hasHandDice = (game as unknown as { hasHandDice?: () => boolean }).hasHandDice;
    if (typeof hasHandDice === "function" && !hasHandDice.call(game)) {
      missingRequirement = true;
    }

    missingRequirement = missingRequirement || this.locn.missingRequirement(game);
    return missingRequirement;
  }

  /** @java Face.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || this.locn.willCrash(game);
    return willCrash;
  }

  /** @java Face.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    return "the face of the die at site " + this.locn.toEnglish(game);
  }
}
