// @java Core/src/game/functions/ints/card/site/CardRank.java

/**
 * Returns the rank of a card in the deck.
 *
 * @java game/functions/ints/card/site/CardRank.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Returns the rank of a card in the deck.
 *
 * Java eval:
 *   site  = siteFn.eval(context)
 *   level = levelFn.eval(context)
 *   cid   = context.containerId()[site]
 *   cs    = context.containerState(cid)
 *   what  = cs.whatCell(site, level)
 *   if what < 1 return OFF
 *   component = context.components()[what]
 *   if !component.isCard() return OFF
 *   return component.rank()
 *
 * @java game/functions/ints/card/site/CardRank.java
 */
export class CardRank extends BaseIntFunction {
  /** The site where the card is. @java CardRank.siteFn */
  private readonly siteFn: JavaIntFunction;

  /** The level where the card is. @java CardRank.levelFn */
  private readonly levelFn: JavaIntFunction;

  /**
   * @param site  The site where the card is.
   * @param level The level where the card is [0].
   * @java CardRank(IntFunction, IntFunction)
   */
  public constructor(site: JavaIntFunction, level: JavaIntFunction) {
    super();
    this.siteFn = site;
    this.levelFn = level;
  }

  /**
   * @java CardRank.eval(Context)
   *
   * Returns the rank of the card at the given site/level, or OFF if no card.
   */
  public override eval(context: Context): number {
    const site  = this.siteFn.eval(context);
    const level = this.levelFn.eval(context);

    // Java: int cid = context.containerId()[site]
    const ctx = context as unknown as {
      containerId?: () => number[];
      containerState?: (cid: number) => {
        whatCell(site: number, level: number): number;
      };
      components?: () => Array<{
        isCard(): boolean;
        rank(): number;
      } | null>;
    };

    const containerIdArr = ctx.containerId?.();
    const cid = containerIdArr ? (containerIdArr[site] ?? 0) : 0;
    const cs  = ctx.containerState?.(cid);

    let what: number;
    if (cs) {
      what = cs.whatCell(site, level);
    } else {
      // Fallback: TS state whatAtSiteLevel
      what = context.state.whatAtSiteLevel(site, level);
    }

    if (what < 1) return OFF;

    // Java: context.components()[what]
    const components = ctx.components?.();
    if (components) {
      const component = components[what];
      if (!component || !component.isCard()) return OFF;
      return component.rank();
    }

    // No component metadata available — return OFF
    return OFF;
  }

  /** @java CardRank.isStatic() */
  public isStatic(): boolean {
    const siteStatic  = (this.siteFn  as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    const levelStatic = (this.levelFn as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    return siteStatic && levelStatic;
  }

  /** @java CardRank.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missing = this.siteFn.missingRequirement(game);
    missing = missing || this.levelFn.missingRequirement(game);
    return missing;
  }

  /** @java CardRank.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.siteFn.willCrash(game) || this.levelFn.willCrash(game);
  }

  /** @java CardRank.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.concepts(game)) s.add(x);
    for (const x of this.levelFn.concepts(game)) s.add(x);
    return s;
  }

  /** @java CardRank.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.writesEvalContextRecursive()) s.add(x);
    for (const x of this.levelFn.writesEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java CardRank.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.readsEvalContextRecursive()) s.add(x);
    for (const x of this.levelFn.readsEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java CardRank.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the rank of the card at " + this.siteFn.toString();
  }
}
