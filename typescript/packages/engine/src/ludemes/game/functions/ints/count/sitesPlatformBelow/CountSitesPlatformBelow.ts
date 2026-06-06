// @java Core/src/game/functions/ints/count/sitesPlatformBelow/CountSitesPlatformBelow.java

/**
 * Returns the number of specific pieces on sites below a given site.
 *
 * @java game/functions/ints/count/sitesPlatformBelow/CountSitesPlatformBelow.java
 * @author Eric.Piette & Cedric.Antoine
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Minimal inline "To" singleton to mirror game.functions.ints.iterator.To.instance().
 * @java game.functions.ints.iterator.To
 */
const TO_INSTANCE: JavaIntFunction = {
  eval(context: Context): number { return context._evalTo; },
  exceeds(context: Context, other: JavaIntFunction): boolean { return context._evalTo > other.eval(context); },
  isHint(): boolean { return false; },
  isHand(): boolean { return false; },
  concepts(_game: unknown): Set<number> { return new Set(); },
  readsEvalContextRecursive(): Set<number> { return new Set(); },
  writesEvalContextRecursive(): Set<number> { return new Set(); },
  missingRequirement(_game: unknown): boolean { return false; },
  willCrash(_game: unknown): boolean { return false; },
  toEnglish(_game: unknown): string { return "to"; },
};

/**
 * Returns the number of specific pieces on sites below a given site.
 *
 * @java game/functions/ints/count/sitesPlatformBelow/CountSitesPlatformBelow.java
 */
export class CountSitesPlatformBelow extends BaseIntFunction {
  /** The graph element type. @java CountSitesPlatformBelow.type */
  private type: SiteType | null;

  /** The owner of the pieces to count on the lower platform. @java CountSitesPlatformBelow.whoFn */
  private readonly whoFn: JavaIntFunction | null;

  /** To simulate this kind of piece is on the pivot. @java CountSitesPlatformBelow.whatFn */
  private readonly whatFn: JavaIntFunction[] | null;

  /** The site to test. @java CountSitesPlatformBelow.siteFn */
  private readonly siteFn: JavaIntFunction;

  /**
   * @param type   The graph element type [default SiteType of the board].
   * @param site   The site to check [(to)].
   * @param who    Player id the counted items belong to.
   * @param what   Piece id of the counted items.
   * @param whats  Piece id's of the counted items.
   * @java CountSitesPlatformBelow(SiteType, IntFunction, RoleType, IntFunction, IntFunction[])
   */
  public constructor(
    type: SiteType | null,
    site: JavaIntFunction | null,
    who: JavaIntFunction | null,
    what: JavaIntFunction | null,
    whats: JavaIntFunction[] | null,
  ) {
    super();
    this.type = type;
    this.siteFn = (site !== null && site !== undefined) ? site : TO_INSTANCE;

    if (whats !== null && whats !== undefined) {
      this.whatFn = whats;
    } else if (what !== null && what !== undefined) {
      this.whatFn = [what];
    } else {
      this.whatFn = null;
    }

    this.whoFn = who;
  }

  /**
   * @java CountSitesPlatformBelow.eval(Context)
   *
   * Returns the number of specific pieces on sites below a given site.
   * Java: uses topology.trajectories().steps(type, site, type, AbsoluteDirection.Downward)
   */
  public override eval(context: Context): number {
    const site = this.siteFn.eval(context);

    const whats: number[] = [];
    if (this.whatFn !== null) {
      for (const what of this.whatFn) {
        whats.push(what.eval(context));
      }
    }

    // Java: if (site == Constants.OFF && site >= context.topology().vertices().size()) return -1;
    const topology = (context as unknown as {
      topology?: () => {
        vertices(): Array<unknown>;
        trajectories(): {
          steps(
            fromType: SiteType | null,
            from: number,
            toType: SiteType | null,
            direction: string,
          ): Array<{ to(): { id(): number } }>;
        };
      };
    }).topology?.();

    if (site === OFF && topology && site >= topology.vertices().length)
      return -1;

    // Java: final Vertex v = context.topology().vertices().get(site);
    if (!topology) return 0;

    const vertices = topology.vertices() as Array<{ layer(): number }>;

    if (site < 0 || site >= vertices.length) return 0;

    const v = vertices[site];
    if (!v) return 0;

    // Java: if (v.layer() == 0) return 0;
    if (v.layer() === 0) return 0;

    // Java: ContainerState cs = context.containerState(context.containerId()[site]);
    const containerIdArr = (context as unknown as {
      containerId?: () => number[];
    }).containerId?.();

    const containerId = containerIdArr ? containerIdArr[site] ?? 0 : 0;

    const cs = (context as unknown as {
      containerState?: (idx: number) => {
        who(site: number, type: SiteType): number;
        what(site: number, type: SiteType): number;
      };
    }).containerState?.(containerId);

    // Java: topology.trajectories().steps(type, site, type, AbsoluteDirection.Downward)
    const realType: SiteType = this.type ?? "Vertex";
    const steps = topology.trajectories().steps(realType, site, realType, "Downward");

    let count = 0;

    for (const step of steps) {
      const toId = step.to().id();
      if (this.whatFn === null) {
        // Java: if (cs.who(step.to().id(), SiteType.Vertex) == whoFn.eval(context)) count++;
        if (cs && this.whoFn !== null) {
          if (cs.who(toId, "Vertex") === this.whoFn.eval(context)) {
            count++;
          }
        }
      } else {
        // Java: if (whats.contains(cs.what(step.to().id(), SiteType.Vertex))) count++;
        if (cs && whats.includes(cs.what(toId, "Vertex"))) {
          count++;
        }
      }
    }

    return count;
  }

