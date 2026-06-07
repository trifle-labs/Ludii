// @java Core/src/game/rules/start/place/random/PlaceRandom.java

/**
 * Places pieces randomly in a specified container.
 *
 * @java game/rules/start/place/random/PlaceRandom.java
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

/**
 * Minimal interface for a boolean constant.
 * @java game/functions/booleans/BooleanConstant.java — eval(Context)
 */
interface JavaBooleanConstant {
  eval(context: Context): boolean;
  preprocess?(game: unknown): void;
  gameFlags?(game: unknown): number;
  writesEvalContextRecursive?(): Set<number>;
  readsEvalContextRecursive?(): Set<number>;
  concepts?(game: unknown): Set<number>;
}

/**
 * Minimal interface for a Count object.
 * @java game/util/math/Count.java
 */
interface JavaCount {
  item(): string;
  count(): JavaIntFunction;
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

/** Boolean constant false. @java game/functions/booleans/BooleanConstant.java */
function booleanConstant(val: boolean): JavaBooleanConstant {
  return {
    eval: (_ctx: Context) => val,
    preprocess: () => {},
    gameFlags: () => 0,
    writesEvalContextRecursive: () => new Set(),
    readsEvalContextRecursive: () => new Set(),
    concepts: () => new Set(),
  };
}

function isJavaIntFunction(value: unknown): value is JavaIntFunction {
  return typeof value === "object"
    && value !== null
    && typeof (value as JavaIntFunction).eval === "function";
}

function isJavaCountArray(value: unknown, argCount: number, where: unknown): value is JavaCount[] {
  return Array.isArray(value)
    && argCount <= 3
    && isJavaIntFunction(where)
    && (
      value.length === 0
      || (
        typeof (value[0] as JavaCount | undefined)?.item === "function"
        && typeof (value[0] as JavaCount | undefined)?.count === "function"
      )
    );
}

/**
 * Places pieces randomly in a specified container.
 *
 * @java game/rules/start/place/random/PlaceRandom.java
 */
export class PlaceRandom {
  /** @java PlaceRandom.region */
  private readonly region: RegionFunction;

  /** @java PlaceRandom.item */
  private readonly item: string[] | null;

  /** @java PlaceRandom.countFn */
  private readonly countFn: JavaIntFunction;

  /** @java PlaceRandom.valueFn */
  private readonly valueFn: JavaIntFunction;

  /** @java PlaceRandom.stateFn */
  private readonly stateFn: JavaIntFunction;

  /** @java PlaceRandom.stack */
  private readonly stack: boolean;

  /** @java PlaceRandom.where */
  private readonly where: JavaIntFunction | null;

  /** @java PlaceRandom.pieces */
  private readonly pieces: string[] | null;

  /** @java PlaceRandom.counts */
  private readonly counts: JavaIntFunction[] | null;

  /** @java PlaceRandom.type */
  private type: string | null;

  /** @java PlaceRandom.randPiecOrderFn */
  private readonly randPiecOrderFn: JavaBooleanConstant;

  // Sentinel null-region for stack constructors (no SitesBoard in TS)
  private static readonly NULL_REGION: RegionFunction = {
    eval: (_ctx: never) => [],
  };

  /**
   * Random placement of pieces within a region.
   *
   * @java PlaceRandom(RegionFunction, String[], IntFunction, IntFunction, IntFunction, SiteType, BooleanConstant)
   */
  public constructor(
    region: RegionFunction | null,
    item: string[],
    count?: JavaIntFunction | null,
    value?: JavaIntFunction | null,
    state?: JavaIntFunction | null,
    type?: string | null,
    randPiecOrder?: JavaBooleanConstant | null,
  );

  /**
   * Random stack placement to a specific site.
   *
   * @java PlaceRandom(String[], IntFunction[], IntFunction, IntFunction, IntFunction, SiteType)
   */
  public constructor(
    pieces: string[],
    count: JavaIntFunction[] | null,
    value: JavaIntFunction | null,
    state: JavaIntFunction | null,
    where: JavaIntFunction,
    type?: string | null,
  );

