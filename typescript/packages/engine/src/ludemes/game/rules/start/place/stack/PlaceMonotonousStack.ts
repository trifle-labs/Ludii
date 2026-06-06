// @java Core/src/game/rules/start/place/stack/PlaceMonotonousStack.java

/**
 * Places a stack with the same pieces on all the stack.
 *
 * @java game/rules/start/place/stack/PlaceMonotonousStack.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;
/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Minimal interface for an int-valued function.
 * @java game/functions/ints/IntFunction.java — eval(Context)
 */
interface JavaIntFunction {
  eval(context: Context): number;
  preprocess?(game: unknown): void;
  missingRequirement?(game: unknown): boolean;
  willCrash?(game: unknown): boolean;
  gameFlags?(game: unknown): number;
  writesEvalContextRecursive?(): Set<number>;
  readsEvalContextRecursive?(): Set<number>;
  concepts?(game: unknown): Set<number>;
  toEnglish?(game: unknown): string;
}

/** Constant int function. @java game/functions/ints/IntConstant.java */
function intConstant(val: number): JavaIntFunction {
  return {
    eval: (_ctx: Context) => val,
    preprocess: () => {},
    missingRequirement: () => false,
    willCrash: () => false,
    gameFlags: () => 0,
    writesEvalContextRecursive: () => new Set(),
    readsEvalContextRecursive: () => new Set(),
    concepts: () => new Set(),
    toEnglish: () => String(val),
  };
}

/**
 * Places a stack with the same pieces on all the stack.
 *
 * @java game/rules/start/place/stack/PlaceMonotonousStack.java
 */
export class PlaceMonotonousStack {
  /** @java PlaceMonotonousStack.items */
  protected readonly items: string[];

  /** @java PlaceMonotonousStack.container */
  protected readonly container: string | null;

  /** @java PlaceMonotonousStack.countFn */
  protected readonly countFn: JavaIntFunction;

  /** @java PlaceMonotonousStack.stateFn */
  protected readonly stateFn: JavaIntFunction;

  /** @java PlaceMonotonousStack.rotationFn */
  protected readonly rotationFn: JavaIntFunction;

  /** @java PlaceMonotonousStack.valueFn */
  private readonly valueFn: JavaIntFunction;

  /** @java PlaceMonotonousStack.type */
  private type: string | null;

  //-----------------Data to fill a region------------------------------------

  /** @java PlaceMonotonousStack.locationIds */
  protected readonly locationIds: JavaIntFunction[] | null;

  /** @java PlaceMonotonousStack.region */
  protected readonly region: RegionFunction | null;

  /** @java PlaceMonotonousStack.coords */
  protected readonly coords: string[] | null;

  /** @java PlaceMonotonousStack.countsFn */
  protected readonly countsFn: JavaIntFunction[];

  //-------------------------------------------------------------------------

  /**
   * @param item     The item to place.
   * @param type     The graph element type.
   * @param locs     The sites to fill.
   * @param region   The region to fill.
   * @param coords   The coordinates of the sites to fill.
   * @param count    The number of pieces on the stack to place.
   * @param counts   The number of each piece on the stack to place.
   * @param state    The local state value to put on each site.
   * @param rotation The rotation value to put on each site.
   * @param value    The piece value to place [Undefined].
   *
   * @java PlaceMonotonousStack(String, SiteType, IntFunction[], RegionFunction, String[], IntFunction, IntFunction[], IntFunction, IntFunction, IntFunction)
   */
  public constructor(
    item: string,
    type: string | null,
    locs: JavaIntFunction[] | null,
    region: RegionFunction | null,
    coords: string[] | null,
    count: JavaIntFunction | null,
    counts: JavaIntFunction[] | null,
    state: JavaIntFunction | null,
    rotation: JavaIntFunction | null,
    value: JavaIntFunction | null,
  ) {
    // Java: items = new String[] { item };
    this.items = [item];
    this.container = null;
    this.locationIds = locs ?? null;
    this.region = region ?? null;
    this.coords = coords ?? null;

    // Java: countFn = (counts == null) ? ((count != null) ? count : new IntConstant(1)) : counts[0];
    if (counts !== null && counts.length > 0 && counts[0] !== undefined) {
      this.countFn = counts[0];
    } else if (count !== null) {
      this.countFn = count;
    } else {
      this.countFn = intConstant(1);
    }

    // Java: if (counts == null) { countsFn = new IntFunction[0]; } else { countsFn = ...; }
    if (counts === null) {
      this.countsFn = [];
    } else {
      this.countsFn = counts.slice();
    }

    this.stateFn = state ?? intConstant(OFF);
    this.rotationFn = rotation ?? intConstant(OFF);
    this.valueFn = value ?? intConstant(OFF);
    this.type = type ?? null;
  }

  //-------------------------------------------------------------------------

