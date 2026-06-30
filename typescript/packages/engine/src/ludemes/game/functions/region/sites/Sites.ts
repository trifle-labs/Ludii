// @java Core/src/game/functions/region/sites/Sites.java

/**
 * Returns the specified set of sites.
 *
 * @java game/functions/region/sites/Sites.java
 * @author Eric.Piette
 *
 * This is a pure factory/dispatcher class. Its own eval() returns null and is
 * never called; all real logic lives in the concrete sub-classes it constructs.
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch, RegionFunction, IntFunction, BooleanFunction, IntArrayFunction } from "../../../../base.js";
import { BaseRegionFunction } from "../BaseRegionFunction.js";

// ---- Sub-class imports (ported classes) ------------------------------------
import { SitesContext } from "./context/SitesContext.js";
import { SitesFrom } from "./moves/SitesFrom.js";
import { SitesTo } from "./moves/SitesTo.js";
import { SitesBetween as SitesBetweenMoves } from "./moves/SitesBetween.js";
import { SitesCoords } from "./coords/SitesCoords.js";
import { SitesCrossing } from "./crossing/SitesCrossing.js";
import { SitesCustom } from "./custom/SitesCustom.js";
import { SitesGroup } from "./group/SitesGroup.js";
import { SitesHiddenCount } from "./hidden/SitesHiddenCount.js";
import { SitesHiddenRotation } from "./hidden/SitesHiddenRotation.js";
import { SitesHiddenState } from "./hidden/SitesHiddenState.js";
import { SitesHiddenValue } from "./hidden/SitesHiddenValue.js";
import { SitesHiddenWhat } from "./hidden/SitesHiddenWhat.js";
import { SitesHiddenWho } from "./hidden/SitesHiddenWho.js";
import { SitesIncident } from "./incidents/SitesIncident.js";
import { SitesLineOfSight } from "./lineOfSight/SitesLineOfSight.js";
import { SitesStart } from "./piece/SitesStart.js";
import { perimeterVertexRings, cornersFromPerimeterTyped } from "./simple/corner-sites.js";
import { SitesOccupied } from "./occupied/SitesOccupied.js";
import { SitesEquipmentRegion } from "./player/SitesEquipmentRegion.js";
import { SitesHand } from "./player/SitesHand.js";
import { SitesRandom } from "./random/SitesRandom.js";
import { SitesBottom } from "./simple/SitesBottom.js";
import { SitesCentre } from "./simple/SitesCentre.js";
import { SitesPlayable } from "./simple/SitesPlayable.js";
import { SitesConcaveCorners } from "./simple/SitesConcaveCorners.js";
import { SitesConvexCorners } from "./simple/SitesConvexCorners.js";
import { SitesHint } from "./simple/SitesHint.js";
import { SitesLeft } from "./simple/SitesLeft.js";
import { SitesPerimeter } from "./simple/SitesPerimeter.js";
import { SitesOuter } from "./simple/SitesOuter.js";
import { SitesRight } from "./simple/SitesRight.js";
import { SitesTop } from "./simple/SitesTop.js";
import { SitesTrack } from "./track/SitesTrack.js";
import { LineOfSightType } from "./LineOfSightType.js";

// ---- Type imports (enum discriminators) ------------------------------------
import type { SitesAroundType } from "./SitesAroundType.js";
import type { SitesBetweenType } from "./SitesBetweenType.js";
import type { SitesCrossingType } from "./SitesCrossingType.js";
import type { SitesDirectionType } from "./SitesDirectionType.js";
import type { SitesDistanceType } from "./SitesDistanceType.js";
import type { SitesEdgeType } from "./SitesEdgeType.js";
import type { SitesGroupType } from "./SitesGroupType.js";
import type { SitesHiddenType } from "./SitesHiddenType.js";
import type { SitesIncidentType } from "./SitesIncidentType.js";
import type { SitesIndexType } from "./SitesIndexType.js";
import type { SitesOccupiedType } from "./SitesOccupiedType.js";
import type { SitesPlayerType } from "./SitesPlayerType.js";
import type { SitesPieceType } from "./SitesPieceType.js";
import type { SitesSimpleType } from "./SitesSimpleType.js";
import { resolveRelativeDir } from "../../../util/directions/RelativeDirection.js";

/** Internal type alias for topology accessor shape. */
type TopologyLike = {
  top(type: string): Array<{ index(): number }>;
  bottom(type: string): Array<{ index(): number }>;
  left(type: string): Array<{ index(): number }>;
  right(type: string): Array<{ index(): number }>;
  inner(type: string): Array<{ index(): number }>;
  outer(type: string): Array<{ index(): number }>;
  major(type: string): Array<{ index(): number }>;
  minor(type: string): Array<{ index(): number }>;
  perimeter(type: string): Array<{ index(): number }>;
  centre(type: string): Array<{ index(): number }>;
  axial(type: string): Array<{ index(): number }>;
  horizontal(type: string): Array<{ index(): number }>;
  vertical(type: string): Array<{ index(): number }>;
  angled(type: string): Array<{ index(): number }>;
  slash(type: string): Array<{ index(): number }>;
  slosh(type: string): Array<{ index(): number }>;
  rows(type: string): Array<Array<{ index(): number }>>;
  columns(type: string): Array<Array<{ index(): number }>>;
  phases(type: string): Array<Array<{ index(): number }>>;
  layers(type: string): Array<Array<{ index(): number }>>;
};

/** A constant IntFunction wrapping a fixed value. */
function constIntFn(val: number): IntFunction {
  return { eval(_ctx: Context & EvalScratch) { return val; } };
}

/**
 * Returns the specified set of sites. This class acts as a pure factory/dispatcher.
 *
 * @java game.functions.region.sites.Sites
 */
export class Sites extends BaseRegionFunction {
  /**
   * Private constructor — Java class has no public ctor.
   * @java Sites()
   */
  private constructor() {
    super();
  }

  /**
   * @java Sites.eval(Context) — always returns null (never called directly).
   */
  public override eval(_ctx: Context & EvalScratch): number[] {
    return [];
  }

  // ---- Factory methods mirroring Java static construct() overloads -----------

  /**
   * For getting the sites iterated in ForEach Moves.
   * @java Sites.construct() → SitesContext
   * @example (sites)
   */
  public static constructContext(...args: unknown[]): RegionFunction {
    // @java Sites.construct() — the zero-arg overload. Arity-relaxed construct
    // dispatch also offers it surplus args; only the truly argument-free call
    // is this clause ((sites Pending) had fallen through to SitesContext and
    // the Damas huff's (remove (sites Pending)) removed nothing).
    if (args.some((a) => a !== null && a !== undefined)) return null as unknown as RegionFunction;
    return new SitesContext();
  }

  /**
   * For getting sites without any parameter or only the graph element type.
   * @java Sites.construct(SitesSimpleType, SiteType) → various simple classes
   * @example (sites Top)
   * @example (sites Playable)
   */
  public static constructSimple(
    regionType: SitesSimpleType,
    elementType: string | null = null,
  ): RegionFunction {
    // @java switch(regionType) { case Top: return new SitesTop(elementType); ... }
    const rt = regionType as unknown as string;

    // Helper: get topology and call a named method
    const makeTopologyFn = (methodName: keyof TopologyLike, type: string | null): RegionFunction =>
      new (class extends BaseRegionFunction {
        private readonly _type: string | null;
        constructor(t: string | null) { super(); this._type = t; }
        override eval(ctx: Context & EvalScratch): number[] {
          const realType = this._type ??
            ((ctx as unknown as { board?(): { defaultSite(): string } }).board?.()?.defaultSite() ?? "Cell");
          const topology = (ctx as unknown as { topology?(): TopologyLike }).topology?.();
          if (topology) {
            const method = topology[methodName] as ((t: string) => Array<{ index(): number }>) | undefined;
            if (typeof method === "function") return method.call(topology, realType).map((e) => e.index());
          }
          return [];
        }
        override isStatic(): boolean { return true; }
      })(type);

    switch (rt) {
      case "Board":
        // @java SitesBoard — all board sites
        return new (class extends BaseRegionFunction {
          override eval(ctx: Context & EvalScratch): number[] {
            const board = (ctx.game as unknown as {
              equipment?: {
                board?: {
                  numSites?: number;
                  graphFunction?: { _dim?: Array<{ eval?: (ctx: Context & EvalScratch) => number; a?: number }> };
                };
              };
            }).equipment?.board;
            const storageN = (board?.numSites !== undefined && board.numSites > 0) ? board.numSites : ctx.state.cells.length;
            const dims = board?.graphFunction?._dim ?? null;
            const baseN = dims !== null && dims.length > 0
              ? dims.reduce((acc, dim) => acc * (dim.eval?.(ctx) ?? dim.a ?? 0), 1)
              : 0;
            const n = baseN > 0 && baseN < storageN ? baseN : storageN;
            return Array.from({ length: n }, (_, i) => i);
          }
          override isStatic(): boolean { return true; }
        })();
      case "Bottom":
        return new SitesBottom(elementType);
      case "Corners":
        // @java SitesCorners — the board's convex-turn corner sites. The shared
        // boardCorners() helper is the single source of truth (also used by
        // IsConnected's Corners / SidesNoCorners static region types).
        return new (class extends BaseRegionFunction {
          override eval(ctx: Context & EvalScratch): number[] { return boardCorners(ctx); }
          override isStatic(): boolean { return true; }
        })();
      case "ConcaveCorners":
        return new SitesConcaveCorners(elementType);
      case "ConvexCorners":
        return new SitesConvexCorners(elementType);
      case "Hint":
        return new SitesHint();
      case "Inner":
        return makeTopologyFn("inner", elementType);
      case "Left":
        return new SitesLeft(elementType);
      case "LineOfPlay":
        // @java SitesLineOfPlay — not yet ported
        return new (class extends BaseRegionFunction {
          override eval(_ctx: Context & EvalScratch): number[] { return []; }
        })();
      case "Major":
        return makeTopologyFn("major", elementType);
      case "Minor":
        return makeTopologyFn("minor", elementType);
      case "Outer":
        return new SitesOuter(elementType);
      case "Perimeter":
        // @java Sites.java:582-583 — case Perimeter: return new SitesPerimeter(elementType);
        return new SitesPerimeter() as unknown as RegionFunction;
      case "Right":
        return new SitesRight(elementType);
      case "ToClear":
        // @java SitesToClear — context.state().sitesToRemove()
        return new (class extends BaseRegionFunction {
          override eval(ctx: Context & EvalScratch): number[] {
            const str = (ctx.state as unknown as { sitesToRemove?: readonly number[] }).sitesToRemove;
            return str ? [...str] : [];
          }
        })();
      case "Top":
        return new SitesTop(elementType);
      case "Pending":
        // @java SitesPending — context.state().pendingValues(); the engine
        // State keeps the set as the `pending` property.
        return new (class extends BaseRegionFunction {
          override eval(ctx: Context & EvalScratch): number[] {
            const st = ctx.state as unknown as { pendingSites?(): number[]; pending?: ReadonlySet<number> };
            if (typeof st.pendingSites === "function") return st.pendingSites();
            return st.pending ? [...st.pending].filter((s) => s >= 0) : [];
          }
        })();
      case "Playable":
        // @java SitesPlayable — the faithful class (boardless playable =
        // empty + adjacent to a placed piece; normal board = all empties).
        return new SitesPlayable(elementType);
      case "LastTo":
        return new (class extends BaseRegionFunction {
          override eval(ctx: Context & EvalScratch): number[] {
            const to = ctx._evalTo ?? -1;
            return to >= 0 ? [to] : [];
          }
        })();
      case "LastFrom":
        return new (class extends BaseRegionFunction {
          override eval(ctx: Context & EvalScratch): number[] {
            const from = ctx._evalFrom ?? -1;
            return from >= 0 ? [from] : [];
          }
        })();
      case "Centre":
        return new SitesCentre(elementType);
      case "Perimeter":
        return makeTopologyFn("perimeter", elementType);
      default:
        throw new Error(`Sites(): A SitesSimpleType is not implemented: ${regionType}`);
    }
  }

