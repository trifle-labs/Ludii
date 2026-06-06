// @java Core/src/game/functions/ints/state/Rotation.java

/**
 * Returns the rotation value of a specified site.
 *
 * @java game/functions/ints/state/Rotation.java
 * @author Eric Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import type { SiteType } from "../../../../other/action/SiteType.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Returns the rotation value of a specified site.
 *
 * @java game/functions/ints/state/Rotation.java
 */
export class Rotation extends BaseIntFunction {
  /** Which location. @java Rotation.locn */
  private readonly locn: JavaIntFunction;

  /** Which level (for a stacking game). @java Rotation.level */
  private readonly level: JavaIntFunction | null;

  /** Cell/Edge/Vertex. @java Rotation.type */
  private type: SiteType | null;

  /**
   * @param type  The graph element type [default SiteType of the board].
   * @param at    The location to check.
   * @param level The level to check [0].
   * @java Rotation(SiteType, IntFunction, IntFunction)
   */
  public constructor(
    type: SiteType | null,
    at: JavaIntFunction,
    level: JavaIntFunction | null = null,
  ) {
    super();
    this.locn = at;
    this.level = level;
    this.type = type;
  }

  /**
   * @java Rotation.eval(Context)
   *
   * Returns the rotation value at the given site.
   */
  public override eval(context: Context): number {
    const loc = this.locn.eval(context);
    if (loc === OFF)
      return 0;

    // Java: final int containerId = context.containerId()[loc];
    const containerId_arr = (context as unknown as { containerId?: () => number[] }).containerId?.();
    const containerId = containerId_arr !== undefined ? (containerId_arr[loc] ?? 0) : 0;

    // Java: if (context.game().isStacking() && containerId == 0)
    const isStacking = (context.game as unknown as { isStacking?: () => boolean }).isStacking?.() ?? false;

    if (isStacking && containerId === 0) {
      // Is stacking game — cast to BaseContainerStateStacking
      const state = (context.state as unknown as {
        containerStates?: () => Array<{
          rotation(loc: number, type: string): number;
          rotation(loc: number, level: number, type: string): number;
        }>;
      }).containerStates?.()?.[containerId];

      if (state === undefined) return 0;

      const realType = this.type ?? "Cell";
      if (this.level === null) {
        return (state as unknown as { rotation(l: number, t: string): number }).rotation(loc, realType);
      }
      return (state as unknown as { rotation(l: number, lv: number, t: string): number })
        .rotation(loc, this.level.eval(context), realType);
    }

    // Java: final ContainerState cs = context.state().containerStates()[containerId];
    const cs = (context.state as unknown as {
      containerStates?: () => Array<{
        rotation(loc: number, type: string): number;
      }>;
    }).containerStates?.()?.[containerId];

    if (cs === undefined) return 0;

    const realType = this.type ?? "Cell";
    return cs.rotation(loc, realType);
  }

  /** @java Rotation.isStatic() */
  public isStatic(): boolean {
    // we're looking at state in a specific context, so not static
    return false;
  }

  /** @java Rotation.gameFlags(Game) */
  public gameFlags(game: unknown): number {
    // Java: long stateFlag = locn.gameFlags(game) | GameType.Rotation;
    let stateFlag = (this.locn as unknown as { gameFlags?(g: unknown): number }).gameFlags?.(game) ?? 0;
    // GameType.Rotation flag — deferred (we don't have GameType ported yet)
    if (this.level !== null) {
      stateFlag |= (this.level as unknown as { gameFlags?(g: unknown): number }).gameFlags?.(game) ?? 0;
    }
    return stateFlag;
  }

  /** @java Rotation.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    for (const bit of this.locn.concepts(game)) {
      concepts.add(bit);
    }
    // Java: concepts.set(Concept.PieceRotation.id(), true) — deferred
    if (this.level !== null) {
      for (const bit of this.level.concepts(game)) {
        concepts.add(bit);
      }
    }
    return concepts;
  }

  /** @java Rotation.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    for (const bit of this.locn.writesEvalContextRecursive()) {
      writeEvalContext.add(bit);
    }
    if (this.level !== null) {
      for (const bit of this.level.writesEvalContextRecursive()) {
        writeEvalContext.add(bit);
      }
    }
    return writeEvalContext;
  }

  /** @java Rotation.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    for (const bit of this.locn.readsEvalContextRecursive()) {
      readEvalContext.add(bit);
    }
    if (this.level !== null) {
      for (const bit of this.level.readsEvalContextRecursive()) {
        readEvalContext.add(bit);
      }
    }
    return readEvalContext;
  }

  /** @java Rotation.preprocess(Game) */
  public preprocess(game: unknown): void {
    // Java: type = SiteType.use(type, game);
    const siteTypeUse = (t: SiteType | null, g: unknown): SiteType => {
      if (t !== null) return t;
      return (g as unknown as { board?: { defaultSite?: () => SiteType } })
        .board?.defaultSite?.() ?? "Cell";
    };
    this.type = siteTypeUse(this.type, game);
    (this.locn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    if (this.level !== null) {
      (this.level as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    }
  }

  /** @java Rotation.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    missingRequirement = missingRequirement || this.locn.missingRequirement(game);
    if (this.level !== null) {
      missingRequirement = missingRequirement || this.level.missingRequirement(game);
    }
    return missingRequirement;
  }

  /** @java Rotation.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || this.locn.willCrash(game);
    if (this.level !== null) {
      willCrash = willCrash || this.level.willCrash(game);
    }
    return willCrash;
  }
}
