// @java Core/src/game/functions/ints/card/site/CardTrumpValue.java

/**
 * Returns the trump value of a card.
 *
 * @java game/functions/ints/card/site/CardTrumpValue.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/** Constant-returning int function for default level = 0. */
function constIntFn(val: number): JavaIntFunction {
  return {
    eval(_ctx: Context): number { return val; },
    exceeds(ctx: Context, other: JavaIntFunction): boolean { return val > other.eval(ctx); },
    isHint(): boolean { return false; },
    isHand(): boolean { return false; },
    concepts(_g: unknown): Set<number> { return new Set(); },
    readsEvalContextRecursive(): Set<number> { return new Set(); },
    writesEvalContextRecursive(): Set<number> { return new Set(); },
    missingRequirement(_g: unknown): boolean { return false; },
    willCrash(_g: unknown): boolean { return false; },
    toEnglish(_g: unknown): string { return String(val); },
  };
}

/**
 * Returns the trump value of the card at the given site and level.
 *
 * @java game/functions/ints/card/site/CardTrumpValue.java
 */
export class CardTrumpValue extends BaseIntFunction {
  /** The site where the card is. @java CardTrumpValue.siteFn */
  private readonly siteFn: JavaIntFunction;

  /** The level where the card is (defaults to 0). @java CardTrumpValue.levelFn */
  private readonly levelFn: JavaIntFunction;

  /**
   * @param site  The site where the card is.
   * @param level The level where the card is [0].
   * @java CardTrumpValue(IntFunction, IntFunction)
   */
  public constructor(site: JavaIntFunction, level: JavaIntFunction | null) {
    super();
    this.siteFn  = site;
    // Java: levelFn = (level == null) ? new IntConstant(0) : level
    this.levelFn = level !== null && level !== undefined ? level : constIntFn(0);
  }

  /**
   * @java CardTrumpValue.eval(Context)
   *
   * Returns the trump value of the card at the given site/level, or OFF if no card.
   */
  public override eval(context: Context): number {
    const site  = this.siteFn.eval(context);
    const level = this.levelFn.eval(context);

    // Java: int cid = context.containerId()[site]
    // Java: ContainerState cs = context.containerState(cid)
    const ctx = context as unknown as {
      containerId?: () => number[];
      containerState?: (cid: number) => {
        whatCell(site: number, level: number): number;
      };
      components?: () => Array<{
        isCard(): boolean;
        trumpValue(): number;
      } | null>;
    };

    const containerIdArr = ctx.containerId?.();
    const cid = containerIdArr ? (containerIdArr[site] ?? 0) : 0;
    const cs  = ctx.containerState?.(cid);

    let what: number;
    if (cs) {
      // Java: cs.whatCell(site, level)
      what = cs.whatCell(site, level);
    } else {
      what = context.state.whatAtSiteLevel(site, level);
    }

    if (what < 1) return OFF;

    // Java: Component component = context.components()[what]
    const components = ctx.components?.();
    if (components) {
      const component = components[what];
      if (!component || !component.isCard()) return OFF;
      return component.trumpValue();
    }

    return OFF;
  }

  /** @java CardTrumpValue.isStatic() */
  public isStatic(): boolean {
    const siteStatic  = (this.siteFn  as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    const levelStatic = (this.levelFn as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    return siteStatic && levelStatic;
  }

  /** @java CardTrumpValue.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missing = false;

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
        g.addRequirementToReport?.("The ludeme (card TrumpValue ...) is used but the equipment has no cards.");
        missing = true;
      }
    }

    missing = missing || this.siteFn.missingRequirement(game);
    missing = missing || this.levelFn.missingRequirement(game);
    return missing;
  }

  /** @java CardTrumpValue.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.siteFn.willCrash(game) || this.levelFn.willCrash(game);
  }

  /** @java CardTrumpValue.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.concepts(game)) s.add(x);
    for (const x of this.levelFn.concepts(game)) s.add(x);
    return s;
  }

  /** @java CardTrumpValue.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.writesEvalContextRecursive()) s.add(x);
    for (const x of this.levelFn.writesEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java CardTrumpValue.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.readsEvalContextRecursive()) s.add(x);
    for (const x of this.levelFn.readsEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java CardTrumpValue.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the trump value of the card at " + this.siteFn.toString();
  }
}