  /**
   * For getting sites according to their coordinates.
   * @java Sites.construct(SiteType, String[]) → SitesCoords
   * @example (sites {"A1" "B1"})
   */
  public static constructCoords(
    elementType: string | null,
    coords: string[],
  ): RegionFunction | null {
    // @java Sites.construct(SiteType, String[]) — Java overload resolution only
    // reaches this clause when the args ARE a SiteType + coordinate strings. The
    // dispatcher tries statics in order, so reject non-matching shapes (idents
    // like SitesMoveType "From" with a Moves arg) by returning null.
    if (elementType !== null && !["Cell", "Edge", "Vertex"].includes(elementType)) {
      if (typeof elementType !== "string" || !/^[A-Za-z]+\d+$/.test(elementType)) return null;
    }
    if (!Array.isArray(coords) && typeof coords !== "string") return null;
    const list = Array.isArray(coords) ? coords : [coords];
    if (!list.every((c) => typeof c === "string")) return null;
    // @java return new SitesCoords(elementType, coords);
    return new SitesCoords(elementType, coords);
  }

  /**
   * For creating a region from a list of site indices or an IntArrayFunction.
   * @java Sites.construct(IntFunction[], IntArrayFunction) → SitesCustom
   * @example (sites {1..10})
   */
  public static constructCustom(
    sites: IntFunction[] | null,
    array: IntArrayFunction | null,
  ): RegionFunction | null {
    // @java Sites.construct(IntFunction[], IntArrayFunction) — type-gate the clause
    // (the dispatcher is order-driven; without this, (sites From <moves>) lands here).
    if (sites !== null && !Array.isArray(sites)) return null;
    if (sites === null && (array === null || typeof (array as { eval?: unknown }).eval !== "function")) return null;
    // @java if (sites != null) return new SitesCustom(sites); else return new SitesCustom(array);
    if (sites !== null && sites.length > 0) {
      // Wrap array of IntFunctions as a single IntArrayFunction
      const wrappedArray: IntArrayFunction = {
        eval(ctx: Context & EvalScratch): number[] {
          return sites.map((f) => f.eval(ctx));
        }
      };
      return new SitesCustom(wrappedArray);
    } else {
      return new SitesCustom(array as IntArrayFunction);
    }
  }

  /**
   * For getting sites belonging to a part of the board (row, column, phase, etc.).
   * @java Sites.construct(SitesIndexType, SiteType, IntFunction) → various index classes
   * @example (sites Row 1)
   */
  public static constructIndex(
    regionType: SitesIndexType,
    elementType: string | null,
    index: IntFunction | null,
  ): RegionFunction {
    // @java switch(regionType) { case Row: return new SitesRow(...); ... }
    const rt = regionType as unknown as string;

    const makeNestedTopologyFn = (methodName: string): RegionFunction =>
      new (class extends BaseRegionFunction {
        private readonly _type: string | null;
        private readonly _idx: IntFunction | null;
        constructor(t: string | null, i: IntFunction | null) { super(); this._type = t; this._idx = i; }
        override eval(ctx: Context & EvalScratch): number[] {
          const realType = this._type ??
            ((ctx as unknown as { board?(): { defaultSite(): string } }).board?.()?.defaultSite() ?? "Cell");
          const topology = (ctx as unknown as { topology?(): TopologyLike }).topology?.();
          if (!topology) return [];
          const method = (topology as unknown as Record<string, (t: string) => Array<Array<{ index(): number }>>>)[methodName];
          if (typeof method !== "function") return [];
          const idxVal = this._idx !== null ? this._idx.eval(ctx) : 0;
          const lists = method.call(topology, realType);
          if (idxVal < 0 || idxVal >= lists.length) return [];
          return lists[idxVal]!.map((e) => e.index());
        }
        override isStatic(): boolean { return false; }
      })(elementType, index);

    switch (rt) {
      case "Cell":
        // @java SitesCell — vertices that make up a cell
        return new (class extends BaseRegionFunction {
          private readonly _type: string | null;
          private readonly _idx: IntFunction | null;
          constructor(t: string | null, i: IntFunction | null) { super(); this._type = t; this._idx = i; }
          override eval(ctx: Context & EvalScratch): number[] {
            const topology = (ctx as unknown as { topology?(): TopologyLike }).topology?.();
            if (!topology) return [];
            // cells() returns all cells; if index given, return the Nth
            const idxVal = this._idx !== null ? this._idx.eval(ctx) : -1;
            if (idxVal >= 0) {
              const cell = (topology as unknown as { cells(): Array<{ index(): number; vertices: Array<{ index(): number }> }> }).cells()[idxVal];
              if (!cell) return [];
              return cell.vertices.map((v) => v.index());
            }
            return (topology as unknown as { cells(): Array<{ index(): number }> }).cells().map((c) => c.index());
          }
          override isStatic(): boolean { return true; }
        })(elementType, index);
      case "Column":
        return makeNestedTopologyFn("columns");
      case "Layer":
        return makeNestedTopologyFn("layers");
      case "Edge":
        // @java SitesEdge — end points of an edge at given index
        return new (class extends BaseRegionFunction {
          private readonly _idx: IntFunction | null;
          constructor(i: IntFunction | null) { super(); this._idx = i; }
          override eval(ctx: Context & EvalScratch): number[] {
            const topology = (ctx as unknown as { topology?(): TopologyLike }).topology?.();
            if (!topology) return [];
            const idxVal = this._idx !== null ? this._idx.eval(ctx) : -1;
            const edges = (topology as unknown as { edges(): Array<{ index(): number; va: { index(): number }; vb: { index(): number } }> }).edges();
            if (idxVal >= 0 && idxVal < edges.length) {
              const edge = edges[idxVal]!;
              return [edge.va.index(), edge.vb.index()];
            }
            return edges.map((e) => e.index());
          }
          override isStatic(): boolean { return true; }
        })(index);
      case "Phase":
        return makeNestedTopologyFn("phases");
      case "Row":
        return makeNestedTopologyFn("rows");
      case "State": {
        // @java SitesState(elementType, index) — sites with a specific state value
        const idxFn = index;
        return new (class extends BaseRegionFunction {
          override eval(ctx: Context & EvalScratch): number[] {
            const val = idxFn !== null ? idxFn.eval(ctx) : 0;
            const state = ctx.state;
            const n = state.cells.length;
            const result: number[] = [];
            // @java SitesState — site local state == val. state.stateValue(i)
            // is the accessor; `stateAt` is the raw array field (not callable),
            // so the old stateAt?.(i) threw `stateAt is not a function`,
            // aborting (count Sites in:(sites State N)) — Reversi's per-move
            // score-setting then never ran and byScore saw 0/0.
            const sv = (state as unknown as { stateValue?(i: number): number; stateAt?: readonly number[] });
            for (let i = 0; i < n; i++) {
              const s = typeof sv.stateValue === "function"
                ? sv.stateValue(i)
                : (Array.isArray(sv.stateAt) ? (sv.stateAt[i] ?? 0) : 0);
              if (s === val) result.push(i);
            }
            return result;
          }
          override isStatic(): boolean { return false; }
        })();
      }
      case "Empty": {
        // @java SitesEmpty.construct(elementType, index)
        return new (class extends BaseRegionFunction {
          override eval(ctx: Context & EvalScratch): number[] {
            const state = ctx.state;
            const n = state.cells.length;
            const result: number[] = [];
            for (let i = 0; i < n; i++) {
              if (state.isEmptySite(i)) result.push(i);
            }
            return result;
          }
          override isStatic(): boolean { return false; }
        })();
      }
      case "Support":
        // @java SitesSupport — not yet ported
        return new (class extends BaseRegionFunction {
          override eval(_ctx: Context & EvalScratch): number[] { return []; }
        })();
      default:
        throw new Error(`Sites(): A SitesIndexType is not implemented: ${regionType}`);
    }
  }

