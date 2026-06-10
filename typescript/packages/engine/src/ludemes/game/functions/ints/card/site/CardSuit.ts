// @java Core/src/game/functions/ints/card/site/CardSuit.java

/**
 * Returns the suit of a card.
 *
 * @java game/functions/ints/card/site/CardSuit.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Returns the suit of a card at the given site/level.
 *
 * @java game/functions/ints/card/site/CardSuit.java
 */
export class CardSuit extends BaseIntFunction {
  /** The site where the card is. @java CardSuit.siteFn */
  private readonly siteFn: JavaIntFunction;

  /** The level on the site (may be null). @java CardSuit.levelFn */
  private readonly levelFn: JavaIntFunction | null;

  /**
   * @param site  The site where the card is.
   * @param level The level where the card is (null = use cell without level).
   * @java CardSuit(IntFunction, IntFunction)
   */
  public constructor(site: JavaIntFunction, level: JavaIntFunction | null) {
    super();
    this.siteFn = site;
    this.levelFn = level !== undefined ? level : null;
  }

  /**
   * @java CardSuit.eval(Context)
   *
   * Returns the suit of the card at the given site/level, or OFF if no card.
   */
  public override eval(context: Context): number {
    const site = this.siteFn.eval(context);

    // Java: int cid = context.containerId()[site]
    // Java: ContainerState cs = context.containerState(cid)
    const ctx = context as unknown as {
      containerId?: () => number[];
      containerState?: (cid: number) => {
        what(site: number, level: number, siteType: unknown): number;
        what(site: number, siteType: unknown): number;
      };
      components?: () => Array<{
        isCard(): boolean;
        suit(): number;
      } | null>;
    };

    const containerIdArr = ctx.containerId?.();
    const cid = containerIdArr ? (containerIdArr[site] ?? 0) : 0;
    const cs = ctx.containerState?.(cid);

    let what: number;
    if (this.levelFn !== null) {
      // Java: cs.what(site, levelFn.eval(context), SiteType.Cell)
      const level = this.levelFn.eval(context);
      if (cs) {
        what = (cs as unknown as { what(s: number, l: number, t: unknown): number })
          .what(site, level, "Cell");
      } else {
        what = context.state.whatAtSiteLevel(site, level);
      }
    } else {
      // Java: cs.what(site, SiteType.Cell)
      if (cs) {
        what = (cs as unknown as { what(s: number, t: unknown): number }).what(site, "Cell");
      } else {
        what = context.state.what(site);
      }
    }

    if (what < 1) return OFF;

    // Java: Component component = context.components()[what]
    const components = ctx.components?.();
    if (components) {
      const component = components[what];
      if (!component || !component.isCard()) return OFF;
      return component.suit();
    }

    // No component metadata available — return OFF
    return OFF;
  }

  /** @java CardSuit.isStatic() */
  public isStatic(): boolean {
    const siteStatic = (this.siteFn as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    if (!siteStatic) return false;
    if (this.levelFn !== null) {
      const levelStatic = (this.levelFn as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
      if (!levelStatic) return false;
    }
    return true;
  }

  /** @java CardSuit.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missing = false;

    // Java: check if game has any card components
    const g = game as unknown as {
      equipment?: () => { components?: () => Array<{ isCard(): boolean } | null> };
      addRequirementToReport?: (msg: string) => void;
    };
    const components = g.equipment?.()?.components?.();
    if (components) {
      let gameHasCard = false;
      for (let i = 1; i < components.length; i++) {
        const comp = components[i];
        if (comp && comp.isCard()) {
          gameHasCard = true;
          break;
        }
      }
      if (!gameHasCard) {
        g.addRequirementToReport?.("The ludeme (card Suit ...) is used but the equipment has no cards.");
        missing = true;
      }
    }

    missing = missing || this.siteFn.missingRequirement(game);
    if (this.levelFn !== null) {
      missing = missing || this.levelFn.missingRequirement(game);
    }
    return missing;
  }

  /** @java CardSuit.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = this.siteFn.willCrash(game);
    if (this.levelFn !== null) {
      willCrash = willCrash || this.levelFn.willCrash(game);
    }
    return willCrash;
  }

  /** @java CardSuit.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.concepts(game)) s.add(x);
    if (this.levelFn !== null) {
      for (const x of this.levelFn.concepts(game)) s.add(x);
    }
    return s;
  }

  /** @java CardSuit.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.writesEvalContextRecursive()) s.add(x);
    if (this.levelFn !== null) {
      for (const x of this.levelFn.writesEvalContextRecursive()) s.add(x);
    }
    return s;
  }

  /** @java CardSuit.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.readsEvalContextRecursive()) s.add(x);
    if (this.levelFn !== null) {
      for (const x of this.levelFn.readsEvalContextRecursive()) s.add(x);
    }
    return s;
  }

  /** @java CardSuit.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the suit of the card at " + this.siteFn.toString();
  }
}
