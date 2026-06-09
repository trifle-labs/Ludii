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
/** Java Constants.OFF = -2 */
const OFF = -2;

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
      const dummyCtx = { game } as unknown as Context;

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
            // @java Map.java:157–166 — look up component by name
            const components = game.equipment().components();
            for (let i = 1; i < components.length; i++) {
              const component = components[i] ?? null;
              if (component !== null && component.name() === pair.stringValue) {
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
 * Returns whether a string looks like a board coordinate (e.g. "A4", "D1").
 * @java main.StringRoutines.isCoordinate(String)
 *
 * Java's isCoordinate returns true if the string contains at least one letter
 * followed by at least one digit (case insensitive), which covers algebraic
 * coordinate notation like "A4", "H8", etc.
 */
function isCoordinate(s: string): boolean {
  return /^[a-zA-Z]+\d+$/.test(s) || /^\d+[a-zA-Z]+$/.test(s);
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
