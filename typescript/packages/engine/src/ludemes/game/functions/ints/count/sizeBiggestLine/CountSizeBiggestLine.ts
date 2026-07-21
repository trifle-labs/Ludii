// @java Core/src/game/functions/ints/count/sizeBiggestLine/CountSizeBiggestLine.java

/**
 * Returns the size of the biggest Line.
 *
 * @java game/functions/ints/count/sizeBiggestLine/CountSizeBiggestLine.java
 * @author Eric.Piette & Cedric.Antoine
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import { BaseBooleanFunction } from "../../../booleans/BaseBooleanFunction.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

/**
 * Minimal interface for a direction-choice object that can yield
 * an absolute direction name string.
 * @java game/functions/directions/Directions.java — absoluteDirection()
 */
interface DirnChoice {
  /** The absolute direction name (e.g. "Adjacent", "Orthogonal", "N"). */
  absoluteDirection?: () => string;
  /** Fallback: the direction name as a simple string field. */
  name?: string;
}

/**
 * Returns the size of the biggest line of pieces satisfying a condition.
 *
 * @java game/functions/ints/count/sizeBiggestLine/CountSizeBiggestLine.java
 */
export class CountSizeBiggestLine extends BaseIntFunction {
  /** The graph element type. @java CountSizeBiggestLine.type */
  private type: string | null;

  /** The condition on the pieces to include. @java CountSizeBiggestLine.condition */
  private readonly condition: BaseBooleanFunction;

  /** Direction chosen. @java CountSizeBiggestLine.dirnChoice */
  private readonly dirnChoice: DirnChoice;

  /**
   * @param type       The graph element type [default SiteType of the board].
   * @param directions The absolute direction [Adjacent].
   * @param condition  The condition on the pieces to include in the line.
   * @java CountSizeBiggestLine(SiteType, AbsoluteDirection, BooleanFunction)
   */
  public constructor(
    type: string | null,
    dirnChoice: DirnChoice,
    condition: BaseBooleanFunction,
  ) {
    super();
    this.type = type;
    this.dirnChoice = dirnChoice;
    this.condition = condition;
  }

  /**
   * @java CountSizeBiggestLine.eval(Context)
   *
   * Scans every site matching the condition (the "pivot" set), then for each
   * pivot walks the distinct radials (and their geometric opposites) in the
   * chosen direction, counting the longest contiguous run through the pivot.
   */
  public override eval(context: Context): number {
    const traj = (context as unknown as { _trajectories?: Trajectories | null })._trajectories;

    // Java: final List<? extends TopologyElement> sites = context.topology().getGraphElements(type);
    // We iterate over [0, numSites) as play-site ids.
    const numSites = traj ? traj.numSites : (context.game as unknown as { numSites?: number }).numSites ?? 0;

    // Java: context.setTo(element.index()); condition.eval(context) → pivotsFn
    const pivotsFn: number[] = [];

    for (let i = 0; i < numSites; i++) {
      // Java: context.setTo(element.index());
      context._evalTo = i;
      // Java: if (condition.eval(context)) pivotsFn.add(element.index());
      if (this.condition.eval(context)) {
        pivotsFn.push(i);
      }
    }

    if (pivotsFn.length === 0) {
      return 0;
    }

    // Determine the direction name for distinctRadialsByName.
    // Java: dirnChoice.absoluteDirection() e.g. AbsoluteDirection.Adjacent
    let dirName = "Adjacent";
    if (typeof this.dirnChoice.absoluteDirection === "function") {
      dirName = this.dirnChoice.absoluteDirection();
    } else if (typeof this.dirnChoice.name === "string") {
      dirName = this.dirnChoice.name;
    }

    let biggest = 0;

    for (const locn of pivotsFn) {
      if (locn < 0) return 0;

      // Java: final int origTo = context.to(); context.setTo(locn);
      const origTo = context._evalTo;
      context._evalTo = locn;

      // Java: graph.trajectories().radials(type, locn).distinctInDirection(...)
      const radialPairs = traj
        ? traj.distinctRadialsByName(locn, dirName)
        : [];

      for (const pair of radialPairs) {
        // pair.ray = [locn, siteA, siteB, ...] (forward direction)
        // pair.opposites = [[locn, siteC, siteD, ...], ...] (backward directions)
        const { ray, opposites } = pair;

        // Java: int count = 1; walk forward ray starting at index 1
        let count = 1;
        for (let indexPath = 1; indexPath < ray.length; indexPath++) {
          const index = ray[indexPath]!;
          context._evalTo = index;
          if (pivotsFn.includes(index)) {
            count++;
          } else {
            break;
          }
        }

        // Java: int oppositeCount = count; walk opposite radials
        let oppositeCount = count;
        if (opposites !== null && opposites !== undefined) {
          for (const oppositeRay of opposites) {
            for (let indexPath = 1; indexPath < oppositeRay.length; indexPath++) {
              const index = oppositeRay[indexPath]!;
              context._evalTo = index;
              if (pivotsFn.includes(index)) {
                oppositeCount++;
              } else {
                break;
              }
            }
          }
        }

        if (oppositeCount > biggest) {
          biggest = oppositeCount;
        }
      }

      context._evalTo = origTo;
    }

    return biggest;
  }

  /** @java CountSizeBiggestLine.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java CountSizeBiggestLine.toString() */
  public override toString(): string {
    return "Groups()";
  }

  /** @java CountSizeBiggestLine.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return this.condition.writesEvalContextRecursive();
  }

  /** @java CountSizeBiggestLine.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return this.condition.readsEvalContextRecursive();
  }

  /** @java CountSizeBiggestLine.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return this.condition.missingRequirement(game);
  }

  /** @java CountSizeBiggestLine.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.condition.willCrash(game);
  }

  /** @java CountSizeBiggestLine.preprocess(Game) */
  public preprocess(game: unknown): void {
    this.condition.preprocess(game);
  }

  /** @java CountSizeBiggestLine.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    const typeName = this.type ?? "Cell";
    return `the number of ${typeName} groups`;
  }
}
