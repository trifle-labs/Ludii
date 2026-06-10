// @java Core/src/game/rules/start/place/item/PlaceItem.java

/**
 * Places a piece at a particular site or to a region.
 *
 * @java game/rules/start/place/item/PlaceItem.java
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
 * @param str
 * @return True if str does not have any number.
 * @java PlaceItem.stringWitoutNumber(String)
 */
function stringWithoutNumber(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c >= 48 && c <= 57) return false; // '0'–'9'
  }
  return true;
}

/**
 * Places a piece at a particular site or to a region.
 *
 * Mirrors Java's PlaceItem with both single-site and fill-region constructors.
 *
 * @java game/rules/start/place/item/PlaceItem.java
 */
export class PlaceItem {
  /** @java PlaceItem.item */
  private readonly item: string;

  /** @java PlaceItem.container */
  private readonly container: string | null;

  /** @java PlaceItem.siteId */
  private readonly siteId: JavaIntFunction | null;

  /** @java PlaceItem.coord */
  private readonly coord: string | null;

  /** @java PlaceItem.countFn */
  private readonly countFn: JavaIntFunction;

  /** @java PlaceItem.stateFn */
  private readonly stateFn: JavaIntFunction;

  /** @java PlaceItem.rotationFn */
  private readonly rotationFn: JavaIntFunction;

  /** @java PlaceItem.valueFn */
  private readonly valueFn: JavaIntFunction;

  /** @java PlaceItem.type */
  private type: string | null;

  //-----------------Data to fill a region------------------------------------

  /** @java PlaceItem.locationIds */
  private readonly locationIds: JavaIntFunction[] | null;

  /** @java PlaceItem.region */
  private readonly region: RegionFunction | null;

  /** @java PlaceItem.coords */
  private readonly coords: string[] | null;

  /** @java PlaceItem.countsFn */
  private readonly countsFn: JavaIntFunction[] | null;

  /**
   * Single-site constructor.
   *
   * @param item      The name of the item.
   * @param container The name of the container.
   * @param type      The graph element type.
   * @param loc       The location to place a piece.
   * @param coord     The coordinate of the location to place a piece.
   * @param count     The number of the same piece to place [1].
   * @param state     The local state value of the piece to place [Undefined].
   * @param rotation  The rotation value of the piece to place [Undefined].
   * @param value     The piece value to place [Undefined].
   *
   * @java PlaceItem(String, String, SiteType, IntFunction, String, IntFunction, IntFunction, IntFunction, IntFunction)
   */
  public constructor(
    item: string,
    container: string | null,
    type: string | null,
    loc: JavaIntFunction | null,
    coord: string | null,
    count: JavaIntFunction | null,
    state: JavaIntFunction | null,
    rotation: JavaIntFunction | null,
    value: JavaIntFunction | null,
  );

  /**
   * Fill-region constructor.
   *
   * @param item      The name of the item.
   * @param container Always null for fill variant.
   * @param type      The graph element type.
   * @param siteId    Always null for fill variant.
   * @param coord     Always null for fill variant.
   * @param count_    Always null for fill variant (determined from counts).
   * @param state     The local state value to put on each site.
   * @param rotation  The rotation value to put on each site.
   * @param value     The piece value to place [Undefined].
   * @param locs      The sites to fill.
   * @param region    The region to fill.
   * @param coords    The coordinates of the sites to fill.
   * @param counts    The number of pieces on the state.
   *
   * @java PlaceItem(String, SiteType, IntFunction[], RegionFunction, String[], IntFunction[], IntFunction, IntFunction, IntFunction)
   */
  public constructor(
    item: string,
    container: string | null,
    type: string | null,
    siteId: JavaIntFunction | null,
    coord: string | null,
    count_: JavaIntFunction | null,
    state: JavaIntFunction | null,
    rotation: JavaIntFunction | null,
    value: JavaIntFunction | null,
    locs: JavaIntFunction[] | null,
    region: RegionFunction | null,
    coords: string[] | null,
    counts: JavaIntFunction[] | null,
  );

