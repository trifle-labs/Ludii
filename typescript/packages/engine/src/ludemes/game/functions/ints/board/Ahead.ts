// @java Core/src/game/functions/ints/board/Ahead.java

/**
 * Returns the site in a given direction from a specified site.
 *
 * @java game/functions/ints/board/Ahead.java
 * @author Eric.Piette
 *
 * @remarks If there is no site in the specified direction, then the index of
 *          the source site is returned.
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import type { SiteType } from "../../../../other/action/SiteType.js";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Interface for the DirectionsFunction contract as used in Ahead.
 *
 * Java: DirectionsFunction.convertToAbsolute(SiteType, TopologyElement,...)
 * returns List<AbsoluteDirection>; getRelativeDirections() for
 * SameDirection/OppositeDirection dispatch.
 *
 * In TS the directions function may be a simple string (direction name) or
 * a full DirectionsFunction — we use an escape-hatch unknown cast.
 */
interface AheadDirectionsFunction {
  /**
   * @java DirectionsFunction.convertToAbsolute(SiteType, TopologyElement, ...)
   * Returns the list of absolute direction names for this directions function.
   */
  convertToAbsolute?: (
    realType: string,
    fromEl: unknown,
    a: null, b: null, c: null,
    context: Context,
  ) => string[];

  /**
   * @java DirectionsFunction.getRelativeDirections()
   */
  getRelativeDirections?: () => string[] | null;

  /** Direction name if this is a simple named direction. */
  name?: string;
}

/**
 * Returns the site in a given direction from a specified site.
 *
 * @java game/functions/ints/board/Ahead.java
 */
export class Ahead extends BaseIntFunction {
  /** The source site function. @java Ahead.siteFn */
  private readonly siteFn: JavaIntFunction;

  /** The number of steps in this direction. @java Ahead.stepsFn */
  private readonly stepsFn: JavaIntFunction;

  /** Direction chosen. @java Ahead.dirnChoice */
  private readonly dirnChoice: AheadDirectionsFunction;

  /** Add on Cell/Edge/Vertex. @java Ahead.type */
  private readonly type: SiteType | null;

  /**
   * @param site       Source site.
   * @param steps      Distance to travel [1].
   * @param directions The direction.
   * @param type       The graph element type [default SiteType of the board].
   * @java Ahead(SiteType, IntFunction, IntFunction, Direction)
   */
  public constructor(
    type: SiteType | null,
    site: JavaIntFunction,
    steps: JavaIntFunction,
    directions: AheadDirectionsFunction,
  ) {
    super();
    this.type = type;
    this.siteFn = site;
    // @java Ahead.java:74 — stepsFn = (steps == null) ? new IntConstant(1) : steps;
    // (@Opt @Name steps is absent in e.g. Fanorona's (ahead (to) SameDirection)).
    this.stepsFn = steps ?? ({ eval: () => 1 } as unknown as JavaIntFunction);
    this.dirnChoice = directions;
  }