  /**
   * @java PlaceMonotonousStack.eval(Context)
   */
  public eval(context: Context): void {
    const item = this.items[0];
    if (item === undefined) return;

    const game = context.game as unknown as {
      getComponent(name: string): { index(): number } | null;
      mapContainer(): Map<string, { index(): number; numSites(): number }>;
      equipment(): { sitesFrom(): number[] };
    };

    const component = game.getComponent(item);
    if (component === null) {
      throw new Error(`In the starting rules (place) the component ${item} is not defined.`);
    }

    const what = component.index();
    const count = this.countFn.eval(context);
    const state = this.stateFn.eval(context);
    const rotation = this.rotationFn.eval(context);
    const value = this.valueFn.eval(context);

    if (this.container !== null) {
      const c = game.mapContainer().get(this.container);
      if (c === undefined) return;
      const siteFrom = ((game.equipment().sitesFrom()[c.index()] as number | undefined) ?? 0);
      for (let pos = siteFrom; pos < siteFrom + c.numSites(); pos++) {
        this.placePieces(context, pos, what, count, state, rotation, value, true);
      }
    } else {
      // Java: final int[] locs = region.eval(context).sites();
      const locs = (this.region!.eval as (ctx: never) => number[])(context as never);

      // Java: if (countsFn.length != 0 && locs.length != countsFn.length) throw ...
      if (this.countsFn.length !== 0 && locs.length !== this.countsFn.length) {
        throw new Error(
          "In the starting rules (place) the region size is greater than the size of the array counts.",
        );
      }

      for (let k = 0; k < locs.length; k++) {
        const loc = locs[k];
        if (loc === undefined) continue;
        // Java: for (int i = 0; i < ((countsFn.length == 0) ? countFn.eval(context) : countsFn[k].eval(context)); i++)
        const countsFnEntry = this.countsFn[k];
        const repeatCount = this.countsFn.length === 0
          ? this.countFn.eval(context)
          : (countsFnEntry !== undefined ? countsFnEntry.eval(context) : this.countFn.eval(context));
        for (let i = 0; i < repeatCount; i++) {
          this.placePieces(context, loc, what, count, state, rotation, value, true);
        }
      }
    }
  }

  /**
   * Delegate to Start.placePieces via context escape hatch.
   * @java other/rules/start/Start.placePieces(Context, int, int, int, int, int, int, boolean, SiteType)
   */
  private placePieces(
    context: Context,
    site: number,
    what: number,
    count: number,
    state: number,
    rotation: number,
    value: number,
    onStack: boolean,
  ): void {
    (context as unknown as {
      placePieces?(site: number, what: number, count: number, state: number, rotation: number, value: number, onStack: boolean, type: string | null): void;
    }).placePieces?.(site, what, count, state, rotation, value, onStack, this.type);
  }

  //-------------------------------------------------------------------------

  /** @java PlaceMonotonousStack.container() */
  public containerName(): string | null {
    return this.container;
  }

  //-------------------------------------------------------------------------

  /** @java PlaceMonotonousStack.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java PlaceMonotonousStack.preprocess(Game) */
  public preprocess(game: unknown): void {
    // Java: type = SiteType.use(type, game)
    if (this.type === null && (game as unknown as { defaultSiteType?(): string }).defaultSiteType) {
      (this as unknown as { type: string }).type = (game as unknown as { defaultSiteType(): string }).defaultSiteType();
    }

    if (this.locationIds !== null) {
      for (const locationId of this.locationIds) {
        locationId.preprocess?.(game);
      }
    }

    (this.region as unknown as { preprocess?(g: unknown): void })?.preprocess?.(game);

    this.countFn.preprocess?.(game);
    this.rotationFn.preprocess?.(game);
    this.stateFn.preprocess?.(game);
    this.valueFn.preprocess?.(game);

    for (const fn of this.countsFn) {
      fn.preprocess?.(game);
    }
  }

  /** @java PlaceMonotonousStack.missingRequirement(Game) */
  public missingRequirement(_game: unknown): boolean {
    return false;
  }

  /** @java PlaceMonotonousStack.willCrash(Game) */
  public willCrash(_game: unknown): boolean {
    return false;
  }

  /** @java PlaceMonotonousStack.writesEvalContextRecursive() */
  public writesEvalContextRecursive(): Set<number> {
    const result = new Set<number>();
    if (this.locationIds !== null) {
      for (const loc of this.locationIds) {
        for (const v of loc.writesEvalContextRecursive?.() ?? []) result.add(v);
      }
    }
    if (this.region !== null) {
      for (const v of (this.region as unknown as { writesEvalContextRecursive?(): Set<number> }).writesEvalContextRecursive?.() ?? []) result.add(v);
    }
    for (const v of this.countFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.rotationFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.stateFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.valueFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const fn of this.countsFn) {
      for (const v of fn.writesEvalContextRecursive?.() ?? []) result.add(v);
    }
    return result;
  }

  /** @java PlaceMonotonousStack.readsEvalContextRecursive() */
  public readsEvalContextRecursive(): Set<number> {
    const result = new Set<number>();
    if (this.locationIds !== null) {
      for (const loc of this.locationIds) {
        for (const v of loc.readsEvalContextRecursive?.() ?? []) result.add(v);
      }
    }
    if (this.region !== null) {
      for (const v of (this.region as unknown as { readsEvalContextRecursive?(): Set<number> }).readsEvalContextRecursive?.() ?? []) result.add(v);
    }
    for (const v of this.countFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.rotationFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.stateFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.valueFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const fn of this.countsFn) {
      for (const v of fn.readsEvalContextRecursive?.() ?? []) result.add(v);
    }
    return result;
  }

  /** @java PlaceMonotonousStack.toString() */
  public toString(): string {
    return "";
  }

  /** @java PlaceMonotonousStack.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    let regionString = "";
    if (this.locationIds !== null) {
      regionString = "[";
      for (const i of this.locationIds) {
        regionString += (i.toEnglish?.(game) ?? String(i)) + ",";
      }
      regionString = regionString.slice(0, -1) + "]";
    } else if (this.coords !== null) {
      regionString = "[";
      for (const s of this.coords) {
        regionString += s + ",";
      }
      regionString = regionString.slice(0, -1) + "]";
    } else if (this.region !== null) {
      regionString = (this.region as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "region";
    }

    const typeName = (this.type ?? "cell").toLowerCase();
    return `place stack of ${JSON.stringify(this.items)} at ${typeName} ${regionString}`;
  }
}
