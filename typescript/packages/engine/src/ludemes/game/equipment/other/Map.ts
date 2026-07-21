// @java Core/src/game/equipment/other/Map.java

/**
 * Defines a map between two locations or integers.
 *
 * @java game/equipment/other/Map.java Map
 * @author Eric.Piette
 * @remarks Used to map a site to another or to map an integer to another.
 */

import { Item, type RoleType, type GameLike } from "../Item.js";
import { LandmarkType } from "../../util/math/LandmarkType.js";
import { Pair } from "../../util/math/Pair.js";
import { SiteFinder, type BoardLike } from "../../../other/topology/SiteFinder.js";
import type { Topology } from "../../../other/topology/Topology.js";
import type { TopologyElement, SiteType } from "../../../other/topology/TopologyElement.js";
import type { IntFunction } from "../../../base.js";
import type { Context } from "../../../../context.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;
/**
 * Java Constants.OFF = -1 (Constants.java:83) — NOT -2 (that's END).
 * computeMap gates the string-coordinate fallback on `intKey/intValue == OFF`;
 * with -2 the fallback never ran and every (pair P1 "D1")-style map entry was
 * silently dropped (Ashtapada's Entry/Exit maps compiled empty).
 */
const OFF = -1;

/**
 * Minimal interface for a Board needed by Map.computeMap().
 * @java game.equipment.container.board.Board
 */
interface BoardForMap extends BoardLike {
  topology(): Topology & {
    bottom(type: SiteType): TopologyElement[];
    centre(type: SiteType): TopologyElement[];
    left(type: SiteType): TopologyElement[];
    right(type: SiteType): TopologyElement[];
    top(type: SiteType): TopologyElement[];
    vertices(): TopologyElement[];
    cells(): TopologyElement[];
  };
}

/**
 * Minimal interface for a Game needed by Map.computeMap().
 * @java game.Game
 */
interface GameForMap extends GameLike {
  board(): BoardForMap;
  equipment(): {
    components(): Array<{ name(): string | null } | null>;
  };
}

/**
 * Defines a map between two locations or integers.
 *
 * @java game/equipment/other/Map.java Map
 */
export class Map extends Item {
  /** @java Map.map — the int→int lookup table */
  private readonly _map: globalThis.Map<number, number> = new globalThis.Map();

  /** @java Map.mapPairs — the pairs used to construct the map */
  private readonly _mapPairs: readonly Pair[];

  // ---------------------------------------------------------------------------
  // Constructors
  // ---------------------------------------------------------------------------

  /**
   * For map of pairs.
   *
   * @param name  The name of the map ["Map"].
   * @param pairs The pairs of each map.
   *
   * @java Map(String name, Pair[] pairs)
   */
  public constructor(name: string | null, pairs: readonly Pair[]);

  /**
   * For map between integers.
   *
   * @param name   The name of the map ["Map"].
   * @param keys   The keys of the map.
   * @param values The values of the map.
   *
   * @java Map(String name, IntFunction[] keys, IntFunction[] values)
   */
  public constructor(name: string | null, keys: readonly IntFunction[], values: readonly IntFunction[]);