  /**
   * For getting sites incident to another.
   * @java Sites.construct(SitesIncidentType, SiteType, SiteType, IntFunction, Player, RoleType) → SitesIncident
   * @example (sites Incident Edge of:Vertex at:(last To))
   */
  public static constructIncident(
    regionType: SitesIncidentType,
    resultType: string,
    of: string,
    at: IntFunction,
    owner: IntFunction | null,
    _roleOwner: unknown,
  ): RegionFunction {
    const rt = regionType as unknown as string;
    switch (rt) {
      case "Incident":
        // @java SitesIncident(resultType, of, at, owner, roleOwner)
        // TS SitesIncident constructor: (resultType, ofType, indexFn, ownerFn)
        return new SitesIncident(resultType, of, at, owner);
      default:
        throw new Error(`Sites(): A SitesIncidentType is not implemented: ${regionType}`);
    }
  }

  /**
   * For getting sites occupied by player(s).
   * @java Sites.construct(SitesOccupiedType, ...) → SitesOccupied
   * @example (sites Occupied by:Mover)
   */
  public static constructOccupied(
    regionType: SitesOccupiedType,
    by: unknown,
    By: unknown,
    _container: IntFunction | null,
    _Container: string | null,
    component: IntFunction | null,
    _Component: string | null,
    _components: string[] | null,
    top: boolean | null,
    on: string | null,
  ): RegionFunction {
    const rt = regionType as unknown as string;
    switch (rt) {
      case "Occupied": {
        // @java return new SitesOccupied(by, By, container, Container, component, Component, components, top, on);
        const byFn = by !== null ? resolveIntFn(by) : null;
        const roleVal = (By !== null ? (By as string) : null) as unknown as null;
        // @java container:"Hand" + components:{names} restrict the scan
        return new SitesOccupied(
          byFn,
          roleVal,
          null,
          null,
          component,
          _Component,
          null,
          top,
          on,
          _Container,
          (_components && _components.length > 0 ? _components : (_Component !== null ? [_Component] : null)),
        );
      }
      default:
        throw new Error(`Sites(): A SitesOccupiedType is not implemented: ${regionType}`);
    }
  }

  /**
   * For getting sites relative to a player (hand, winning).
   * @java Sites.construct(SitesPlayerType, SiteType, Player, RoleType, NonDecision, String) → SitesHand/SitesWinning
   * @example (sites Hand Mover)
   */
  public static constructPlayer(
    regionType: SitesPlayerType,
    _elementType: string | null,
    pid: unknown,
    role: unknown,
    _moves: unknown,
    _name: string | null,
  ): RegionFunction {
    const rt = regionType as unknown as string;
    switch (rt) {
      case "Hand":
        // @java return new SitesHand(pid, role);
        // TS SitesHand constructor: (index: IntFunction | null, role: RoleType | null)
        return new SitesHand(
          pid !== null ? resolveIntFn(pid) : null,
          role as string | null,
        );
      case "Winning":
        // @java SitesWinning — not yet ported in non-1to1 path
        return new (class extends BaseRegionFunction {
          override eval(_ctx: Context & EvalScratch): number[] { return []; }
        })();
      default:
        throw new Error(`Sites(): A SitesPlayerType is not implemented: ${regionType}`);
    }
  }

  /**
   * For getting sites of a region defined in the equipment or of a single coordinate.
   * @java Sites.construct(Player, RoleType, SiteType, String) → SitesEquipmentRegion/SitesCoords
   * @example (sites P1)
   * @example (sites "E5")
   */
  public static constructEquipmentOrCoord(
    player: unknown,
    role: unknown,
    siteType: string | null,
    name: string | null,
  ): RegionFunction {
    // @java if (StringRoutines.isCoordinate(name)) return new SitesCoords(siteType, new String[]{name});
    if (name !== null && isCoordinate(name)) {
      return new SitesCoords(siteType, [name]);
    }
    // @java return new SitesEquipmentRegion(player, role, name);
    // TS SitesEquipmentRegion constructor: (index: IntFunction | null, name: string)
    const indexFn = player !== null ? resolveIntFn(player) :
      role !== null ? resolveRoleIntFn(role as string) : null;
    return new SitesEquipmentRegion(indexFn, name ?? "");
  }

  /**
   * For getting sites around another.
   * @java Sites.construct(SitesAroundType, ...) → SitesAround
   */
  public static constructAround(
    regionType: SitesAroundType,
    typeLoc: string | null,
    where: IntFunction | null,
    regionWhere: RegionFunction | null,
    type: unknown,
    distance: IntFunction | null,
    directions: unknown,
    condition: BooleanFunction | null,
    includeSelf: BooleanFunction | null,
  ): RegionFunction {
    const rt = regionType as unknown as string;
    switch (rt) {
      case "Around":
        // @java return new SitesAround(typeLoc, where, regionWhere, type, distance, directions, If, includeSelf);
        return new (class extends BaseRegionFunction {
          override eval(ctx: Context & EvalScratch): number[] {
            const sourceSites = where !== null
              ? [where.eval(ctx)]
              : regionWhere !== null
                ? regionWhere.eval(ctx)
                : [];
            if (process.env.TRACE_AROUND) { const rw = regionWhere as unknown as { role?: unknown; top?: unknown; componentNames?: unknown; component?: { constructor?: { name?: string } }; who?: { eval(c: unknown): number } }; console.error("[around] where:", where?.constructor?.name ?? null, "regionWhere:", regionWhere?.constructor?.name ?? null, "cfg:", JSON.stringify({ role: rw?.role, top: rw?.top, names: rw?.componentNames, comp: rw?.component?.constructor?.name, who: rw?.who ? rw.who.eval(ctx) : null }), "sources:", JSON.stringify(sourceSites).slice(0,80)); }
            const dist = Math.max(1, distance?.eval(ctx) ?? 1);
            const dirNames = directionNames(directions, ctx);
            const dynType = typeof type === "string" ? type.toLowerCase() : null;
            // includeSelf:True arrives as a raw boolean (Atomic Chess explosion)
            const include = typeof (includeSelf as unknown) === "boolean"
              ? (includeSelf as unknown as boolean)
              : includeSelf?.eval(ctx) ?? false;
            const seen = new Set<number>();
            const out: number[] = [];

            const add = (site: number): void => {
              if (site < 0 || seen.has(site)) return;
              seen.add(site);
              out.push(site);
            };

            for (const s of sourceSites) {
              if (s < 0) continue;
              if (include) add(s);
              for (const n of aroundSites(ctx, s, dist, dirNames, typeLoc)) add(n);
            }

            const filtered = dynType === null ? out : out.filter((site) => dynamicRegionAccepts(ctx, site, dynType));
            if (condition === null) return filtered;

            const oldTo = ctx._evalTo;
            const conditioned: number[] = [];
            for (const site of filtered) {
              ctx._evalTo = site;
              if (condition.eval(ctx)) conditioned.push(site);
            }
            ctx._evalTo = oldTo;
            return conditioned;
          }
        })();
      default:
        throw new Error(`Sites(): A SitesAroundType is not implemented: ${regionType}`);
    }
  }

  /**
   * For getting the sites (in the same radial) between two others sites.
   * @java Sites.construct(SitesBetweenType, ...) → SitesBetween
   */
  public static constructBetween(
    regionType: SitesBetweenType,
    _directions: unknown,
    _type: string | null,
    _from: IntFunction,
    _fromIncluded: BooleanFunction | null,
    _to: IntFunction,
    _toIncluded: BooleanFunction | null,
    _cond: BooleanFunction | null,
  ): RegionFunction {
    const rt = regionType as unknown as string;
    switch (rt) {
      case "Between": {
        // @java SitesBetween.java:91-169 — find the radial from `from`
        // containing `to`; collect sites strictly between (walking back from
        // to-1 to 1), plus from/to when their included flags hold; the
        // between condition (default true) filters with (between) bound.
        const fromFn = _from;
        const toFn = _to;
        const directions = _directions;
        const fromIncludedFn = _fromIncluded;
        const toIncludedFn = _toIncluded;
        const condFn = _cond;
        const asBool2 = (f: BooleanFunction | null, ctx: Context & EvalScratch, dflt: boolean): boolean => {
          if (f === null || f === undefined) return dflt;
          if (typeof (f as unknown) === "boolean") return f as unknown as boolean;
          return f.eval(ctx);
        };
        return new (class extends BaseRegionFunction {
          override eval(ctx: Context & EvalScratch): number[] {
            const from = fromFn.eval(ctx);
            if (from < 0) return [];
            const to = toFn.eval(ctx);
            if (to < 0) return [];
            const traj = (ctx as unknown as { _trajectories?: { radialsByName(site: number, dir: string): number[][] } })._trajectories;
            if (!traj) return [];
            const origFrom = ctx._evalFrom;
            const origTo = ctx._evalTo;
            const origBetween = (ctx as { _evalBetween?: number })._evalBetween;
            ctx._evalFrom = from;
            ctx._evalTo = to;
            const sites: number[] = [];
            if (asBool2(fromIncludedFn, ctx, false)) sites.push(from);
            if (asBool2(toIncludedFn, ctx, false)) sites.push(to);
            const dirNames = directionNames(directions ?? null, ctx);
            let toFound = false;
            for (const dn of dirNames) {
              for (const ray of traj.radialsByName(from, dn)) {
                for (let toIdx = 1; toIdx < ray.length; toIdx++) {
                  if (ray[toIdx] === to) {
                    for (let b = toIdx - 1; b >= 1; b--) {
                      const between = ray[b]!;
                      (ctx as { _evalBetween?: number })._evalBetween = between;
                      if (asBool2(condFn, ctx, true)) sites.push(between);
                    }
                    toFound = true;
                    break;
                  }
                }
                if (toFound) break;
              }
              if (toFound) break;
            }
            ctx._evalFrom = origFrom;
            ctx._evalTo = origTo;
            (ctx as { _evalBetween?: number })._evalBetween = origBetween;
            return sites;
          }
        })();
      }
      default:
        throw new Error(`Sites(): A SitesBetweenType is not implemented: ${regionType}`);
    }
  }