  /**
   * Random stack placement using Count[] items.
   *
   * @java PlaceRandom(Count[], IntFunction, SiteType)
   */
  public constructor(
    items: JavaCount[],
    where: JavaIntFunction,
    type?: string | null,
  );

  public constructor(
    arg0: RegionFunction | null | string[] | JavaCount[],
    arg1: string[] | JavaIntFunction[] | null | JavaIntFunction,
    arg2: JavaIntFunction | null | string | undefined,
    arg3?: JavaIntFunction | null,
    arg4?: JavaIntFunction | string | null,
    arg5?: string | null,
    arg6?: JavaBooleanConstant | null,
  ) {
    // Dispatch based on Java constructor arity and argument shapes.
    if (isJavaCountArray(arg0, arguments.length, arg1)) {
      // Constructor 3: (Count[], IntFunction, SiteType)
      const items = arg0 as JavaCount[];
      const where = arg1 as JavaIntFunction;
      const type = arg2 as string | null | undefined;

      this.region = PlaceRandom.NULL_REGION;
      this.item = null;
      this.countFn = intConstant(1);
      this.where = where;
      this.stack = true;
      this.type = type ?? null;
      this.stateFn = intConstant(OFF);
      this.valueFn = intConstant(OFF);
      this.randPiecOrderFn = booleanConstant(false);

      this.pieces = new Array<string>(items.length);
      this.counts = new Array<JavaIntFunction>(items.length);
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it !== undefined) {
          this.pieces[i] = it.item();
          this.counts[i] = it.count();
        }
      }
    } else if (Array.isArray(arg0) && isJavaIntFunction(arg4)) {
      // Constructor 2: (String[], IntFunction[], IntFunction, IntFunction, IntFunction, SiteType)
      const pieces = arg0 as string[];
      const count = arg1 as JavaIntFunction[] | null;
      const value = arg2 as JavaIntFunction | null;
      const state = arg3 as JavaIntFunction | null;
      const where = arg4 as JavaIntFunction;
      const type = arg5 as string | null;

      this.region = PlaceRandom.NULL_REGION;
      this.item = null;
      this.countFn = intConstant(1);
      this.pieces = pieces;
      this.where = where;
      this.counts = count;
      this.stack = true;
      this.stateFn = state ?? intConstant(OFF);
      this.valueFn = value ?? intConstant(OFF);
      this.randPiecOrderFn = booleanConstant(false);
      this.type = type ?? null;
    } else {
      // Constructor 1: (RegionFunction | null, String[], IntFunction, IntFunction, IntFunction, SiteType, BooleanConstant)
      const region = arg0 as RegionFunction | null;
      const item = arg1 as string[];
      const count = arg2 as JavaIntFunction | null;
      const value = arg3 as JavaIntFunction | null;
      const state = arg4 as JavaIntFunction | null;
      const type = arg5 as string | null;
      const randPiecOrder = arg6 as JavaBooleanConstant | null;

      // Java: this.region = (region == null ? new SitesBoard(type) : region);
      this.region = region ?? PlaceRandom.NULL_REGION;
      this.countFn = count ?? intConstant(1);
      this.item = item;
      this.where = null;
      this.pieces = null;
      this.counts = null;
      this.stack = false;
      this.stateFn = state ?? intConstant(OFF);
      this.valueFn = value ?? intConstant(OFF);
      this.randPiecOrderFn = randPiecOrder ?? booleanConstant(false);
      this.type = type ?? null;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java PlaceRandom.eval(Context)
   */
  public eval(context: Context): void {
    if (this.stack) {
      this.evalStack(context);
    } else if (this.randPiecOrderFn.eval(context)) {
      // Java: random piece order path
      const realType = this.type ?? (context as unknown as { board(): { defaultSite(): string } }).board?.().defaultSite?.() ?? "Cell";
      const sitesArr = (this.region.eval as (ctx: never) => number[])(context as never);
      const sites = sitesArr.slice(); // mutable copy

      const items = (this.item ?? []).slice(); // mutable copy

      for (let iter = 0; iter < items.length - 1; iter++) {
        const randomIndex = context.rng.nextInt(Math.max(1, items.length));
        const spliced = items.splice(randomIndex, 1);
        const it = spliced[0];
        if (it === undefined) continue;

        const component = (context.game as unknown as { getComponent(name: string): { index(): number } | null }).getComponent(it);
        if (component === null) {
          throw new Error(`Component ${JSON.stringify(this.item)} is not defined.`);
        }

        const what = component.index();

        // remove the non empty sites in that region
        for (let index = sites.length - 1; index >= 0; index--) {
          const site = sites[index];
          if (site === undefined) continue;
          const cid = (realType === "Cell" || realType === "Vertex")
            ? ((context as unknown as { containerId(): number[] }).containerId()?.[site] ?? 0)
            : 0;
          const cs = (context as unknown as { containerState(cid: number): { what(site: number, type: string): number } }).containerState(cid);
          if (cs.what(site, realType) !== 0) {
            sites.splice(index, 1);
          }
        }

        const state = this.stateFn.eval(context);
        const value = this.valueFn.eval(context);

        const countN = this.countFn.eval(context);
        for (let i = 0; i < countN; i++) {
          const emptySites = sites.slice();
          if (emptySites.length === 0) break;
          const siteIdx = context.rng.nextInt(emptySites.length);
          const site = emptySites[siteIdx];
          if (site === undefined) break;
          const pos = sites.indexOf(site);
          if (pos >= 0) sites.splice(pos, 1);
          this.placePieces(context, site, what, 1, state, OFF, value, false, realType);
        }
      }
    } else {
      // Java: standard path — iterate items
      const realType = this.type ?? (context as unknown as { board(): { defaultSite(): string } }).board?.().defaultSite?.() ?? "Cell";

      for (const it of (this.item ?? [])) {
        const sitesArr = (this.region.eval as (ctx: never) => number[])(context as never);
        const sites = sitesArr.slice(); // mutable copy

        const component = (context.game as unknown as { getComponent(name: string): { index(): number } | null }).getComponent(it);
        if (component === null) {
          throw new Error(`Component ${this.item} is not defined.`);
        }

        const what = component.index();

        // remove the non empty sites in that region
        for (let index = sites.length - 1; index >= 0; index--) {
          const site = sites[index];
          if (site === undefined) continue;
          const cid = realType === "Cell"
            ? ((context as unknown as { containerId(): number[] }).containerId()?.[site] ?? 0)
            : 0;
          const cs = (context as unknown as { containerState(cid: number): { what(site: number, type: string): number } }).containerState(cid);
          if (cs.what(site, realType) !== 0) {
            sites.splice(index, 1);
          }
        }

        const state = this.stateFn.eval(context);
        const value = this.valueFn.eval(context);

        const countN = this.countFn.eval(context);
        for (let i = 0; i < countN; i++) {
          const emptySites = sites.slice();
          if (emptySites.length === 0) break;
          const siteIdx = context.rng.nextInt(emptySites.length);
          const site = emptySites[siteIdx];
          if (site === undefined) break;
          const pos = sites.indexOf(site);
          if (pos >= 0) sites.splice(pos, 1);
          this.placePieces(context, site, what, 1, state, OFF, value, false, realType);
        }
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java PlaceRandom.evalStack(Context)
   */
  private evalStack(context: Context): void {
    const realType = this.type ?? (context as unknown as { board(): { defaultSite(): string } }).board?.().defaultSite?.() ?? "Cell";
    const site = this.where!.eval(context);
    const toPlace: number[] = [];

    const piecesArr = this.pieces ?? [];
    for (let i = 0; i < piecesArr.length; i++) {
      const piece = piecesArr[i];
      if (piece === undefined) continue;
      const components = (context as unknown as { components(): ({ name(): string } | null)[] }).components();
      for (let pieceIndex = 1; pieceIndex < components.length; pieceIndex++) {
        if (components[pieceIndex]?.name() === piece) {
          if (this.counts === null) {
            toPlace.push(pieceIndex);
          } else {
            const countsEntry = this.counts[i];
            if (countsEntry !== undefined) {
              const c = countsEntry.eval(context);
              for (let j = 0; j < c; j++) {
                toPlace.push(pieceIndex);
              }
            }
          }
          break;
        }
      }
    }

    const state = this.stateFn.eval(context);
    const value = this.valueFn.eval(context);

    while (toPlace.length > 0) {
      const index = context.rng.nextInt(toPlace.length);
      const what = toPlace[index];
      if (what === undefined) break;
      this.placePieces(context, site, what, 1, state, OFF, value, true, realType);
      toPlace.splice(index, 1);
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
    type: string,
  ): void {
    (context as unknown as {
      placePieces?(site: number, what: number, count: number, state: number, rotation: number, value: number, onStack: boolean, type: string | null): void;
    }).placePieces?.(site, what, count, state, rotation, value, onStack, type);
  }

  //-------------------------------------------------------------------------

  /** @java PlaceRandom.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java PlaceRandom.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.region as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);

    // Java: type = SiteType.use(type, game)
    if (this.type === null && (game as unknown as { defaultSiteType?(): string }).defaultSiteType) {
      (this as unknown as { type: string }).type = (game as unknown as { defaultSiteType(): string }).defaultSiteType();
    }

    this.where?.preprocess?.(game);

    if (this.counts !== null) {
      for (const func of this.counts) {
        func.preprocess?.(game);
      }
    }

    this.randPiecOrderFn.preprocess?.(game);

    this.countFn.preprocess?.(game);
    this.stateFn.preprocess?.(game);
    this.valueFn.preprocess?.(game);
  }

  /** @java PlaceRandom.missingRequirement(Game) */
  public missingRequirement(_game: unknown): boolean {
    return false;
  }

  /** @java PlaceRandom.willCrash(Game) */
  public willCrash(_game: unknown): boolean {
    return false;
  }

  /** @java PlaceRandom.writesEvalContextRecursive() */
  public writesEvalContextRecursive(): Set<number> {
    const result = new Set<number>();
    if (this.where !== null) {
      for (const v of this.where.writesEvalContextRecursive?.() ?? []) result.add(v);
    } else {
      for (const v of (this.region as unknown as { writesEvalContextRecursive?(): Set<number> }).writesEvalContextRecursive?.() ?? []) result.add(v);
    }
    if (this.counts !== null) {
      for (const func of this.counts) {
        for (const v of func.writesEvalContextRecursive?.() ?? []) result.add(v);
      }
    }
    for (const v of this.randPiecOrderFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.countFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.stateFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.valueFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    return result;
  }

  /** @java PlaceRandom.readsEvalContextRecursive() */
  public readsEvalContextRecursive(): Set<number> {
    const result = new Set<number>();
    if (this.where !== null) {
      for (const v of this.where.readsEvalContextRecursive?.() ?? []) result.add(v);
    } else {
      for (const v of (this.region as unknown as { readsEvalContextRecursive?(): Set<number> }).readsEvalContextRecursive?.() ?? []) result.add(v);
    }
    if (this.counts !== null) {
      for (const func of this.counts) {
        for (const v of func.readsEvalContextRecursive?.() ?? []) result.add(v);
      }
    }
    for (const v of this.randPiecOrderFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.countFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.stateFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.valueFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    return result;
  }

  /** @java PlaceRandom.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    const regionString = (this.region as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "";
    const valueString = this.valueFn ? ` with value ${this.valueFn}` : "";
    const stateString = this.stateFn ? ` with state ${this.stateFn}` : "";
    const countStr = this.countFn.toEnglish?.(game) ?? String(this.countFn);
    const typeName = (this.type ?? "cell").toLowerCase();
    return `randomly place ${countStr} ${JSON.stringify(this.item)} within ${typeName} ${regionString}${valueString}${stateString}`;
  }
}