  public constructor(
    item: string,
    container: string | null,
    type: string | null,
    loc: JavaIntFunction | null,
    coord: string | null,
    count: JavaIntFunction | null,
    state: JavaIntFunction | null,
    rotation: JavaIntFunction | null,
    value: JavaIntFunction | null,
    locs?: JavaIntFunction[] | null,
    region?: RegionFunction | null,
    coords?: string[] | null,
    counts?: JavaIntFunction[] | null,
  ) {
    const coordList = Array.isArray(coord) ? coord as unknown as string[] : null;
    const typeAsLocs = Array.isArray(type) ? type as unknown as JavaIntFunction[] : null;
    this.item = item ?? null;
    this.container = container ?? null;
    this.coord = coordList === null ? coord ?? null : null;
    this.type = typeAsLocs === null ? type ?? null : null;

    if (typeAsLocs !== null || coordList !== null || locs !== undefined || region !== undefined || coords !== undefined || counts !== undefined) {
      // Fill-region constructor — mirrors Java's second constructor
      this.siteId = null;
      this.locationIds = locs ?? typeAsLocs;
      this.region = region ?? null;
      this.coords = coords ?? coordList ?? null;

      // Java: countFn = (counts == null) ? new IntConstant(1) : counts[0];
      this.countFn = (counts == null || counts.length === 0) ? intConstant(1) : (counts[0] ?? intConstant(1));

      // Java: if (counts == null) countsFn = new IntFunction[0]; else ...
      if (counts == null) {
        this.countsFn = [];
      } else {
        this.countsFn = counts.slice();
      }
    } else {
      // Single-site constructor — mirrors Java's first constructor
      this.siteId = loc ?? null;
      this.locationIds = null;
      this.region = null;
      this.coords = null;
      this.countsFn = null;

      // Java: countFn = (count == null) ? new IntConstant(1) : count;
      this.countFn = count ?? intConstant(1);
    }

    // Java: stateFn = (state == null) ? new IntConstant(Constants.OFF) : state;
    this.stateFn = state ?? intConstant(OFF);
    // Java: rotationFn = (rotation == null) ? new IntConstant(Constants.OFF) : rotation;
    this.rotationFn = rotation ?? intConstant(OFF);
    // Java: valueFn = (value == null) ? new IntConstant(Constants.OFF) : value;
    this.valueFn = value ?? intConstant(OFF);
  }

  //-------------------------------------------------------------------------

  /**
   * @java PlaceItem.eval(Context)
   *
   * Dispatches to evalFill, evalPuzzle, or the single-site path.
   */
  public eval(context: Context): void {
    // Java: if (locationIds != null || region != null || coords != null || countsFn != null)
    if (this.locationIds !== null || this.region !== null || this.coords !== null || this.countsFn !== null) {
      this.evalFill(context);
    } else if ((context.game as unknown as { isDeductionPuzzle?(): boolean }).isDeductionPuzzle?.()) {
      this.evalPuzzle(context);
    } else {
      const count = this.countFn.eval(context);
      const state = this.stateFn.eval(context);
      const rotation = this.rotationFn.eval(context);
      const value = this.valueFn.eval(context);

      const game = context.game as unknown as {
        getComponent(name: string): { index(): number; role(): { equals(r: string): boolean } } | null;
        mapContainer(): Map<string, { index(): number; numSites(): number }>;
        players(): { count(): number };
        equipment(): { sitesFrom(): number[]; components(): { name(): string }[] };
      };

      const testComponent = game.getComponent(this.item);
      // Java: if (stringWitoutNumber(item) && container != null && container.equals("Hand") && (testComponent == null || !testComponent.role().equals(RoleType.Shared)))
      if (
        stringWithoutNumber(this.item) &&
        this.container !== null &&
        this.container === "Hand" &&
        (testComponent === null || !testComponent.role().equals("Shared"))
      ) {
        const playerCount = game.players().count();
        for (let pid = 1; pid <= playerCount; pid++) {
          const itemPlayer = this.item + pid;
          const handPlayer = this.container + pid;

          const component = game.getComponent(itemPlayer);
          if (component === null) {
            throw new Error(`In the starting rules (place) the component ${itemPlayer} is not defined (A).`);
          }

          const c = game.mapContainer().get(handPlayer);
          if (c === undefined) continue;
          const cs = (context as unknown as { containerState(idx: number): { isEmpty(site: number, type: string | null): boolean } }).containerState(c.index());

          let site = (game.equipment().sitesFrom()[c.index()] as number | undefined) ?? 0;
          while (!cs.isEmpty(site, this.type)) site++;

          this.placePieces(context, site, component.index(), count, state, rotation, value, false);
        }
        return;
      }

      const component = game.getComponent(this.item);
      if (component === null) {
        throw new Error(`In the starting rules (place) the component ${this.item} is not defined (B).`);
      }

      const what = component.index();

      if (this.container !== null) {
        const c = game.mapContainer().get(this.container);
        if (c === undefined) return;
        const siteFrom = ((game.equipment().sitesFrom()[c.index()] as number | undefined) ?? 0);
        const comp = (game as unknown as { equipment(): { components(): ({ isDie?(): boolean; roll?(ctx: Context): number; index(): number } | null)[] } }).equipment().components()[what];

        // Java: if (comp.isDie())
        if (comp?.isDie?.()) {
          const containerStates2 = (context as unknown as { state(): { containerStates(): { what(site: number, type: string | null): number }[] } }).state().containerStates();
          for (let pos = siteFrom; pos < siteFrom + c.numSites(); pos++) {
            const csState = containerStates2[c.index()];
            if (csState !== undefined && csState.what(pos, this.type) === 0) {
              this.placePieces(context, pos, what, count, state, rotation, value, false);
              break;
            }
          }
        } else if (this.container.includes("Hand")) {
          this.placePieces(context, siteFrom, c.index(), count, state, rotation, value, false);
          return;
        } else {
          this.placePieces(context, (this.siteId?.eval(context) ?? 0) + siteFrom, what, count, state, rotation, value, false);
        }
      } else {
        if (this.siteId === null && this.coord === null) return;

        let site = UNDEFINED;

        if (this.coord !== null) {
          const element = (context as unknown as {
            board(): { topology(): { getElement?(coord: string, type: string | null): { index(): number } | null } }
          }).board().topology().getElement?.(this.coord, this.type);
          if (element === null || element === undefined) {
            throw new Error(`In the starting rules (place) the coordinate ${this.coord} not found.`);
          }
          site = element.index();
        } else if (this.siteId !== null) {
          site = this.siteId.eval(context);
        }

        this.placePieces(context, site, what, count, state, rotation, value, false);
      }
    }
  }