  /**
   * For getting sites crossing another site.
   * @java Sites.construct(SitesCrossingType, IntFunction, Player, RoleType) → SitesCrossing
   * @example (sites Crossing at:(last To) All)
   */
  public static constructCrossing(
    regionType: SitesCrossingType,
    at: IntFunction,
    who: unknown,
    role: unknown,
  ): RegionFunction {
    const rt = regionType as unknown as string;
    switch (rt) {
      case "Crossing": {
        // @java return new SitesCrossing(at, who, role);
        // TS SitesCrossing constructor: (startLocationFn: IntFunction, roleFunc: IntFunction)
        const roleFn = who !== null ? resolveIntFn(who) :
          role !== null ? resolveRoleIntFn(role as string) : constIntFn(-1);
        return new SitesCrossing(at, roleFn);
      }
      default:
        throw new Error(`Sites(): A SitesCrossingType is not implemented: ${regionType}`);
    }
  }

  /**
   * For getting sites of a group.
   * @java Sites.construct(SitesGroupType, ...) → SitesGroup
   * @example (sites Group Vertex at:(site))
   */
  public static constructGroup(
    regionType: SitesGroupType,
    _type: string | null,
    at: IntFunction | null,
    From: RegionFunction | null,
    _directions: unknown,
    condition: BooleanFunction | null,
    isVisible: BooleanFunction | null,
  ): RegionFunction {
    const rt = regionType as unknown as string;
    switch (rt) {
      case "Group": {
        // @java return new SitesGroup(type, at, From, directions, If, isVisible);
        // TS SitesGroup constructor: (startLocationFn: IntArrayFunction, condition, directionName, isVisibleFn)
        // Build a start-location IntArrayFunction from at or From
        const startFn: IntArrayFunction = at !== null
          ? { eval(ctx: Context & EvalScratch): number[] { return [at.eval(ctx)]; } }
          : From !== null
            ? { eval(ctx: Context & EvalScratch): number[] { return From.eval(ctx); } }
            : { eval(_ctx: Context & EvalScratch): number[] { return []; } };
        // Direction token may arrive RAW as a bare-enum string (e.g. Orthogonal)
        // or as a {name} object; coerce both (see Count.constructGroups).
        const dirName: string =
          typeof _directions === "string"
            ? _directions
            : (_directions as { name?: string } | null)?.name ?? "Adjacent";
        return new SitesGroup(startFn, condition, dirName, isVisible);
      }
      default:
        throw new Error(`Sites(): A SitesGroupType is not implemented: ${regionType}`);
    }
  }

  /**
   * For getting sites relative to edges.
   * @java Sites.construct(SitesEdgeType) → SitesAxial/SitesHorizontal/etc.
   * @example (sites Axial)
   */
  public static constructEdge(regionType: SitesEdgeType): RegionFunction {
    const rt = regionType as unknown as string;
    // @java switch(regionType) { case Axial: return new SitesAxial(); ... }
    // Use topology escape-hatch via method name.
    const makeEdgeSites = (methodName: string): RegionFunction =>
      new (class extends BaseRegionFunction {
        override eval(ctx: Context & EvalScratch): number[] {
          const topology = (ctx as unknown as { topology?(): TopologyLike }).topology?.();
          if (topology) {
            const method = (topology as unknown as Record<string, (t: string) => Array<{ index(): number }>>)[methodName];
            if (typeof method === "function") {
              return method.call(topology, "Edge").map((e) => e.index());
            }
          }
          return [];
        }
        override isStatic(): boolean { return true; }
      })();

    switch (rt) {
      case "Axial":      return makeEdgeSites("axial");
      case "Horizontal": return makeEdgeSites("horizontal");
      case "Vertical":   return makeEdgeSites("vertical");
      case "Angled":     return makeEdgeSites("angled");
      case "Slash":      return makeEdgeSites("slash");
      case "Slosh":      return makeEdgeSites("slosh");
      default:
        throw new Error(`Sites(): A SitesEdgeType is not implemented: ${regionType}`);
    }
  }

  /**
   * For getting sites with specific hidden information for a player.
   * @java Sites.construct(SitesHiddenType, HiddenData, SiteType, Player, RoleType) → SitesHidden*
   * @example (sites Hidden to:Mover)
   */
  public static constructHidden(
    regionType: SitesHiddenType,
    dataType: string | null,
    type: string | null,
    toPlayer: unknown,
    toRole: unknown,
  ): RegionFunction {
    const rt = regionType as unknown as string;
    if (rt !== "Hidden") {
      throw new Error(`Sites(): A SitesHiddenType is not implemented: ${regionType}`);
    }
    // @java whoFn — combine toPlayer/toRole into a player-index function
    const whoFn: IntFunction = toPlayer !== null
      ? resolveIntFn(toPlayer)
      : toRole !== null
        ? resolveRoleIntFn(toRole as string)
        : constIntFn(-1);
    if (dataType === null) {
      // @java return new SitesHidden(type, to, To);
      return new SitesHiddenWhat(
        type,
        (toRole == null ? toPlayer : null) as ConstructorParameters<typeof SitesHiddenWhat>[1],
        toRole == null ? null : toRole as string,
      );
    }
    switch (dataType) {
      case "What":     return new SitesHiddenWhat(
        type,
        (toRole == null ? toPlayer : null) as ConstructorParameters<typeof SitesHiddenWhat>[1],
        toRole == null ? null : toRole as string,
      );
      case "Who":      return new SitesHiddenWho(type, toRole == null ? whoFn : null, toRole == null ? null : toRole as string);
      case "Count":    return new SitesHiddenCount(type, whoFn);
      case "State":    return new SitesHiddenState(type, toRole == null ? whoFn : null, toRole == null ? null : toRole as string);
      case "Rotation": return new SitesHiddenRotation(type, toRole == null ? whoFn : null, toRole == null ? null : toRole as string);
      case "Value":    return new SitesHiddenValue(type, toRole == null ? whoFn : null, toRole == null ? null : toRole as string);
      default:
        throw new Error(`Sites(): A HiddenData is not implemented: ${dataType}`);
    }
  }

  /**
   * For getting sites in a direction from another.
   * @java Sites.construct(SitesDirectionType, ...) → SitesDirection
   */
  public static constructDirection(
    regionType: SitesDirectionType,
    _from: IntFunction | null,
    _From: RegionFunction | null,
    _directions: unknown,
    _included: BooleanFunction | null,
    _stop: BooleanFunction | null,
    _stopIncluded: BooleanFunction | null,
    _distance: IntFunction | null,
    _type: string | null,
  ): RegionFunction {
    const rt = regionType as unknown as string;
    switch (rt) {
      case "Direction": {
        // @java SitesDirection.java:106-156 — for each origin, walk each
        // resolved direction's radials up to `distance` steps; stopRule
        // (default false) halts the ray (stopIncluded adds the halt site);
        // included (default false) adds the origin itself.
        const fromFn = _from;
        const fromRegion = _From;
        const directions = _directions;
        const includedFn = _included;
        const stopFn = _stop;
        const stopIncludedFn = _stopIncluded;
        const distanceFn = _distance;
        const asBool = (f: BooleanFunction | null, ctx: Context & EvalScratch, dflt: boolean): boolean => {
          if (f === null || f === undefined) return dflt;
          if (typeof (f as unknown) === "boolean") return f as unknown as boolean;
          return f.eval(ctx);
        };
        return new (class extends BaseRegionFunction {
          override eval(ctx: Context & EvalScratch): number[] {
            const origins: number[] = fromRegion !== null
              ? fromRegion.eval(ctx)
              : [fromFn !== null ? fromFn.eval(ctx) : (ctx._evalFrom ?? -1)];
            const distance = distanceFn !== null
              ? (typeof (distanceFn as unknown) === "number" ? distanceFn as unknown as number : distanceFn.eval(ctx))
              : Number.MAX_SAFE_INTEGER;
            const traj = (ctx as unknown as { _trajectories?: { radialsByName(site: number, dir: string): number[][] } })._trajectories;
            if (!traj) return [];
            const dirNames = directionNames(directions ?? null, ctx);
            const out: number[] = [];
            const seen = new Set<number>();
            const add = (site2: number): void => { if (!seen.has(site2)) { seen.add(site2); out.push(site2); } };
            const oldTo = ctx._evalTo;
            for (const loc of origins) {
              if (loc < 0) continue;
              if (asBool(includedFn, ctx, false)) add(loc);
              for (const dn of dirNames) {
                for (const ray of traj.radialsByName(loc, dn)) {
                  // ray[0] is the origin; walk 1..distance inclusive.
                  const limit = Math.min(ray.length, distance + 1);
                  for (let toIdx = 1; toIdx < limit; toIdx++) {
                    const to = ray[toIdx]!;
                    ctx._evalTo = to;
                    if (asBool(stopFn, ctx, false)) {
                      if (asBool(stopIncludedFn, ctx, false)) add(to);
                      break;
                    }
                    add(to);
                  }
                }
              }
            }
            ctx._evalTo = oldTo;
            return out;
          }
        })();
      }
      default:
        throw new Error(`Sites(): A SitesDirectionType is not implemented: ${regionType}`);
    }
  }

