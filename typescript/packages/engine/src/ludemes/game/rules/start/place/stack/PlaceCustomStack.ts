// @java Core/src/game/rules/start/place/stack/PlaceCustomStack.java

/**
 * Places a stack with different pieces to a site.
 *
 * @java game/rules/start/place/stack/PlaceCustomStack.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";

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
 * Places a stack with different pieces to a site.
 *
 * @java game/rules/start/place/stack/PlaceCustomStack.java
 */
export class PlaceCustomStack {
  /** @java PlaceCustomStack.items */
  protected readonly items: string[];

  /** @java PlaceCustomStack.container */
  protected readonly container: string | null;

  /** @java PlaceCustomStack.siteId */
  protected readonly siteId: JavaIntFunction | null;

  /** @java PlaceCustomStack.coord */
  protected readonly coord: string | null;

  /** @java PlaceCustomStack.countFn */
  protected readonly countFn: JavaIntFunction;

  /** @java PlaceCustomStack.stateFn */
  protected readonly stateFn: JavaIntFunction;

  /** @java PlaceCustomStack.rotationFn */
  protected readonly rotationFn: JavaIntFunction;

  /** @java PlaceCustomStack.valueFn */
  private readonly valueFn: JavaIntFunction;

  /** @java PlaceCustomStack.type */
  private type: string | null;

  /**
   * @param item      The item to place.
   * @param items     The name of the items on the stack to place.
   * @param container The name of the container.
   * @param type      The graph element type.
   * @param loc       The location to place a piece.
   * @param coord     The coordinate of the location to place a piece.
   * @param count     The number of the same piece to place [1].
   * @param state     The local state value of the piece to place [Off].
   * @param rotation  The rotation value of the piece to place [Off].
   * @param value     The piece value to place [Undefined].
   *
   * @java PlaceCustomStack(String, String[], String, SiteType, IntFunction, String, IntFunction, IntFunction, IntFunction, IntFunction)
   */
  public constructor(
    item: string | null,
    items: string[] | null,
    container: string | null,
    type: string | null,
    loc: JavaIntFunction | null,
    coord: string | null,
    count: JavaIntFunction | null,
    state: JavaIntFunction | null,
    rotation: JavaIntFunction | null,
    value: JavaIntFunction | null,
  ) {
    // Java: this.items = (items == null) ? new String[] {item} : items;
    this.items = items !== null ? items : (item !== null ? [item] : []);
    this.container = container ?? null;
    this.siteId = loc ?? null;
    this.coord = coord ?? null;
    this.countFn = count ?? intConstant(1);
    this.stateFn = state ?? intConstant(OFF);
    this.rotationFn = rotation ?? intConstant(OFF);
    this.valueFn = value ?? intConstant(OFF);
    this.type = type ?? null;
  }

  //-------------------------------------------------------------------------