  /**
   * To eval the place ludeme for a region/list of sites.
   *
   * @java PlaceItem.evalFill(Context)
   */
  private evalFill(context: Context): void {
    const game = context.game as unknown as {
      getComponent(name: string): { index(): number } | null;
      mapContainer(): Map<string, { index(): number; numSites(): number }>;
      equipment(): { sitesFrom(): number[]; components(): unknown[] };
    };

    const component = game.getComponent(this.item);
    if (component === null) {
      throw new Error(`In the starting rules (place) the component ${this.item} is not defined (C).`);
    }

    const what = component.index();
    const count = this.countFn.eval(context);
    const state = this.stateFn.eval(context);
    const rotation = this.rotationFn.eval(context);
    const value = this.valueFn.eval(context);

    // Java: if (container != null)
    if (this.container !== null) {
      const c = game.mapContainer().get(this.container);
      if (c === undefined) return;
      const siteFrom = ((game.equipment().sitesFrom()[c.index()] as number | undefined) ?? 0);

      if (this.region !== null) {
        const locs = (this.region.eval as (ctx: never) => number[])(context as never);
        for (const loc of locs) {
          this.placePieces(context, loc + siteFrom, what, count, state, rotation, value, false);
        }
      } else if (this.locationIds !== null) {
        for (const locFn of this.locationIds) {
          this.placePieces(context, locFn.eval(context) + siteFrom, what, count, state, rotation, value, false);
        }
      } else {
        const containerStates3 = (context as unknown as { state(): { containerStates(): { what(site: number, type: string | null): number }[] } }).state().containerStates();
        const cs = containerStates3[c.index()];
        if (cs !== undefined) {
          for (let pos = siteFrom; pos < siteFrom + c.numSites(); pos++) {
            if (cs.what(pos, this.type) === 0) {
              this.placePieces(context, pos, what, count, state, rotation, value, false);
              break;
            }
          }
        }
      }
    } else {
      // Java: place with coords
      if (this.coords !== null) {
        for (const coordinate of this.coords) {
          const element = (context as unknown as {
            board(): { topology(): { getElement?(coord: string, type: string | null): { index(): number } | null } }
          }).board().topology().getElement?.(coordinate, this.type);
          if (element === null || element === undefined) {
            console.warn(`** Coord ${coordinate} not found.`);
          } else {
            this.placePieces(context, element.index(), what, count, state, rotation, value, false);
          }
        }
      } else if (this.region !== null) {
        const regionEval = (this.region.eval as (ctx: never) => number[])(context as never);
        if (regionEval !== null && regionEval !== undefined) {
          for (const loc of regionEval) {
            this.placePieces(context, loc, what, count, state, rotation, value, false);
          }
        }
      } else if (this.locationIds !== null) {
        for (const locFn of this.locationIds) {
          this.placePieces(context, locFn.eval(context), what, count, state, rotation, value, false);
        }
      }
    }
  }