  /**
   * For getting sites at a specific distance from another.
   * @java Sites.construct(SitesDistanceType, ...) → SitesDistance
   */
  public static constructDistance(
    regionType: SitesDistanceType,
    _elementType: string | null,
    _relation: unknown,
    _stepMove: unknown,
    _newRotation: IntFunction | null,
    _from: IntFunction,
    _distance: unknown,
  ): RegionFunction {
    const rt = regionType as unknown as string;
    switch (rt) {
      case "Distance": {
        // @java SitesDistance.java:95-133 (stepMove == null path) — BFS
        // distances over the relation adjacency from `from`; collect sites
        // whose distance lies in [min, max] of the distance Range (a plain
        // IntFunction distance means min == max). The stepMove variant
        // (custom walk) is not ported yet and yields [].
        const relName = typeof _relation === "string" ? _relation : "Adjacent";
        const fromFn = _from;
        const distanceArg = _distance as
          | { min?: (c: unknown) => number; max?: (c: unknown) => number; eval?: (c: unknown) => number }
          | number
          | null;
        const stepMove = _stepMove;
        return new (class extends BaseRegionFunction {
          // @java SitesDistance.stepMove(context, realType, from, goRule,
          // component, facingDirection, rotation) — resolve the step's
          // directions from the walk site, take one relation step per
          // direction, keep targets passing goRule (the step's to-condition)
          // with (to) bound.
          private stepNeighbours(ctx: Context & EvalScratch, site: number): number[] {
            const sm = stepMove as unknown as {
              dirnChoice?: { eval(c: Context): string[] };
              rule?: { eval(c: Context): boolean } | null;
            };
            const traj = (ctx as unknown as { _trajectories?: { steps(s: number, d: string): number[] } })._trajectories;
            if (!traj || !sm.dirnChoice) return [];
            const origFrom = ctx._evalFrom;
            const origTo = ctx._evalTo;
            ctx._evalFrom = site;
            const mover = ctx.state.mover;
            const playerDirs = (ctx.game as unknown as { _playerDirs?: Map<number, number> })._playerDirs;
            const topo = (ctx as unknown as { topology?: () => { supportedDirections?: (rel: string, t: string) => Array<{ toAbsolute?: () => string } | string> } }).topology?.();
            const playType = (ctx as unknown as { board?: () => { defaultSite?: () => string } }).board?.()?.defaultSite?.() ?? "Cell";
            const rawSupported = topo?.supportedDirections?.("Adjacent", playType);
            const supported = rawSupported && rawSupported.length > 0
              ? rawSupported.map((d) => (d == null ? "" : typeof d === "string" ? d : d.toAbsolute?.() ?? "")).filter((n) => n.length > 0)
              : undefined;
            const out: number[] = [];
            const seen = new Set<number>();
            for (const dirName of sm.dirnChoice.eval(ctx)) {
              const rel = resolveRelativeDir(dirName, mover, playerDirs, undefined, supported);
              const names = Array.isArray(rel) ? rel : [rel ?? dirName];
              for (const d of names) {
                for (const to of traj.steps(site, d)) {
                  if (seen.has(to)) continue;
                  ctx._evalTo = to;
                  if (sm.rule == null || sm.rule.eval(ctx)) {
                    seen.add(to);
                    out.push(to);
                  }
                }
              }
            }
            ctx._evalFrom = origFrom;
            ctx._evalTo = origTo;
            return out;
          }

          override eval(ctx: Context & EvalScratch): number[] {
            const from = fromFn.eval(ctx);
            if (from < 0) return [];
            let minD: number;
            let maxD: number;
            if (typeof distanceArg === "number") {
              minD = maxD = distanceArg;
            } else if (distanceArg && typeof distanceArg.min === "function" && typeof distanceArg.max === "function") {
              minD = distanceArg.min(ctx);
              maxD = distanceArg.max(ctx);
            } else if (distanceArg && typeof distanceArg.eval === "function") {
              minD = maxD = distanceArg.eval(ctx);
            } else {
              return [];
            }
            if (minD < 0) return [];
            if (stepMove != null) {
              // @java SitesDistance.java:140-215 — BFS over the custom step
              // move: frontier expands by stepNeighbours; sites at depth in
              // [minD, maxD] are returned (Seesaw's "EmptyInRange" walks
              // (step Forwards (to if:empty)) up to (var) steps).
              const sitesToReturn: number[] = [];
              const checked = new Set<number>([from]);
              let curr = this.stepNeighbours(ctx, from).filter((t) => !checked.has(t));
              for (const t of curr) checked.add(t);
              let numSteps = 1;
              if (numSteps >= minD) for (const t of curr) if (!sitesToReturn.includes(t)) sitesToReturn.push(t);
              while (curr.length > 0 && numSteps < maxD) {
                const nextList: number[] = [];
                for (const site of curr) {
                  for (const to of this.stepNeighbours(ctx, site)) {
                    if (!checked.has(to) && !nextList.includes(to)) nextList.push(to);
                  }
                }
                for (const t of curr) checked.add(t);
                curr = nextList;
                for (const t of nextList) checked.add(t);
                numSteps += 1;
                if (numSteps >= minD) for (const t of nextList) if (!sitesToReturn.includes(t)) sitesToReturn.push(t);
              }
              return sitesToReturn;
            }
            const traj = (ctx as unknown as { _trajectories?: { steps(site: number, dir: string): number[] } })._trajectories;
            if (!traj) return [];
            // BFS over the relation steps (@java element.sitesAtDistance()
            // is the same BFS precomputed).
            const dist = new Map<number, number>([[from, 0]]);
            let frontier = [from];
            const out: number[] = [];
            for (let d = 1; d <= maxD && frontier.length > 0; d++) {
              const next: number[] = [];
              for (const s2 of frontier) {
                for (const n of traj.steps(s2, relName)) {
                  if (!dist.has(n)) {
                    dist.set(n, d);
                    next.push(n);
                    if (d >= minD) out.push(n);
                  }
                }
              }
              frontier = next;
            }
            if (minD === 0) out.unshift(from);
            return out;
          }
        })();
      }
      default:
        throw new Error(`Sites(): A SitesDistanceType is not implemented: ${regionType}`);
    }
  }

  /**
   * For getting sites in the line of sight.
   * @java Sites.construct(SitesLineOfSightType, ...) → SitesLineOfSight
   */
  public static constructLineOfSight(
    regionType: unknown,
    typeLoS: LineOfSightType | null,
    typeLoc: string | null,
    at: IntFunction | null,
    directions: unknown,
  ): RegionFunction {
    // @java overload resolution — the LineOfSight discriminant selects this clause
    if ((regionType as string) !== "LineOfSight") return null as unknown as RegionFunction;
    // @java return new SitesLineOfSight(typeLoS, typeLoc, at, directions);
    // TS SitesLineOfSight constructor: (typeLoS, typeLoc, loc: IntFunction, directionName: string)
    const dirName = typeof directions === "string"
      ? directions
      : (directions as { name?: string } | null)?.name ?? "Adjacent";
    const locFn: IntFunction = at !== null ? at : constIntFn(-1);
    return new SitesLineOfSight(typeLoS, typeLoc, locFn, dirName);
  }

  /**
   * For getting a random site in a region.
   * @java Sites.construct(SitesRandomType, RegionFunction, IntFunction) → SitesRandom
   * @example (sites Random)
   */
  public static constructRandom(
    regionType: unknown,
    region: RegionFunction | null,
    num: IntFunction | null,
  ): RegionFunction {
    // @java overload resolution — the Random discriminant selects this clause
    if ((regionType as string) !== "Random") return null as unknown as RegionFunction;
    // @java return new SitesRandom(region, num);
    // TS SitesRandom constructor: (region: RegionFunction, numSitesFn: IntFunction)
    const regionFn: RegionFunction = region !== null ? region : new (class extends BaseRegionFunction {
      override eval(_ctx: Context & EvalScratch): number[] { return []; }
    })();
    const numFn: IntFunction = num !== null ? num : constIntFn(1);
    return new SitesRandom(regionFn, numFn);
  }

  /**
   * For getting sites based on from/to/between positions of moves.
   * @java Sites.construct(SitesMoveType, Moves) → SitesFrom/SitesTo/SitesBetween(moves)
   */
  public static constructMoves(
    moveType: string,
    moves: unknown,
  ): RegionFunction {
    // @java Sites.java — case From: new SitesFrom(moves); To: SitesTo; Between: SitesBetween
    const m = moves as ConstructorParameters<typeof SitesFrom>[0];
    switch (moveType) {
      case "From": return new SitesFrom(m);
      case "To": return new SitesTo(m as ConstructorParameters<typeof SitesTo>[0]);
      case "Between": return new SitesBetweenMoves(m as ConstructorParameters<typeof SitesBetweenMoves>[0]);
      default:
        throw new Error(`Sites(): SitesMoveType not implemented: ${moveType}`);
    }
  }

  /**
   * For getting sites relative to a track.
   * @java Sites.construct(SitesTrackType, ...) → SitesTrack
   */
  public static constructTrack(
    regionType: unknown,
    pid: unknown,
    role: unknown,
    name: string | null,
    from: IntFunction | null,
    to: IntFunction | null,
  ): RegionFunction {
    // @java overload resolution — the Track discriminant selects this clause
    if ((regionType as string) !== "Track") return null as unknown as RegionFunction;
    // @java return new SitesTrack(pid, role, name, from, to);
    return new SitesTrack(
      pid as ConstructorParameters<typeof SitesTrack>[0],
      role as ConstructorParameters<typeof SitesTrack>[1],
      name,
      from,
      to,
    );
  }

  /**
   * For getting sites in a loop or making the loop.
   * @java Sites.construct(SitesLoopType, ...) → SitesLoop
   */
  public static constructLoop(
    regionType: unknown,
    _inside: BooleanFunction | null,
    _type: string | null,
    _surround: unknown,
    _surroundList: unknown,
    _directions: unknown,
    _colour: IntFunction | null,
    _start: IntFunction | null,
    _regionStart: RegionFunction | null,
  ): RegionFunction {
    // @java overload resolution — the Loop discriminant selects this clause
    if ((regionType as string) !== "Loop") return null as unknown as RegionFunction;
    // @java return new SitesLoop(inside, type, surround, surroundList, directions, colour, start, regionStart);
    // SitesLoop is stubbed
    return new (class extends BaseRegionFunction {
      override eval(_ctx: Context & EvalScratch): number[] { return []; }
    })();
  }

  /**
   * For getting sites in a pattern.
   * @java Sites.construct(SitesPatternType, ...) → SitesPattern
   */
  public static constructPattern(
    regionType: unknown,
    _walk: unknown,
    _type: string | null,
    _from: IntFunction | null,
    _what: IntFunction | null,
    _whats: IntFunction[] | null,
  ): RegionFunction {
    // @java overload resolution — the Pattern discriminant selects this clause
    if ((regionType as string) !== "Pattern") return null as unknown as RegionFunction;
    // @java return new SitesPattern(walk, type, from, what, whats);
    return new (class extends BaseRegionFunction {
      override eval(_ctx: Context & EvalScratch): number[] { return []; }
    })();
  }