  /**
   * @java PlaceCustomStack.eval(Context)
   */
  public eval(context: Context): void {
    const count = this.countFn.eval(context);
    const state = this.stateFn.eval(context);
    const rotation = this.rotationFn.eval(context);
    const value = this.valueFn.eval(context);

    const game = context.game as unknown as {
      getComponent(name: string): { index(): number; isDie?(): boolean; roll?(ctx: Context): number } | null;
      mapContainer(): Map<string, { index(): number; numSites(): number }>;
      equipment(): { sitesFrom(): number[] };
      state(): { containerStates(): { what(site: number, type: string | null): number }[] };
    };

    if (this.items.length > 1) {
      // Java: for (final String it : items)
      for (const it of this.items) {
        const component = game.getComponent(it);
        if (component === null) {
          throw new Error(`In the starting rules (place) the component ${it} is not defined.`);
        }
        const what = component.index();

        if (this.container !== null) {
          const c = game.mapContainer().get(this.container);
          if (c === undefined) continue;
          const siteFrom = ((game.equipment().sitesFrom()[c.index()] as number | undefined) ?? 0);
          if (this.siteId !== null) {
            this.placePieces(context, this.siteId.eval(context) + siteFrom, what, count, state, rotation, value, true);
          } else {
            for (let pos = siteFrom; pos < siteFrom + c.numSites(); pos++) {
              this.placePieces(context, pos, what, count, state, rotation, value, true);
            }
          }
        } else {
          let site = UNDEFINED;
          if (this.coord !== null) {
            const element = (context as unknown as {
              board(): { topology(): { getElement?(coord: string, type: string | null): { index(): number } | null } }
            }).board().topology().getElement?.(this.coord, this.type);
            if (element === null || element === undefined) {
              throw new Error(`In the starting rules (place) the Coordinates ${this.coord} not found.`);
            }
            site = element.index();
          } else {
            site = this.siteId!.eval(context);
          }

          for (let i = 0; i < count; i++) {
            this.placePieces(context, site, what, count, state, rotation, value, true);
          }
        }
      }
    } else {
      // Java: single item path
      const item = this.items[0];
      if (item === undefined) return;
      const component = game.getComponent(item);
      if (component === null) {
        throw new Error(`In the starting rules (place) the component ${item} is not defined.`);
      }

      const what = component.index();

      if (this.container !== null) {
        const c = game.mapContainer().get(this.container);
        if (c === undefined) return;
        const siteFrom = ((game.equipment().sitesFrom()[c.index()] as number | undefined) ?? 0);

        // Java: if (component.isDie())
        if (component.isDie?.()) {
          const containerStates = (context as unknown as { state(): { containerStates(): { what(site: number, type: string | null): number }[] } }).state().containerStates();
          for (let pos = siteFrom; pos < siteFrom + c.numSites(); pos++) {
            const csEntry = containerStates[c.index()];
            if (csEntry !== undefined && csEntry.what(pos, this.type) === 0) {
              this.placePieces(context, pos, what, count, state, rotation, value, true);
              const newState = component.roll?.(context) ?? 0;
              // Java: ActionUpdateDice actionChangeState = new ActionUpdateDice(pos, newState);
              // actionChangeState.apply(context, true); context.trial().addMove(new Move(actionChangeState)); context.trial().addInitPlacement();
              const actionUpdateDice = (context as unknown as {
                createActionUpdateDice?(pos: number, newState: number): unknown;
              }).createActionUpdateDice?.(pos, newState);
              if (actionUpdateDice) {
                (actionUpdateDice as { apply?(ctx: Context, init: boolean): void }).apply?.(context, true);
                (context.trial as unknown as { addMove?(m: unknown): void }).addMove?.({ action: actionUpdateDice });
                (context.trial as unknown as { addInitPlacement?(): void }).addInitPlacement?.();
              }
              break;
            }
          }
        } else if (this.siteId !== null) {
          this.placePieces(context, this.siteId.eval(context) + siteFrom, what, count, state, rotation, value, true);
        } else {
          for (let pos = siteFrom; pos < siteFrom + c.numSites(); pos++) {
            this.placePieces(context, pos, what, count, state, rotation, value, true);
          }
        }
      } else {
        let site = UNDEFINED;
        if (this.coord !== null) {
          const element = (context as unknown as {
            board(): { topology(): { getElement?(coord: string, type: string | null): { index(): number } | null } }
          }).board().topology().getElement?.(this.coord, this.type);
          if (element === null || element === undefined) {
            throw new Error(`In the starting rules (place) the Coordinates ${this.coord} not found.`);
          }
          site = element.index();
        } else {
          site = this.siteId!.eval(context);
        }

        for (let i = 0; i < count; i++) {
          this.placePieces(context, site, what, count, state, rotation, value, true);
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

  /** @java PlaceCustomStack.posn() */
  public posn(): JavaIntFunction | null {
    return this.siteId;
  }

  /** @java PlaceCustomStack.container() */
  public containerName(): string | null {
    return this.container;
  }

  //-------------------------------------------------------------------------

  /** @java PlaceCustomStack.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java PlaceCustomStack.preprocess(Game) */
  public preprocess(game: unknown): void {
    // Java: type = SiteType.use(type, game)
    if (this.type === null && (game as unknown as { defaultSiteType?(): string }).defaultSiteType) {
      (this as unknown as { type: string }).type = (game as unknown as { defaultSiteType(): string }).defaultSiteType();
    }

    this.siteId?.preprocess?.(game);

    this.countFn.preprocess?.(game);
    this.rotationFn.preprocess?.(game);
    this.stateFn.preprocess?.(game);
    this.valueFn.preprocess?.(game);
  }

  /** @java PlaceCustomStack.missingRequirement(Game) */
  public missingRequirement(_game: unknown): boolean {
    return false;
  }

  /** @java PlaceCustomStack.willCrash(Game) */
  public willCrash(_game: unknown): boolean {
    return false;
  }

  /** @java PlaceCustomStack.writesEvalContextRecursive() */
  public writesEvalContextRecursive(): Set<number> {
    const result = new Set<number>();
    if (this.siteId !== null) {
      for (const v of this.siteId.writesEvalContextRecursive?.() ?? []) result.add(v);
    }
    for (const v of this.countFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.rotationFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.stateFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.valueFn.writesEvalContextRecursive?.() ?? []) result.add(v);
    return result;
  }

  /** @java PlaceCustomStack.readsEvalContextRecursive() */
  public readsEvalContextRecursive(): Set<number> {
    const result = new Set<number>();
    if (this.siteId !== null) {
      for (const v of this.siteId.readsEvalContextRecursive?.() ?? []) result.add(v);
    }
    for (const v of this.countFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.rotationFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.stateFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    for (const v of this.valueFn.readsEvalContextRecursive?.() ?? []) result.add(v);
    return result;
  }

  /** @java PlaceCustomStack.toString() */
  public toString(): string {
    return "";
  }

  /** @java PlaceCustomStack.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    const typeName = (this.type ?? "cell").toLowerCase();
    const loc = this.siteId !== null
      ? this.siteId.toEnglish?.(game) ?? String(this.siteId)
      : (this.coord ?? "?");
    return `place stack of ${JSON.stringify(this.items)} at ${typeName} ${loc}`;
  }
}