  public constructor(
    name: string | null,
    pairsOrKeys: readonly Pair[] | readonly IntFunction[],
    values: readonly IntFunction[] | undefined = undefined,
  ) {
    // @java Map.java:60 — super((name == null) ? "Map" : name, Constants.UNDEFINED, RoleType.Neutral)
    super((name === null) ? "Map" : name, UNDEFINED, "Neutral" as RoleType);

    if (values !== undefined) {
      // @java Map(String, IntFunction[], IntFunction[]) constructor
      const keys = pairsOrKeys as readonly IntFunction[];
      if (keys.length !== values.length) {
        throw new Error(
          "A map has to be defined with exactly the same number of keys than values.",
        );
      }
      const minLength = Math.min(keys.length, values.length);
      const pairs: Pair[] = [];
      for (let i = 0; i < minLength; i++) {
        pairs.push(Pair.fromIntInt(keys[i]!, values[i]!));
      }
      this._mapPairs = pairs;
    } else {
      // @java Map(String, Pair[]) constructor
      this._mapPairs = pairsOrKeys as readonly Pair[];
    }

    // @java Map.java:63 — setType(ItemType.Map)
    this.setType("Map");
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /**
   * @java Map.map()
   * @returns the underlying int→int map.
   */
  public map(): ReadonlyMap<number, number> {
    return this._map;
  }

  /**
   * To get the value of the key in the map.
   * @java Map.to(int key)
   * @param key
   * @returns value corresponding to the key (or noEntryValue if absent).
   */
  public to(key: number): number {
    // @java Map.java:116 — return map.get(key)
    // Java's TIntIntHashMap returns noEntryValue (0 by default) for missing keys
    return this._map.get(key) ?? 0;
  }

  /**
   * @java Map.noEntryValue()
   * @returns The value returned by map when values don't exist for any given key.
   */
  public noEntryValue(): number {
    // @java TIntIntHashMap default noEntryValue = 0
    return 0;
  }

  // ---------------------------------------------------------------------------
  // computeMap
  // ---------------------------------------------------------------------------

  /**
   * We compute the maps.
   *
   * @param game The game.
   * @java Map.computeMap(Game)
   */
  public computeMap(game: GameForMap): void {
    // @java Map.java:135–191
    for (const pair of this._mapPairs) {
      // Create a dummy context for eval — use escape hatch since we don't
      // have access to the trial/state types in this module.
      // @java Coord.eval calls context.topology() (then getElement/findByCoord)
      // to resolve a (coord …) map key. Without topology the lookup returned
      // OFF, so coord-keyed maps ((map "EntrySite" {(pair P1 (coord …)) …}))
      // stored 0 for every key and (mapEntry …) read site 0 (Len Doat).
      const dummyCtx = { game, topology: () => game.board().topology() } as unknown as Context;

      let intKey: number = pair.getIntKey().eval(dummyCtx as unknown as Context & { _evalTo: number; _evalFrom: number; _evalValue: number });
      if (intKey === OFF) {
        // @java Map.java:140–144
        const element = SiteFinder.find(
          game.board(),
          pair.stringKey ?? "",
          null,
        );
        if (element !== null) {
          intKey = element.index();
        }
      }

      let intValue: number = pair.getIntValue().eval(dummyCtx as unknown as Context & { _evalTo: number; _evalFrom: number; _evalValue: number });
      if (intValue === OFF) {
        // @java Map.java:148–171
        if (pair.stringValue !== null) {
          if (isCoordinate(pair.stringValue)) {
            // @java StringRoutines.isCoordinate(pair.stringValue())
            const element = SiteFinder.find(
              game.board(),
              pair.stringValue,
              null,
            );
            if (element !== null) {
              intValue = element.index();
            }
          } else {
            // @java Map.java:157–166 — look up component by name.
            // Java's Component.name() is the OWNER-SUFFIXED name (e.g. a Neutral
            // "SquareLarge" is component "SquareLarge0"; "Pawn3d" Each → "Pawn3d1"),
            // and .lud map values carry that suffix ((pair 0 "SquareLarge0")). The TS
            // port stores the base name in name() (suffix stripped into
            // nameWithoutNumber), so a bare name()-equals check never matched and the
            // map compiled empty — Santorini/Kos's (mapEntry (size Stack …)) then fell
            // back to the key, (piece 0) was a no-op, towers never built and the
            // level-3 win never fired. Reconstruct the Java name (base + owner) to match.
            const components = game.equipment().components();
            for (let i = 1; i < components.length; i++) {
              const component = components[i] ?? null;
              if (component === null) continue;
              const comp = component as unknown as {
                name(): string | null;
                getNameWithoutNumber?(): string;
                owner?(): number;
              };
              const baseName = comp.getNameWithoutNumber?.() ?? comp.name() ?? "";
              const ownerIdx = typeof comp.owner === "function" ? comp.owner() : undefined;
              const javaName = ownerIdx !== undefined ? `${baseName}${ownerIdx}` : null;
              if (javaName === pair.stringValue || comp.name() === pair.stringValue) {
                intValue = i;
                break;
              }
            }
          }
        } else {
          // @java Map.java:169–171 — landmark type lookup
          if (pair.landmark !== null) {
            intValue = getSite(game.board(), pair.landmark);
          }
        }
      }

      // @java Map.java:174–175
      if (intValue !== OFF && intKey !== OFF) {
        this._map.set(intKey, intValue);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // gameFlags / concepts / willCrash / missingRequirement
  // ---------------------------------------------------------------------------

  /**
   * @java Map.gameFlags(Game)
   */
  public override gameFlags(game: GameLike): bigint {
    let gameFlags = 0n;
    for (const pair of this._mapPairs) {
      const pairFlags = (pair as unknown as { gameFlags?(g: unknown): bigint }).gameFlags;
      if (typeof pairFlags === "function") {
        gameFlags |= pairFlags.call(pair, game);
      }
    }
    return gameFlags;
  }

  /**
   * @java Map.missingRequirement(Game)
   */
  public missingRequirement(game: GameForMap): boolean {
    let missingRequirement = false;

    const role = this.role();
    if (role !== null) {
      const indexOwnerPhase = this.owner();
      if (
        (
          indexOwnerPhase < 1
          && role !== "Shared"
          && role !== "Neutral"
          && role !== "All"
        )
        || indexOwnerPhase > game.players().count()
      ) {
        // @java game.addRequirementToReport(...)
        (game as unknown as { addRequirementToReport?(msg: string): void })
          .addRequirementToReport?.(
            "A map is defined in the equipment with an incorrect owner: " + role + ".",
          );
        missingRequirement = true;
      }
    }

    for (const pair of this._mapPairs) {
      const pairMissing = (pair as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement;
      if (typeof pairMissing === "function") {
        missingRequirement = missingRequirement || pairMissing.call(pair, game);
      }
    }

    return missingRequirement;
  }

  /**
   * @java Map.willCrash(Game)
   */
  public willCrash(game: GameForMap): boolean {
    let willCrash = false;
    for (const pair of this._mapPairs) {
      const pairCrash = (pair as unknown as { willCrash?(g: unknown): boolean }).willCrash;
      if (typeof pairCrash === "function") {
        willCrash = willCrash || pairCrash.call(pair, game);
      }
    }
    return willCrash;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns whether a string looks like a board coordinate (e.g. "A1", "ZZ123", "37").
 * @java main.StringRoutines.isCoordinate(String) — faithful 1:1 port.
 *
 * The earlier loose regex (`letters followed by digits`) wrongly classified
 * owner-suffixed COMPONENT names like "SquareLarge0"/"Pawn3d1" as coordinates, so
 * Map.computeMap routed them to SiteFinder (which fails) instead of the
 * component-name lookup — Santorini/Kos's level→building map compiled empty and
 * (mapEntry (size Stack …)) fell back to the key. Java requires the leading-letter
 * run to be at most ~two chars (and identical if two), which "SquareLarge0" fails.
 */
function isDigit(ch: string): boolean { return ch >= "0" && ch <= "9"; }
function isLetter(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");
}
function isCoordinate(str: string | null): boolean {
  if (str == null || str.length === 0) return false;
  let c = str.length - 1;
  // @java last character should always be a digit
  if (!isDigit(str.charAt(c))) return false;
  while (c >= 0 && isDigit(str.charAt(c))) c--;
  // @java string is all digits, e.g. custom board with no axes
  if (c < 0) return true;
  // @java coordinate should have no more than two letters
  if (c > 2) return false;
  // @java if first two chars are letters, they should be the same, e.g. "AA1"
  if (c > 1 && str.length > 1 && str.charAt(0) !== str.charAt(1)) return false;
  while (c >= 0 && isLetter(str.charAt(c))) c--;
  // @java whether string is all letters followed by all digits
  return c < 0;
}

/**
 * Returns the site index corresponding to the landmark.
 * @java Map.getSite(Board, LandmarkType)
 */
function getSite(board: BoardForMap, landmarkType: LandmarkType): number {
  const defaultSite = board.defaultSite();
  const topo = board.topology();

  switch (landmarkType) {
    case LandmarkType.BottomSite:
      // @java Map.java:199–201
      return (
        defaultSite === "Vertex"
          ? topo.bottom("Vertex")
          : topo.bottom("Cell")
      )[0]?.index() ?? UNDEFINED;

    case LandmarkType.CentreSite:
      // @java Map.java:203–205
      return (
        defaultSite === "Vertex"
          ? topo.centre("Vertex")
          : topo.centre("Cell")
      )[0]?.index() ?? UNDEFINED;

    case LandmarkType.LeftSite:
      // @java Map.java:207–210
      return (
        defaultSite === "Vertex"
          ? topo.left("Vertex")
          : topo.left("Cell")
      )[0]?.index() ?? UNDEFINED;

    case LandmarkType.RightSite:
      // @java Map.java:211–214
      return (
        defaultSite === "Vertex"
          ? topo.right("Vertex")
          : topo.right("Cell")
      )[0]?.index() ?? UNDEFINED;

    case LandmarkType.Topsite:
      // @java Map.java:215–218
      return (
        defaultSite === "Vertex"
          ? topo.top("Vertex")
          : topo.top("Cell")
      )[0]?.index() ?? UNDEFINED;

    case LandmarkType.FirstSite:
      // @java Map.java:219–220
      return 0;

    case LandmarkType.LastSite: {
      // @java Map.java:221–224
      if (defaultSite === "Vertex") {
        const verts = topo.vertices();
        return verts[verts.length - 1]?.index() ?? UNDEFINED;
      } else {
        const cells = topo.cells();
        return cells[cells.length - 1]?.index() ?? UNDEFINED;
      }
    }

    default:
      return UNDEFINED;
  }
}