  /**
   * For getting sites occupied by a large piece from its root.
   * @java Sites.construct(SitesLargePieceType, SiteType, IntFunction) → SitesLargePiece
   */
  public static constructLargePiece(
    regionType: unknown,
    _type: string | null,
    _at: IntFunction,
  ): RegionFunction {
    // @java overload resolution — the LargePiece discriminant selects this clause
    if ((regionType as string) !== "LargePiece") return null as unknown as RegionFunction;
    // @java return new SitesLargePiece(type, at);
    return new (class extends BaseRegionFunction {
      override eval(_ctx: Context & EvalScratch): number[] { return []; }
    })();
  }

  /**
   * For getting sites relative to a piece (start positions).
   * @java Sites.construct(SitesPieceType, Piece) → SitesStart
   */
  public static constructPiece(
    regionType: SitesPieceType,
    pid: unknown,
  ): RegionFunction {
    // @java overload resolution — the SitesPieceType discriminant selects this clause
    if ((regionType as unknown as string) !== "Start") return null as unknown as RegionFunction;
    // @java return new SitesStart(pid); — pid is a Piece wrapper; SitesStart
    // reads indexFn = piece.component() (the component-index IntFunction).
    const p = pid as { component?: () => IntFunction; what?: IntFunction; eval?: (c: unknown) => number } | null;
    const indexFn: IntFunction | null = p === null ? null
      : typeof p.component === "function" ? p.component()
      : p.what ?? (typeof p.eval === "function" ? (p as IntFunction) : null);
    return new SitesStart(indexFn);
  }

  /**
   * For getting sites relative to sides of the board.
   * @java Sites.construct(SitesSideType, SiteType, Player, RoleType, CompassDirection) → SitesSide
   */
  public static constructSide(
    regionType: unknown,
    _elementType: string | null,
    _player: unknown,
    _role: unknown,
    direction: unknown,
  ): RegionFunction {
    // @java overload resolution — the Side discriminant selects this clause
    if ((regionType as string) !== "Side") return null as unknown as RegionFunction;
    // @java return new SitesSide(elementType, player, role, direction);
    // SitesSide.eval reads topology.sides(type).get(direction) — the side
    // buckets computed by MeasureGraph.measureSides: the perimeter is split
    // into runs between corners, each run classified by the discrete
    // direction (16 buckets) of its centroid from the board centroid.
    const dirName = typeof direction === "string"
      ? direction
      : (direction as { uniqueName?: () => string } | null)?.uniqueName?.() ?? null;
    return new (class extends BaseRegionFunction {
      override eval(ctx: Context & EvalScratch): number[] {
        if (dirName === null) return [];
        return boardSides(ctx, dirName.toUpperCase());
      }
    })();
  }

  /**
   * For getting sites of a walk.
   * @java Sites.construct(SiteType, IntFunction, StepType[][], BooleanFunction) → SitesWalk
   */
  public static constructWalk(
    _elementType: string | null,
    index: IntFunction | null,
    possibleSteps: unknown,
    rotations: BooleanFunction | null,
  ): RegionFunction {
    // @java return new SitesWalk(elementType, index, possibleSteps, rotations);
    // SitesWalk.eval — turtle walks from the site: for each start direction
    // (all orthogonals when rotations [True], else just the first) and each
    // StepType[] walk, F steps along the current facing, R/L rotate to the
    // next supported orthogonal; a step off the board kills that walk; the
    // landing site of every surviving walk is in the region (KnightWalk:
    // {{F F R F} {F F L F}} from each of N/E/S/W = the 8 knight targets).
    const walks: readonly (readonly string[])[] = Array.isArray(possibleSteps)
      ? (possibleSteps as unknown[][]).map((w) => (Array.isArray(w) ? w.map(String) : [String(w)]))
      : [];
    const rotFn = typeof (rotations as unknown) === "boolean"
      ? { eval: () => rotations as unknown as boolean }
      : (rotations ?? { eval: () => true });
    return new (class extends BaseRegionFunction {
      override eval(ctx: Context & EvalScratch): number[] {
        const from = index !== null ? index.eval(ctx) : ((ctx as { _evalFrom?: number })._evalFrom ?? -1);
        if (from === null || from < 0) return [];
        const ORTHO = ["N", "E", "S", "W"] as const;
        const traj = (ctx as unknown as { _trajectories?: { step(site: number, dir: string): number } | null })._trajectories;
        const board = (ctx.game as unknown as { equipment?: { board?: { width: number; height: number } } }).equipment?.board;
        const W = board?.width ?? 0;
        const H = board?.height ?? 0;
        const stepTo = (site: number, dir: string): number => {
          if (traj && typeof traj.step === "function") return traj.step(site, dir);
          const col = site % W;
          const row = Math.floor(site / W);
          switch (dir) {
            case "E": return col + 1 < W ? site + 1 : -1;
            case "W": return col - 1 >= 0 ? site - 1 : -1;
            case "N": return row + 1 < H ? site + W : -1;
            case "S": return row - 1 >= 0 ? site - W : -1;
            default: return -1;
          }
        };
        // @java allRotations ? all orthogonals : just the first
        const allRotations = rotFn.eval(ctx as never);
        const startDirs = allRotations ? [0, 1, 2, 3] : [0];
        const out: number[] = [];
        for (const start of startDirs) {
          for (const steps of walks) {
            let cur: number = from;
            let dirIdx = start;
            for (const st of steps) {
              if (st === "F") {
                cur = stepTo(cur, ORTHO[dirIdx]!);
                // @java no correct walk with that state
                if (cur < 0) break;
              } else if (st === "R") {
                dirIdx = (dirIdx + 1) % ORTHO.length;
              } else if (st === "L") {
                dirIdx = (dirIdx + ORTHO.length - 1) % ORTHO.length;
              }
            }
            // @java if (currentLoc != UNDEFINED) sitesAfterWalk.add(currentLoc)
            if (cur >= 0) out.push(cur);
          }
        }
        return out;
      }
    })();
  }
}

// ---- Helpers ----------------------------------------------------------------

/**
 * The sites on the named board side.
 * @java Core/src/game/util/graph/MeasureGraph.java — measureSides/findSides/
 * sideFromRun: walk the perimeter cyclically; each run between consecutive
 * corners is one side; classify it by discreteDirection(centroid, runAvg, 16)
 * (E=0, N=4, W=8, S=12; 1-3 NE, 5-7 NW, 9-11 SW, 13-15 SE); every element of
 * the run (corners included — a corner belongs to BOTH adjacent sides) gets
 * the property. Side membership is computed on the play-site graph.
 */

/**
 * @java MeasureGraph.findSides/sideFromRun — normalize each ring CCW, find
 * corners, walk corner-to-corner runs, classify each run by the discrete
 * 16-bucket direction of its centroid from the ring centroid, and return the
 * element ids of every run matching dirName (run ends inclusive).
 */
