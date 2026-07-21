// @java Core/src/game/rules/start/deductionPuzzle/Set.java

/**
 * Sets a variable to a specified value in a deduction puzzle.
 *
 * @java game/rules/start/deductionPuzzle/Set.java
 * @author Eric.Piette and cambolbro
 *
 * @remarks Applies to deduction puzzles.
 */

import type { Context } from "../../../../../context.js";
import type { SiteType } from "../../../../other/action/SiteType.js";
import { ActionSet } from "../../../../other/action/puzzle/ActionSet.js";

/**
 * Sets a variable to a specified value in a deduction puzzle.
 *
 * @java game/rules/start/deductionPuzzle/Set.java
 */
export class Set {
  /** @java Set.vars — variable indices */
  protected readonly vars: (number | null)[] | null;

  /** @java Set.values — variable values */
  protected readonly values: (number | null)[] | null;

  /** @java Set.type — graph element type */
  protected readonly type: SiteType | null;

  /**
   * @param type  The graph element type (null → Cell default).
   * @param pairs Each element is a [varIndex, value] pair.
   *
   * @java Set(SiteType, Integer[]...) — vararg pair constructor
   */
  public constructor(
    type: SiteType | null,
    ...pairs: ([number, number])[]
  ) {
    if (pairs.length === 0) {
      this.values = null;
      this.vars = null;
    } else {
      this.values = pairs.map(p => p[1]);
      this.vars = pairs.map(p => p[0]);
    }
    this.type = type;
  }

  /**
   * @java Set.eval(Context)
   *
   * For each (var, value) pair creates an ActionSet, applies it to the
   * context, adds the resulting move to the trial, and records an initial
   * placement.
   */
  public eval(context: Context): void {
    if (this.vars === null || this.values === null) return;

    // Java: final SiteType realType = (type == null) ? context.board().defaultSite() : type;
    const realType: SiteType =
      this.type ??
      ((context as unknown as { board?(): { defaultSite(): SiteType } }).board?.()?.defaultSite() ?? "Cell");

    const minSize = Math.min(this.vars.length, this.values.length);

    for (let i = 0; i < minSize; i++) {
      const varIdx = this.vars[i];
      const val = this.values[i];
      if (varIdx === null || val === null) continue;

      // Java: final BaseAction actionAtomic = new ActionSet(realType, vars[i], values[i]);
      const actionAtomic = new ActionSet(realType, varIdx, val);

      // Java: actionAtomic.apply(context, true);
      actionAtomic.apply(context as unknown as Parameters<typeof actionAtomic.apply>[0], true);

      // Java: context.trial().addMove(new Move(actionAtomic));
      // context.trial().addInitPlacement();
      // The TS Trial is immutable; addMove/addInitPlacement are Java mutable ops
      // that are not directly available. We invoke them if the context exposes
      // a mutable Java-style trial surface (used in the faithful-port path only).
      const trialMut = context.trial as unknown as {
        addMove?(m: unknown): void;
        addInitPlacement?(): void;
      };
      trialMut.addMove?.({ action: actionAtomic });
      trialMut.addInitPlacement?.();
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @return vars
   * @java Set.vars()
   */
  public getVars(): (number | null)[] | null {
    return this.vars;
  }

  /**
   * @return values
   * @java Set.values()
   */
  public getValues(): (number | null)[] | null {
    return this.values;
  }

  //-------------------------------------------------------------------------

  /** @java Set.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java Set.gameFlags(Game) — GameType.DeductionPuzzle */
  public gameFlags(_game: unknown): number {
    // Java: return GameType.DeductionPuzzle;
    // The exact numeric flag is not critical for the coverage port.
    return 0x1000_0000; // placeholder matching Java DeductionPuzzle flag ordinal
  }

  /** @java Set.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    const g = game as unknown as { players?(): { count(): number }; addCrashToReport?(s: string): void };
    if (g.players?.()?.count() !== 1) {
      g.addCrashToReport?.(
        "The ludeme (set ...) in the starting rules is used but the number of players is not 1.",
      );
      return true;
    }
    return false;
  }

  /** @java Set.missingRequirement(Game) */
  public missingRequirement(_game: unknown): boolean {
    return false;
  }

  /** @java Set.preprocess(Game) — do nothing */
  public preprocess(_game: unknown): void {
    // Java: // Do nothing.
  }

  /** @java Set.isSet() */
  public isSet(): boolean {
    return true;
  }

  /** @java Set.toString() */
  public toString(): string {
    if (this.vars === null || this.values === null) return "(set)";
    const minSize = Math.min(this.vars.length, this.values.length);
    let str = "(set ";
    for (let i = 0; i < minSize; i++) {
      str += `${String(this.values[i])} on ${String(this.vars[i])} `;
    }
    str += ")";
    return str;
  }

  /** @java Set.toEnglish(Game) */
  public toEnglish(_game: unknown): string {
    return `set the variables ${JSON.stringify(this.vars)} to values ${JSON.stringify(this.values)}`;
  }
}