  /** @java CountSitesPlatformBelow.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java CountSitesPlatformBelow.toString() */
  public override toString(): string {
    return "SitesPlatformBelow()";
  }

  /** @java CountSitesPlatformBelow.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    for (const bit of this.siteFn.concepts(game)) concepts.add(bit);
    if (this.whoFn !== null) for (const bit of this.whoFn.concepts(game)) concepts.add(bit);
    if (this.whatFn !== null) for (const fn of this.whatFn) for (const bit of fn.concepts(game)) concepts.add(bit);
    return concepts;
  }

  /** @java CountSitesPlatformBelow.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    // Java: writesEvalContextFlat() — omitted as base returns empty set
    for (const bit of this.siteFn.writesEvalContextRecursive()) writeEvalContext.add(bit);
    if (this.whoFn !== null) for (const bit of this.whoFn.writesEvalContextRecursive()) writeEvalContext.add(bit);
    if (this.whatFn !== null) for (const fn of this.whatFn) for (const bit of fn.writesEvalContextRecursive()) writeEvalContext.add(bit);
    return writeEvalContext;
  }

  /** @java CountSitesPlatformBelow.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    // Java: readEvalContext.or(siteFn.writesEvalContextRecursive()) — faithful copy
    for (const bit of this.siteFn.writesEvalContextRecursive()) readEvalContext.add(bit);
    if (this.whoFn !== null) for (const bit of this.whoFn.writesEvalContextRecursive()) readEvalContext.add(bit);
    if (this.whatFn !== null) for (const fn of this.whatFn) for (const bit of fn.readsEvalContextRecursive()) readEvalContext.add(bit);
    return readEvalContext;
  }

  /** @java CountSitesPlatformBelow.preprocess(Game) */
  public preprocess(game: unknown): void {
    // Java: type = SiteType.use(type, game);
    if (this.type === null) {
      this.type = (game as unknown as {
        board?: () => { defaultSite(): SiteType };
      }).board?.().defaultSite() ?? "Cell";
    }
    (this.siteFn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    if (this.whoFn !== null) (this.whoFn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    if (this.whatFn !== null) {
      for (const fn of this.whatFn) {
        (fn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
      }
    }
  }

  /** @java CountSitesPlatformBelow.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    missingRequirement = missingRequirement || this.siteFn.missingRequirement(game);
    if (this.whoFn !== null) missingRequirement = missingRequirement || this.whoFn.missingRequirement(game);
    if (this.whatFn !== null) for (const fn of this.whatFn) missingRequirement = missingRequirement || fn.missingRequirement(game);
    return missingRequirement;
  }

  /** @java CountSitesPlatformBelow.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || this.siteFn.willCrash(game);
    if (this.whoFn !== null) willCrash = willCrash || this.whoFn.willCrash(game);
    if (this.whatFn !== null) for (const fn of this.whatFn) willCrash = willCrash || fn.willCrash(game);
    return willCrash;
  }

  /** @java CountSitesPlatformBelow.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    let whoString = "of their";
    if (this.whatFn !== null) whoString = this.whatFn.toString();
    if (this.whoFn !== null) whoString = this.whoFn.toString();
    return "site " + this.siteFn.toEnglish(game) + " is counted sites bellow it bellonging to " + whoString;
  }
}