function classifySideRuns(
  rings: readonly (readonly (readonly [number, number, number])[])[],
  dirName: string,
  maxId: number,
): number[] {
  const out = new Set<number>();
  for (const rawRing of rings) {
    if (rawRing.length === 0) continue;
    const ring = rawRing.map((e) => [e[0], e[1], e[2]] as [number, number, number]);
    {
      let area = 0;
      for (let i = 0; i < ring.length; i++) {
        const [ax, ay] = ring[i]!;
        const [bx, by] = ring[(i + 1) % ring.length]!;
        area += ax * by - bx * ay;
      }
      if (area < 0) ring.reverse();
    }
    let cx = 0; let cy = 0;
    for (const [x, y] of ring) { cx += x; cy += y; }
    cx /= ring.length; cy /= ring.length;
    const poly: [number, number][] = ring.map(([x, y]) => [x, y]);
    const { convexIdx, concaveIdx } = cornersFromPerimeterTyped(poly);
    const cornerIdx = new Set<number>([...convexIdx, ...concaveIdx]);
    if (cornerIdx.size === 0) continue;
    const discrete = (angle: number): number => {
      const arc = (2 * Math.PI) / 16;
      const off = arc / 2;
      let a = angle;
      while (a < 0) a += 2 * Math.PI;
      while (a > 2 * Math.PI) a -= 2 * Math.PI;
      return (Math.floor((a + off) / arc) + 16) % 16;
    };
    const sideOf = (dirn: number): string =>
      dirn === 0 ? "E" : dirn === 4 ? "N" : dirn === 8 ? "W" : dirn === 12 ? "S"
        : dirn < 4 ? "NE" : dirn < 8 ? "NW" : dirn < 12 ? "SW" : "SE";
    const num = ring.length;
    for (const from of cornerIdx) {
      let to = from;
      do { to = (to + 1) % num; } while (!cornerIdx.has(to) && to !== from);
      const runLength = (to - from + num) % num;
      let avgX = ring[from]![0];
      let avgY = ring[from]![1];
      for (let r = 0; r < runLength; r++) {
        const e = ring[(from + 1 + r) % num]!;
        avgX += e[0]; avgY += e[1];
      }
      avgX /= runLength + 1; avgY /= runLength + 1;
      const dirn = discrete(Math.atan2(avgY - cy, avgX - cx));
      if (sideOf(dirn) !== dirName) continue;
      for (let r = 0; r <= runLength; r++) {
        const id = ring[(from + r) % num]![2];
        if (id >= 0 && id < maxId) out.add(id);
      }
    }
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * The board's corner sites (perimeter sites at genuine convex turns).
 * @java MeasureGraph.measureCorners — the convex hull of site centroids gives
 * them on any geometry: a square board's hull has 4 non-collinear turns, a
 * hexhex board's has 6, rotation-invariant. Shared by `(sites Corners)` and by
 * IsConnected's `Corners` / `SidesNoCorners` static region types.
 */
export function boardCorners(ctx: Context): number[] {
  const traj = (ctx as unknown as { _trajectories?: { els?: ArrayLike<{ pt: { x: number; y: number } }> } })._trajectories;
  const els = traj?.els;
  if (els && els.length > 0) {
    const pts: { i: number; x: number; y: number }[] = [];
    for (let i = 0; i < els.length; i += 1) {
      const pt = els[i]!.pt;
      pts.push({ i, x: pt.x, y: pt.y });
    }
    pts.sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
      (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const half = (list: typeof pts): typeof pts => {
      const out: typeof pts = [];
      for (const pt2 of list) {
        while (out.length >= 2 && cross(out[out.length - 2]!, out[out.length - 1]!, pt2) <= 1e-9) out.pop();
        out.push(pt2);
      }
      return out;
    };
    const lower = half(pts);
    const upper = half([...pts].reverse());
    const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)];
    if (hull.length >= 3) return hull.map((h) => h.i).sort((a, b) => a - b);
  }
  const g = ctx.game as unknown as {
    equipment?: { board?: { width?: number; height?: number; numSites?: number } }
  };
  const W = g.equipment?.board?.width ?? 0;
  const H = g.equipment?.board?.height ?? 0;
  if (W === 0 || H === 0) return [];
  const n = g.equipment?.board?.numSites ?? (W * H);
  return [0, W - 1, n - W, n - 1].filter((v, i, a) => a.indexOf(v) === i);
}

export function boardSides(ctx: Context, dirName: string): number[] {
  const traj = (ctx as unknown as { _trajectories?: unknown })._trajectories
    ?? (ctx.game as unknown as { equipment?: { board?: { trajectories?: unknown } } }).equipment?.board?.trajectories;
  const t = traj as {
    xOf(site: number): number; yOf(site: number): number;
    numSites: number;
  } | null | undefined;
  if (!t || typeof (t as { xOf?: unknown }).xOf !== "function") {
    // Rectangle fallback: N=top row, S=bottom row, E=right col, W=left col.
    const board = (ctx.game as unknown as { equipment?: { board?: { width: number; height: number } } }).equipment?.board;
    if (!board) return [];
    const { width: W, height: H } = board;
    const out: number[] = [];
    for (let s2 = 0; s2 < W * H; s2++) {
      const col = s2 % W;
      const row = Math.floor(s2 / W);
      if ((dirName === "N" && row === H - 1) || (dirName === "S" && row === 0)
        || (dirName === "E" && col === W - 1) || (dirName === "W" && col === 0)) out.push(s2);
    }
    return out;
  }

  // @java MeasureGraph.measureSides — sides are computed PER ELEMENT TYPE on
  // that type's own perimeter ring: corners split the ring into runs, each
  // run is classified by the discrete direction (16 buckets) of its centroid
  // from the graph centroid, and every element of the INCLUSIVE run is on
  // that side (corners belong to both adjacent runs). For CELL play the ring
  // is the perimeter CELL ring — vertex-inheritance over-included cells that
  // merely touch a side vertex (HexDame: cell 1 landed in SE, promoting a
  // mid-board man; Java SE = {0,5,11,18,26}).
  const trajForCells = t as unknown as {
    kind?: string;
    playType?: unknown;
    core?: { topo?: { faceEls?: Array<{ id: number; vertices: Array<{ id: number }> }> } };
  };
  const playKind = trajForCells.kind ?? String(trajForCells.playType);
  if (playKind === "Cell") {
    const faceEls = trajForCells.core?.topo?.faceEls;
    const vertexRings = perimeterVertexRings(t as never);
    if (faceEls && vertexRings && vertexRings.length > 0) {
      // Perimeter cells: faces touching the outer vertex ring; walk them
      // cyclically by ring-adjacency (shared perimeter vertex order).
      const ringIds = vertexRings[0]!.map((v) => v[2]);
      const ringPos = new Map<number, number>();
      ringIds.forEach((id, i) => ringPos.set(id, i));
      // Order perimeter cells by the FIRST ring position among their vertices.
      const perimCells: Array<{ id: number; pos: number; x: number; y: number }> = [];
      for (const f of faceEls) {
        let best = Infinity;
        for (const v of f.vertices) {
          const pp = ringPos.get(v.id);
          if (pp !== undefined && pp < best) best = pp;
        }
        if (best !== Infinity) {
          perimCells.push({ id: f.id, pos: best, x: t.xOf(f.id), y: t.yOf(f.id) });
        }
      }
      if (perimCells.length >= 3) {
        // Order the cells CYCLICALLY around the board centroid — the
        // first-ring-vertex sort splits an edge across the ring's wrap
        // point (HexDame's east edge came out ...2,0,1,5..., shifting the
        // corner from cell 0 to cell 1). Angle sort is a true perimeter
        // order for convex boards (hexhex, squares); Java walks adjacency.
        let ccx = 0; let ccy = 0;
        for (const c of perimCells) { ccx += c.x; ccy += c.y; }
        ccx /= perimCells.length; ccy /= perimCells.length;
        perimCells.sort((a, b) =>
          Math.atan2(a.y - ccy, a.x - ccx) - Math.atan2(b.y - ccy, b.x - ccx));
        const ring: [number, number, number][] = perimCells.map((c) => [c.x, c.y, c.id]);
        return classifySideRuns([ring], dirName, t.numSites);
      }
    }
  }
  const rings = perimeterVertexRings(t as never);
  if (!rings || rings.length === 0) return [];

  // Graph centroid over the ring vertices.
  const sideVertexIds = new Set<number>();
  for (const rawRing of rings) {
    if (rawRing.length === 0) continue;
    // Normalize the ring to CCW winding BEFORE scoring — the corner detector
    // reverses its local copy when the area is negative and returns indices
    // into the REVERSED ring; walking runs against the original order
    // misplaced every corner (hex Diamond sides fragmented at the tips).
    const ring = [...rawRing];
    {
      let area = 0;
      for (let i = 0; i < ring.length; i++) {
        const [ax, ay] = ring[i]!;
        const [bx, by] = ring[(i + 1) % ring.length]!;
        area += ax * by - bx * ay;
      }
      if (area < 0) ring.reverse();
    }
    let cx = 0; let cy = 0;
    for (const [x, y] of ring) { cx += x; cy += y; }
    cx /= ring.length; cy /= ring.length;

    const poly: [number, number][] = ring.map(([x, y]) => [x, y]);
    const { convexIdx, concaveIdx } = cornersFromPerimeterTyped(poly);
    const cornerIdx = new Set<number>([...convexIdx, ...concaveIdx]);
    if (cornerIdx.size === 0) continue;

    // @java MeasureGraph.discreteDirection(angle, 16)
    const discrete = (angle: number): number => {
      const arc = (2 * Math.PI) / 16;
      const off = arc / 2;
      let a = angle;
      while (a < 0) a += 2 * Math.PI;
      while (a > 2 * Math.PI) a -= 2 * Math.PI;
      return (Math.floor((a + off) / arc) + 16) % 16;
    };
    const sideOf = (dirn: number): string =>
      dirn === 0 ? "E" : dirn === 4 ? "N" : dirn === 8 ? "W" : dirn === 12 ? "S"
        : dirn < 4 ? "NE" : dirn < 8 ? "NW" : dirn < 12 ? "SW" : "SE";

    const num = ring.length;
    for (const from of cornerIdx) {
      let to = from;
      do { to = (to + 1) % num; } while (!cornerIdx.has(to) && to !== from);
      const runLength = (to - from + num) % num;
      let avgX = ring[from]![0];
      let avgY = ring[from]![1];
      for (let r = 0; r < runLength; r++) {
        const e = ring[(from + 1 + r) % num]!;
        avgX += e[0]; avgY += e[1];
      }
      avgX /= runLength + 1; avgY /= runLength + 1;
      const dirn = discrete(Math.atan2(avgY - cy, avgX - cx));
      if (sideOf(dirn) !== dirName) continue;
      for (let r = 0; r <= runLength; r++) sideVertexIds.add(ring[(from + r) % num]![2]);
    }
  }
  if (sideVertexIds.size === 0) return [];

  const trajAny = t as unknown as {
    kind?: string;
    playType?: unknown;
    core?: { topo?: { faceEls?: Array<{ id: number; vertices: Array<{ id: number }> }> } };
  };
  // Vertex play: side sites are the vertices themselves.
  if ((trajAny.kind ?? String(trajAny.playType)) === "Vertex") {
    return [...sideVertexIds].filter((id) => id >= 0 && id < t.numSites).sort((a, b) => a - b);
  }
  // Cell play: faces inherit the sides of their vertices.
  const faceEls = trajAny.core?.topo?.faceEls;
  if (!faceEls) return [];
  const out: number[] = [];
  for (const f of faceEls) {
    if (f.vertices.some((v) => sideVertexIds.has(v.id))) out.push(f.id);
  }
  return out.sort((a, b) => a - b);
}


/**
 * Checks if a string looks like a board coordinate (e.g. "A1", "E5", "AA12").
 * @java main.StringRoutines.isCoordinate(String)
 *
 * Faithful port: a coordinate is at most three leading letters followed by
 * one-or-more trailing digits (the first two letters, if present, must match).
 * The previous lenient regex `^[A-Za-z]+\d+$` wrongly classified region names
 * like "SubGame0" as coordinates, so `(sites "SubGame0")` compiled to an empty
 * SitesCoords instead of the equipment region (Ultimate Tic-Tac-Toe).
 */
function isLetterChar(ch: string): boolean { return /\p{L}/u.test(ch); }
function isDigitChar(ch: string): boolean { return ch >= "0" && ch <= "9"; }
function isCoordinate(name: string | null | undefined): boolean {
  if (name === null || name === undefined) return false;
  const str = name;
  let c = str.length - 1;
  if (c < 0 || !isDigitChar(str.charAt(c))) return false; // last char must be a digit
  while (c >= 0 && isDigitChar(str.charAt(c))) c--;
  if (c < 0) return true; // string is all digits
  if (c > 2) return false; // coordinate has at most three leading letters
  if (c > 1 && str.length > 1 && str.charAt(0) !== str.charAt(1)) return false; // e.g. "AA1"
  while (c >= 0 && isLetterChar(str.charAt(c))) c--;
  return c < 0; // all letters followed by all digits
}

/**
 * Converts an arbitrary player-like value into an IntFunction.
 * @java RoleType.toIntFunction or Player.index()
 */
function resolveIntFn(player: unknown): IntFunction {
  const p = player as { index?(): unknown; eval?(ctx: unknown): number } | null;
  if (p === null || p === undefined) return constIntFn(-1);
  if (typeof p.eval === "function") return p as IntFunction;
  if (typeof p.index === "function") {
    // @java game.util.moves.Player.index() returns an IntFunction (NOT a raw
    // index), so (player (mover)) in a by:/who: slot must evaluate the returned
    // function — wrapping it directly made eval return the function object
    // ([object Object]), so by:(player (mover)) matched zero sites (Verge).
    const idx = p.index();
    if (typeof idx === "number") {
      return { eval(_ctx: Context & EvalScratch) { return idx; } };
    }
    if (idx !== null && typeof (idx as { eval?: unknown }).eval === "function") {
      return idx as IntFunction;
    }
    return { eval(_ctx: Context & EvalScratch) { return idx as unknown as number; } };
  }
  if (typeof p === "number") {
    const idx = p as unknown as number;
    return { eval(_ctx: Context & EvalScratch) { return idx; } };
  }
  return constIntFn(-1);
}

/**
 * Converts a RoleType string into an IntFunction resolving via context.
 * @java RoleType.toIntFunction(RoleType)
 */
function resolveRoleIntFn(role: string): IntFunction {
  // @java RoleType.Player — the player iterated by (forEach Player …); the
  // engine carries it in _evalPlayer (Bao Kiswahili's end
  // (forEach Player if:("NoPiecesInInner" Player) …) read owner -1, the
  // region came back empty and the vacuous all-Sites ended the game at ply 1).
  if (role === "Player") return { eval(ctx: Context & EvalScratch) { return (ctx as { _evalPlayer?: number })._evalPlayer ?? ctx.state.mover; } };
  if (role === "Mover") return { eval(ctx: Context & EvalScratch) { return ctx.state.mover; } };
  // @java State.next() — a maintained value ((mover % players) + 1 unless a
  // SetNextPlayer overrode it). Our state.next is a transient override channel
  // cleared to 0 after each advance; `0 ?? mover` returned PLAYER 0, so
  // (sites Next) was empty mid-chain and Bashni's PromoteIfReach fell into its
  // else-branch (ReplayIfCanMove) instead of promoting.
  if (role === "Next") return {
    eval(ctx: Context & EvalScratch) {
      const nx = (ctx.state as unknown as { next?: number }).next ?? 0;
      if (nx > 0) return nx;
      const np = (ctx.game as unknown as { numPlayers?: number }).numPlayers ?? 2;
      return (ctx.state.mover % np) + 1;
    }
  };
  if (role === "P1") return constIntFn(1);
  if (role === "P2") return constIntFn(2);
  if (role === "P3") return constIntFn(3);
  if (role === "P4") return constIntFn(4);
  return constIntFn(-1);
}

function directionNames(directions: unknown, ctx: Context & EvalScratch): string[] {
  // @java SitesAround.java:97 — (directions == null) ? AbsoluteDirection.Adjacent : directions.
  // Adjacent on square-board cells is 8-way; an Orthogonal default drops diagonal
  // neighbours (Gekitai's diagonal pushes).
  if (directions === null || directions === undefined) return ["Adjacent"];
  if (typeof directions === "string") return [directions];
  const fn = directions as { eval?: (ctx: Context & EvalScratch) => string[] };
  if (typeof fn.eval === "function") return fn.eval(ctx);
  return ["Adjacent"];
}

function aroundSites(ctx: Context & EvalScratch, site: number, distance: number, directions: readonly string[], typeLoc: string | null = null): number[] {
  const baseTraj = (ctx as unknown as {
    _trajectories?: {
      group(site: number, name: string): number[];
      steps(site: number, name: string): number[];
      ray(site: number, name: string): number[];
      viewOf?(kind: string): unknown;
    } | null;
  })._trajectories;
  // @java SitesAround with an explicit SiteType expands on THAT type's
  // adjacency ((sites Around Cell (from) Diagonal) on a Vertex-play board —
  // Guerrilla's COIN capture probe). Gate on a typed channel existing so
  // single-type games never re-route.
  const playT = (ctx as unknown as { board?: () => { defaultSite?: () => string } }).board?.()?.defaultSite?.() ?? null;
  const hasChannel = typeLoc !== null && (ctx.state as unknown as { typedSites?: ReadonlyMap<string, unknown> }).typedSites?.has?.(typeLoc) === true;
  const traj = typeLoc && playT && typeLoc !== playT && hasChannel && baseTraj?.viewOf
    ? (baseTraj.viewOf(typeLoc) as typeof baseTraj)
    : baseTraj;
  if (traj) {
    const out = new Set<number>();
    // @java SitesAround.java:97 — (directions == null) ? AbsoluteDirection.Adjacent
    // Adjacent on square-board CELLS is 8-way (orthogonal + diagonal); the previous
    // Orthogonal default dropped diagonal pushes (Gekitai ply-6 drift).
    for (const dir of directions.length > 0 ? directions : ["Adjacent"]) {
      // @java AbsoluteDirection.All vs Adjacent differ on VERTEX boards: there
      // Adjacent is the 4 orthogonals while All adds the diagonals. Mapping
      // "All" to the "Adjacent" group dropped those diagonal neighbours, so
      // (sites Around … All) on vertex boards missed pieces (Forge/Wong/
      // Garrisons). On square CELL boards group("All")==group("Adjacent")
      // (both 8-way), so cell games are unaffected.
      const oneStep = dir === "All"
        ? traj.group(site, "All")
        : dir === "Adjacent"
          ? traj.group(site, "Adjacent")
          : dir === "Orthogonal" || dir === "Diagonal" || dir === "OffDiagonal"
            ? traj.group(site, dir)
            : traj.steps(site, dir);
      if (distance === 1) {
        for (const n of oneStep) out.add(n);
      } else {
        for (const dirSite of oneStep) {
          const ray = traj.ray(site, directionBetween(ctx, site, dirSite) ?? dir);
          const n = ray[distance - 1];
          if (n !== undefined) out.add(n);
        }
      }
    }
    return [...out];
  }

  const board = (ctx.game as unknown as { equipment?: { board?: { width?: number; height?: number } } }).equipment?.board;
  const width = board?.width ?? 0;
  const height = board?.height ?? 0;
  if (width <= 0 || height <= 0) return [];

  const col = site % width;
  const row = Math.floor(site / width);
  const out: number[] = [];
  const seen = new Set<number>();
  const addDelta = (dc: number, dr: number): void => {
    const c = col + dc * distance;
    const r = row + dr * distance;
    if (c < 0 || c >= width || r < 0 || r >= height) return;
    const n = r * width + c;
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  };

  for (const dir of directions.length > 0 ? directions : ["Orthogonal"]) {
    for (const [dc, dr] of directionDeltas(dir)) addDelta(dc, dr);
  }
  return out;
}

function directionDeltas(direction: string): Array<[number, number]> {
  switch (direction.toLowerCase()) {
    case "all":
    case "adjacent":
      return [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
    case "orthogonal":
      return [[-1, 0], [1, 0], [0, -1], [0, 1]];
    case "diagonal":
      return [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    case "n":
    case "north":
      return [[0, 1]];
    case "s":
    case "south":
      return [[0, -1]];
    case "e":
    case "east":
      return [[1, 0]];
    case "w":
    case "west":
      return [[-1, 0]];
    case "ne":
    case "northeast":
      return [[1, 1]];
    case "nw":
    case "northwest":
      return [[-1, 1]];
    case "se":
    case "southeast":
      return [[1, -1]];
    case "sw":
    case "southwest":
      return [[-1, -1]];
    default:
      return [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  }
}

function dynamicRegionAccepts(ctx: Context & EvalScratch, site: number, type: string): boolean {
  const who = ctx.state.who(site);
  const mover = ctx.state.mover;
  // @java Empty/NotEmpty test OCCUPANCY, not ownership: a Neutral piece has
  // owner 0 but a non-zero component, so it is NOT empty. Testing `who` alone
  // miscounted neutral pieces as empty (Flume's outer Disc0 ring), throwing off
  // (count … (sites Around … NotEmpty …)) and its (moveAgain) turn structure.
  const what = (ctx.state as unknown as { what?(s: number): number }).what?.(site)
    ?? (ctx.state.whats[site] ?? 0);
  const occupied = who !== 0 || what !== 0;
  switch (type) {
    case "own":
    case "mover":
      return who === mover;
    case "notown":
      return who !== mover;
    case "enemy":
      return who !== 0 && who !== mover;
    case "notenemy":
      return who === 0 || who === mover;
    case "empty":
      return !occupied;
    case "notempty":
      return occupied;
    default:
      if (/^p\d+$/.test(type)) return who === Number(type.slice(1));
      return true;
  }
}

function directionBetween(ctx: Context & EvalScratch, from: number, to: number): string | null {
  const board = (ctx.game as unknown as { equipment?: { board?: { width?: number } } }).equipment?.board;
  const width = board?.width ?? 0;
  if (width <= 0) return null;
  const dc = Math.sign((to % width) - (from % width));
  const dr = Math.sign(Math.floor(to / width) - Math.floor(from / width));
  if (dc === 0 && dr === 1) return "N";
  if (dc === 0 && dr === -1) return "S";
  if (dc === 1 && dr === 0) return "E";
  if (dc === -1 && dr === 0) return "W";
  if (dc === 1 && dr === 1) return "NE";
  if (dc === -1 && dr === 1) return "NW";
  if (dc === 1 && dr === -1) return "SE";
  if (dc === -1 && dr === -1) return "SW";
  return null;
}