  /**
   * @java Ahead.eval(Context)
   *
   * Evaluates by:
   *   1. Resolving the source site and distance.
   *   2. Determining the absolute direction (handling SameDirection/OppositeDirection).
   *   3. Walking the topology radials from the source site for `distance` steps.
   *   4. Returning the destination site, or the source site if none found.
   */
  public override eval(context: Context): number {
    const site = this.siteFn.eval(context);
    const distance = this.stepsFn.eval(context);

    if (site < 0)
      return UNDEFINED;

    // Java: context.topology(); context.game().board().defaultSite()
    const ctxAny = context as unknown as {
      topology?: () => {
        getGraphElements(type: string): Array<{ index(): number }>;
        trajectories(): {
          radials(type: string, site: number, direction: string): Array<{
            steps(): Array<{ id(): number }>;
          }>;
        };
        supportedDirections(type: string): Array<{ toAbsolute(): string }>;
      };
    };

    const topology = ctxAny.topology?.();
    // @java realType = (type == null) ? context.board().defaultSite() : type
    const realType = this.type
      ?? (context as unknown as { board?: () => { defaultSite?: () => string } }).board?.()?.defaultSite?.()
      ?? "Cell";

    // Determine direction name
    let directionName: string | null = null;

    // Check for SameDirection / OppositeDirection relative directions.
    // The compiler can hand the direction as a RAW STRING (raw-literal rule):
    // (ahead (to) SameDirection) reaches us with dirnChoice === "SameDirection".
    const rawDir = typeof (this.dirnChoice as unknown) === "string" ? (this.dirnChoice as unknown as string) : null;
    const relDirs = rawDir === "SameDirection" || rawDir === "OppositeDirection"
      ? [rawDir]
      : this.dirnChoice.getRelativeDirections?.();
    if (relDirs && relDirs.length > 0) {
      const relDir = relDirs[0]!;
      if (relDir === "OppositeDirection" || relDir === "SameDirection") {
        // Java reads context.from() / context.to() (or lastMove values)
        const ctxFT = context as unknown as {
          from?: () => number;
          to?: () => number;
          trial?: { lastMove?: () => { fromNonDecision?: () => number; toNonDecision?: () => number } | null };
        };

        let from = context._evalFrom;
        let to   = context._evalTo;

        if (from === UNDEFINED) {
          const lm = ctxFT.trial?.lastMove?.();
          from = lm?.fromNonDecision?.() ?? UNDEFINED;
        }
        if (to === UNDEFINED) {
          const lm = ctxFT.trial?.lastMove?.();
          to = lm?.toNonDecision?.() ?? UNDEFINED;
        }

        // Engine trajectories expose radialsByName(site, dir) — the Java-style
        // 4-arg radials() silently returns nothing there (the Enclose lesson);
        // Fanorona's (ahead (to) SameDirection) then degraded to the site
        // itself and approach captures vanished.
        const engTraj = (context as unknown as { _trajectories?: { radialsByName?(site: number, dir: string): number[][] } })._trajectories;
        if (engTraj?.radialsByName && from >= 0 && to >= 0) {
          // Walk the rays themselves (@java radials in the from→to direction
          // continue past `to`): find the ray from `origin` containing
          // `target`, then step `distance` further along it from the queried
          // site. Lattice boards (Fanorona's alquerque) have unnamed diagonal
          // rays, so name-based detection cannot work there.
          const origin = relDir === "SameDirection" ? from : to;
          const target = relDir === "SameDirection" ? to   : from;
          for (const ray of engTraj.radialsByName(origin, "Adjacent")) {
            for (let k = 1; k < ray.length; k += 1) {
              if (ray[k] === target) {
                const si = ray.indexOf(site);
                if (si >= 0) return ray[si + distance] ?? site;
              }
            }
          }
        }
        if (directionName === null && topology) {
          // Java: iterate supportedDirections, check radials for from→to (SameDirection)
          // or to→from (OppositeDirection) links
          const supported = topology.supportedDirections(realType);
          const origin = relDir === "SameDirection" ? from : to;
          const target = relDir === "SameDirection" ? to   : from;

          outer:
          for (const facingDir of supported) {
            const absDir = facingDir.toAbsolute();
            const radials = topology.trajectories().radials(realType, origin, absDir);
            for (const radial of radials) {
              const steps = radial.steps();
              for (let toIdx = 1; toIdx < steps.length; toIdx++) {
                if (steps[toIdx]!.id() === target) {
                  directionName = absDir;
                  break outer;
                }
              }
            }
          }
        } else {
          // Fallback: compute from→to direction name on rectangular grid
          directionName = this.gridDirection(from, to, context);
          if (relDir === "OppositeDirection") {
            directionName = this.oppositeDir(directionName);
          }
        }
      }
    }

    if (directionName === null) {
      // Standard case: convertToAbsolute
      if (this.dirnChoice.convertToAbsolute && topology) {
        const fromEl = topology.getGraphElements(realType)[site];
        const dirs = this.dirnChoice.convertToAbsolute(realType, fromEl ?? null, null, null, null, context);
        if (!dirs || dirs.length === 0) return site;
        directionName = dirs[0]!;
      } else if (this.dirnChoice.name) {
        directionName = this.dirnChoice.name;
      } else {
        return site;
      }
    }

    if (directionName === null) return site;

    // Java: walk radials from site in the found direction for `distance` steps
    const engTraj2 = (context as unknown as { _trajectories?: { radialsByName?(site: number, dir: string): number[][] } })._trajectories;
    if (engTraj2?.radialsByName) {
      for (const ray of engTraj2.radialsByName(site, directionName)) {
        if (ray.length > distance) return ray[distance]!;
      }
      return site;
    }
    if (topology) {
      const radialList = topology.trajectories().radials(realType, site, directionName);
      for (const radial of radialList) {
        const steps = radial.steps();
        for (let toIdx = 1; toIdx < steps.length && toIdx <= distance; toIdx++) {
          const toSite = steps[toIdx]!.id();
          if (toIdx === distance)
            return toSite;
        }
      }
      return site;
    }

    // Fallback: grid-based step
    const ctxTraj = context as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxTraj._trajectories;
    if (traj) {
      let cur = site;
      for (let step = 0; step < distance; step++) {
        const next = traj.step(cur, directionName);
        if (next < 0) return step === 0 ? site : cur;
        cur = next;
      }
      return cur;
    }

    // Pure rectangular grid
    return this.gridStep(site, directionName, distance, context);
  }