  /**
   * @java PlaceItem.evalPuzzle(Context)
   */
  private evalPuzzle(context: Context): void {
    const game = context.game as unknown as {
      getComponent(name: string): { index(): number } | null;
    };

    const component = game.getComponent(this.item);
    if (component === null) {
      throw new Error(`In the starting rules (place) the component ${this.item} is not defined.`);
    }

    const what = component.index();
    const site = this.siteId?.eval(context) ?? 0;

    // Java: BaseAction actionAtomic = new ActionSet(SiteType.Cell, siteId.eval(context), what);
    // Java: actionAtomic.apply(context, true); context.trial().addMove(new Move(actionAtomic)); context.trial().addInitPlacement();
    const actionSet = (context as unknown as {
      createActionSet?(type: string, site: number, what: number): unknown;
    }).createActionSet?.("Cell", site, what);
    if (actionSet) {
      (actionSet as { apply?(ctx: Context, init: boolean): void }).apply?.(context, true);
    }
    (context.trial as unknown as { addMove?(m: unknown): void }).addMove?.({ action: actionSet });
    (context.trial as unknown as { addInitPlacement?(): void }).addInitPlacement?.();
  }

  /**
   * Mirror of Java's Start.placePieces — delegates to the Start utility via context.
   *
   * In the 1:1 port, placePieces is delegated through the context game object or
   * the Start utility. We call through the escape hatch.
   *
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

  /** @java PlaceItem.item() */
  public itemName(): string {
    return this.item;
  }

  /** @java PlaceItem.posn() */
  public posn(): JavaIntFunction | null {
    return this.siteId;
  }

  /** @java PlaceItem.container() */
  public containerName(): string | null {
    return this.container;
  }

  //-------------------------------------------------------------------------

  /** @java PlaceItem.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java PlaceItem.preprocess(Game) */
  public preprocess(game: unknown): void {
    // Java: type = SiteType.use(type, game)
    if ((game as unknown as { defaultSiteType?(): string }).defaultSiteType) {
      this.type = this.type ?? (game as unknown as { defaultSiteType(): string }).defaultSiteType();
    }

    this.siteId?.preprocess?.(game);

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

    if (this.countsFn !== null) {
      for (const fn of this.countsFn) {
        fn.preprocess?.(game);
      }
    }
  }

  /** @java PlaceItem.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    return false;
  }

  /** @java PlaceItem.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    return false;
  }

  /** @java PlaceItem.writesEvalContextRecursive() */
  public writesEvalContextRecursive(): Set<number> {
    const result = new Set<number>();
    if (this.locationIds !== null) {
      for (const loc of this.locationIds) {
        for (const v of loc.writesEvalContextRecursive?.() ?? []) result.add(v);
      }
    }
    if (this.siteId !== null) {
      for (const v of this.siteId.writesEvalContextRecursive?.() ?? []) result.add(v);
    }
    for (const v of this.countFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.rotationFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.stateFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.valueFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    if (this.countsFn !== null) {
      for (const fn of this.countsFn) {
        for (const v of fn.writesEvalContextRecursive?.() ?? []) result.add(v);
      }
    }
    return result;
  }

  /** @java PlaceItem.readsEvalContextRecursive() */
  public readsEvalContextRecursive(): Set<number> {
    const result = new Set<number>();
    if (this.locationIds !== null) {
      for (const loc of this.locationIds) {
        for (const v of loc.readsEvalContextRecursive?.() ?? []) result.add(v);
      }
    }
    if (this.siteId !== null) {
      for (const v of this.siteId.readsEvalContextRecursive?.() ?? []) result.add(v);
    }
    for (const v of this.countFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.rotationFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.stateFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.valueFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    if (this.countsFn !== null) {
      for (const fn of this.countsFn) {
        for (const v of fn.readsEvalContextRecursive?.() ?? []) result.add(v);
      }
    }
    return result;
  }

  /** @java PlaceItem.toString() */
  public toString(): string {
    let str = `(place ${this.item}`;
    if (this.container !== null) str += ` on cont: ${this.container}`;
    if (this.siteId !== null) str += ` at: ${this.siteId}`;
    str += ` count: ${this.countFn}`;
    str += ` state: ${this.stateFn}`;
    str += ")";
    return str;
  }

  /** @java PlaceItem.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    let text = "";

    if (this.coord !== null) {
      text += `Place a ${this.item} on site ${this.coord}.`;
    } else if (this.coords !== null && this.coords.length > 0) {
      const count = this.coords.length;
      text += `Place a ${this.item} on site${count === 1 ? " " : "s: "}`;
      for (let i = 0; i < count; i++) {
        if (i === count - 1) text += " and ";
        else if (i > 0) text += ", ";
        text += this.coords[i];
      }
      text += ".";
    } else if (this.region !== null) {
      const regionStr = (this.region as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "region";
      text += `Place a ${this.item} at ${regionStr}.`;
    }

    return text;
  }
}