  /** Compute a cardinal direction name from→to on a rectangular grid. */
  private gridDirection(from: number, to: number, context: Context): string | null {
    if (from < 0 || to < 0) return null;
    const width = (context.game as unknown as { width?: number }).width ?? 0;
    if (width <= 0) return null;
    const dr = Math.floor(to / width) - Math.floor(from / width);
    const dc = (to % width) - (from % width);
    if (dr > 0 && dc === 0) return "N";
    if (dr < 0 && dc === 0) return "S";
    if (dr === 0 && dc > 0) return "E";
    if (dr === 0 && dc < 0) return "W";
    if (dr > 0 && dc > 0) return "NE";
    if (dr > 0 && dc < 0) return "NW";
    if (dr < 0 && dc > 0) return "SE";
    if (dr < 0 && dc < 0) return "SW";
    return null;
  }

  /** Return the opposite of a compass direction name. */
  private oppositeDir(dir: string | null): string | null {
    if (dir === null) return null;
    const map: Record<string, string> = {
      N: "S", S: "N", E: "W", W: "E",
      NE: "SW", SW: "NE", NW: "SE", SE: "NW",
    };
    return map[dir] ?? null;
  }

  /** Walk `distance` steps in direction on a rectangular grid. */
  private gridStep(site: number, dir: string, distance: number, context: Context): number {
    const width  = (context.game as unknown as { width?: number }).width  ?? 0;
    const height = (context.game as unknown as { height?: number }).height ?? 0;
    if (width <= 0) return site;
    let cur = site;
    for (let step = 0; step < distance; step++) {
      const col = cur % width;
      const row = Math.floor(cur / width);
      const d = dir.toUpperCase();
      let next = -1;
      if (d === "N")  next = row < height - 1 ? cur + width : -1;
      else if (d === "S")  next = row > 0        ? cur - width : -1;
      else if (d === "E")  next = col < width - 1 ? cur + 1     : -1;
      else if (d === "W")  next = col > 0         ? cur - 1     : -1;
      else if (d === "NE") next = (row < height-1 && col < width-1) ? cur + width + 1 : -1;
      else if (d === "NW") next = (row < height-1 && col > 0)       ? cur + width - 1 : -1;
      else if (d === "SE") next = (row > 0        && col < width-1) ? cur - width + 1 : -1;
      else if (d === "SW") next = (row > 0        && col > 0)       ? cur - width - 1 : -1;
      if (next < 0) return step === 0 ? site : cur;
      cur = next;
    }
    return cur;
  }

  /** @java Ahead.isStatic() */
  public isStatic(): boolean {
    return false; // depends on context.from()/to() and topology
  }

  /** @java Ahead.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return this.siteFn.missingRequirement(game) || this.stepsFn.missingRequirement(game);
  }

  /** @java Ahead.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.siteFn.willCrash(game) || this.stepsFn.willCrash(game);
  }

  /** @java Ahead.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.writesEvalContextRecursive()) s.add(x);
    for (const x of this.stepsFn.writesEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java Ahead.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.readsEvalContextRecursive()) s.add(x);
    for (const x of this.stepsFn.readsEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java Ahead.toString() */
  public override toString(): string {
    return "ForwardSite(" + this.siteFn.toString() + ")";
  }

  /** @java Ahead.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    const realType = this.type ?? "Cell";
    return " the " + realType + " " + this.stepsFn.toEnglish(game)
      + " steps ahead of " + this.siteFn.toEnglish(game);
  }
}
