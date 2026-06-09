// @java Core/src/game/equipment/Equipment.java

/**
 * Defines the equipment list of the game.
 *
 * @java game/equipment/Equipment.java
 * @author cambolbro and Eric.Piette
 *
 * @remarks To define the items (container, component etc.) of the game.
 */

import { BaseLudeme, type IGame } from "../../other/other/BaseLudeme.js";
import { Item, type ItemType, type RoleType } from "./Item.js";
import type { SiteType } from "./other/Hints.js";
import { Board as BoardContainer } from "./container/board/Board.js";

// ---------------------------------------------------------------------------
// Java Constants
// ---------------------------------------------------------------------------

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

// ---------------------------------------------------------------------------
// Minimal interfaces for the Java types that are Phase-2 stubs.
// We use "as unknown as XInterface" escape hatches in the body.
// ---------------------------------------------------------------------------

/** @java game.equipment.container.Container */
interface Container extends Item {
  topology(): Topology;
  numSites(): number;
  defaultSite(): SiteType;
  isDice(): boolean;
  isDeck(): boolean;
  isBoardless(): boolean;
  create(game: GameInterface): void;
  createTopology(beginIndex: number, numEdges: number): void;
  index(): number;
  setIndex(i: number): void;
  role(): RoleType;
  owner(): number;
}

/** @java other.topology.Topology */
interface Topology {
  numEdges(): number;
  cells(): unknown[];
  getGraphElements(type: SiteType): unknown[];
  computeRelation(type: SiteType): void;
  computeSupportedDirection(type: SiteType): void;
  convertPropertiesToList(type: SiteType, element: unknown): void;
  computeRows(type: SiteType, threeDimensions: boolean): void;
  computeColumns(type: SiteType, threeDimensions: boolean): void;
  crossReferencePhases(type: SiteType): void;
  computeLayers(type: SiteType): void;
  computeCoordinates(type: SiteType): void;
  preGenerateDistanceTables(type: SiteType): void;
  preGenerateDistanceToEachElementToEachOther(type: SiteType, relation: string): void;
  computeDoesCross(): void;
  pregenerateFeaturesData(game: GameInterface, cont: Container): void;
  optimiseMemory(): void;
}

/** @java game.equipment.component.Component */
interface Component extends Item {
  role(): RoleType;
  name(): string | null;
  setName(n: string): void;
  setIndex(i: number): void;
  setRoleFromPlayerId(pid: number): void;
  clone(): Component;
  getClass(): { toString(): string };
  create(game: GameInterface): void;
  generator(): unknown;
  componentGeneratorRulesToEnglish(game: IGame): string;
  getNameWithoutNumber(): string;
  toEnglish(game: IGame): string;
  owner(): number;
}

/** @java game.equipment.container.other.Dice */
interface Dice extends Container {
  numLocs(): number;
  getNumFaces(): number;
  getBiased(): unknown;
  getFaces(): unknown[][];
  getStart(): unknown;
}

/** @java game.equipment.container.board.Board */
interface Board extends Container {
  cellRange(): { min(ctx: unknown): number; max(ctx: unknown): number };
}

/** @java game.equipment.container.board.Track */
interface Track {
  owner(): number;
  setTrackIdx(i: number): void;
}

/** @java game.equipment.container.other.Hand */
interface Hand extends Container {
  clone(): Hand;
}

/** @java game.equipment.container.other.Deck */
interface Deck extends Container {
  generateCards(indexCard: number, compSize: number): Component[];
}

/** @java game.equipment.other.Regions */
interface Regions extends Item {
  region(): RegionFunctionLike[] | null;
  sites(): unknown;
  create(game: GameInterface): void;
  toEnglish(game: IGame): string;
}

/** @java game.functions.region.RegionFunction */
interface RegionFunctionLike {
  isStatic(): boolean;
}

/** @java game.equipment.other.Map */
interface GameMap extends Item {
  create(game: GameInterface): void;
}

/** @java game.equipment.other.Dominoes */
interface DominoesItem extends Item {
  generateDominoes(): Component[];
}

/** @java game.equipment.other.Hints */
interface HintsItem extends Item {
  where(): number[][];
  values(): number[];
  getType(): SiteType;
}

/** Minimal game interface used by createItems/initContainerAndParameters. */
interface GameInterface {
  players(): { count(): number; size(): number };
  isDeductionPuzzle(): boolean;
  hasTrack(): boolean;
  hasSubgames(): boolean;
  board(): Board & { tracks(): Track[]; setOwnedTrack(tracks: Track[][]): void };
  computeGameFlags(): bigint;
}

/** @java game.types.state.GameType flags */
const GameTypeFlags = {
  ThreeDimensions:          0x00000001n,
  StepAdjacentDistance:     0x00000002n,
  StepAllDistance:          0x00000004n,
  StepOffDistance:          0x00000008n,
  StepDiagonalDistance:     0x00000010n,
  StepOrthogonalDistance:   0x00000020n,
} as const;

/** @java game.types.board.RelationType */
const RelationType = {
  Adjacent:    "Adjacent",
  All:         "All",
  OffDiagonal: "OffDiagonal",
  Diagonal:    "Diagonal",
  Orthogonal:  "Orthogonal",
} as const;

/** @java other.ItemType.isContainer(type) — true if type is a container kind */
function itemTypeIsContainer(type: ItemType | null): boolean {
  return type === "Board" || type === "Container" || type === "Hand" || type === "Dice";
}

/** @java other.ItemType.isComponent(type) */
function itemTypeIsComponent(type: ItemType | null): boolean {
  return type === "Component" || type === "Dominoes";
}

/** @java other.ItemType.isRegion(type) */
function itemTypeIsRegion(type: ItemType | null): boolean {
  return type === "Regions";
}

/** @java other.ItemType.isMap(type) */
function itemTypeIsMap(type: ItemType | null): boolean {
  return type === "Map";
}

/** @java other.ItemType.isHints(type) */
function itemTypeIsHints(type: ItemType | null): boolean {
  return type === "Hints";
}

/**
 * @java other.ItemType.values() — ordered ordinal list.
 * Java sorts items by ItemType ordinal. Order from ItemType.java:
 * Board(0), Container(1), Hand(2), Dice(3), Component(4), Dominoes(5), Regions(6), Map(7), Hints(8)
 */
const ITEM_TYPE_ORDINAL: Record<string, number> = {
  Board:      0,
  Container:  1,
  Hand:       2,
  Dice:       3,
  Component:  4,
  Dominoes:   5,
  Regions:    6,
  Map:        7,
  Hints:      8,
};

const MAX_ITEM_TYPE_ORDINAL = 9;

// ---------------------------------------------------------------------------
// Context/Trial stubs for deduction-puzzle number generation
// ---------------------------------------------------------------------------

/** Minimal context stub for deduction puzzle range queries (used in createItems). */
class MinimalContext {
  constructor(
    public readonly game: GameInterface,
    public readonly trial: unknown,
  ) {}
}

class MinimalTrial {
  constructor(public readonly game: GameInterface) {}
}

// ---------------------------------------------------------------------------
// Equipment class
// ---------------------------------------------------------------------------

/**
 * Defines the equipment list of the game.
 *
 * @java game/equipment/Equipment.java Equipment
 */
export class Equipment extends BaseLudeme {

  /** @java Equipment.containers — list of containers */
  private _containers: Container[] | null = null;

  /** @java Equipment.components — list of components */
  private _components: Component[] | null = null;

  /** @java Equipment.regions — list of regions */
  private _regions: Regions[] | null = null;

  /** @java Equipment.maps — list of maps */
  private _maps: GameMap[] | null = null;

  /** @java Equipment.totalDefaultSites */
  private _totalDefaultSites = 0;

  /** @java Equipment.containerId — which container a given site index refers to */
  private _containerId: number[] | null = null;

  /** @java Equipment.offset — which actual site within container a site index refers to */
  private _offset: number[] | null = null;

  /** @java Equipment.sitesFrom — which accumulated site index a container starts at */
  private _sitesFrom: number[] | null = null;

  /** @java Equipment.vertexWithHints */
  private _vertexWithHints: Array<number[] | null> = [];

  /** @java Equipment.cellWithHints */
  private _cellWithHints: Array<number[] | null> = [];

  /** @java Equipment.edgeWithHints */
  private _edgeWithHints: Array<number[] | null> = [];

  /** @java Equipment.vertexHints */
  private _vertexHints: Array<number | null> = [];

  /** @java Equipment.cellHints */
  private _cellHints: Array<number | null> = [];

  /** @java Equipment.edgeHints */
  private _edgeHints: Array<number | null> = [];

  /**
   * Items received from constructor, to be created when game.create() is called.
   * @java Equipment.itemsToCreate
   */
  private _itemsToCreate: Item[] | null;

  /**
   * @java Equipment(Item[])
   *
   * @param items The items (container, component etc.).
   *
   * @example (equipment { (board (square 3)) (piece "Disc" P1) (piece "Cross" P2) })
   */
  public constructor(items: Item[]) {
    super();

    // @java Equipment.java:111–119 — check that at least one board is defined.
    // Java uses `item instanceof Board` (a Board's ItemType is Container); the
    // earlier type()==="Board" check never matched since no item carries that type.
    let hasABoard = false;
    for (const item of items) {
      if (item instanceof BoardContainer) {
        hasABoard = true;
        break;
      }
    }

    if (!hasABoard) {
      throw new Error("At least a board has to be defined in the equipment.");
    }

    // @java Equipment.java:126
    this._itemsToCreate = items;
  }

  // ---------------------------------------------------------------------------
  // toEnglish
  // ---------------------------------------------------------------------------

  /**
   * @java Equipment.toEnglish(Game)
   */
  public override toEnglish(game: IGame): string {
    let text = "";
    const ruleMap = new Map<string, string>();

    // @java Equipment.java:137–139 — only board toEnglish
    if (this._containers !== null && this._containers.length > 0) {
      text += "on a " + (this._containers[0] as unknown as { toEnglish(g: IGame): string }).toEnglish(game) + ".";
    }

    const regions = this._regions ?? [];
    if (regions.length > 0) {
      text += "\nRegions:";
      for (const region of regions) {
        text += "\n    " + region.toEnglish(game);
      }
    }

    const components = this._components;
    if (components !== null && components.length > 1) {
      text += " ";

      // @java Equipment.java:153–165 — collect unique player roles
      const playerRoleList: RoleType[] = [];
      for (let j = 1; j <= components.length - 1; j++) {
        const playerRole = components[j]!.role();
        if (!playerRoleList.includes(playerRole)) {
          playerRoleList.push(playerRole);
        }
      }

      // @java Equipment.java:165 — sort by name
      playerRoleList.sort((e1, e2) =>
        (e1 as string).toLowerCase().localeCompare((e2 as string).toLowerCase())
      );

      const playerPieceText: string[] = [];
      for (const playerRole of playerRoleList) {
        let pieceText = "";
        const pieces: string[] = [];

        for (let j = 1; j <= components.length - 1; j++) {
          if (playerRole === components[j]!.role()) {
            pieces.push(components[j]!.toEnglish(game));
          }

          if (components[j]!.generator() !== null) {
            const newRule = components[j]!.componentGeneratorRulesToEnglish(game);
            const oldRule = ruleMap.get(components[j]!.componentGeneratorRulesToEnglish(game));
            if (newRule !== oldRule) {
              if (oldRule === undefined) {
                ruleMap.set(components[j]!.getNameWithoutNumber(), newRule);
              } else {
                ruleMap.set(
                  components[j]!.getNameWithoutNumber() + "(" + components[j]!.owner() + ")",
                  newRule,
                );
              }
            }
          }
        }

        for (let n = 0; n < pieces.length; n++) {
          if (n === pieces.length - 1 && n > 0) pieceText += " and ";
          else if (n > 0) pieceText += ", ";
          pieceText += pieces[n];
        }
        pieceText += ".";
        playerPieceText.push(pieceText);
      }

      // @java Equipment.java:209–229 — check if all players have same pieces
      let allSamePieces = true;
      let lastPieceString: string | null = null;
      for (let i = 0; i < playerRoleList.length; i++) {
        const playerRole = playerRoleList[i];
        if (playerRole !== "Shared" && playerRole !== "Neutral") {
          const s = playerPieceText[i]!;
          if (s.length > 1) {
            if (lastPieceString === null) {
              lastPieceString = s;
            } else if (lastPieceString !== s) {
              allSamePieces = false;
              break;
            }
          }
        }
      }

      // @java Equipment.java:233–272 — combine piece text
      let pieceText = "";
      if (allSamePieces) {
        pieceText += "All players play with ";
        pieceText += lastPieceString ?? "";
      }

      for (let i = 0; i < playerRoleList.length; i++) {
        const playerRole = playerRoleList[i];
        if (playerRole === "Shared") {
          pieceText +=
            (pieceText.length === 0 ? "" : " ") +
            "The following pieces are shared by all players: " +
            playerPieceText[playerPieceText.length - 1];
        }
        if (playerRole === "Neutral") {
          pieceText +=
            (pieceText.length === 0 ? "" : " ") +
            "The following pieces are neutral: " +
            playerPieceText[0];
        } else if (!allSamePieces) {
          // @java LanguageUtils.RoleTypeAsText(playerRole, true)
          const playerName = String(playerRole);
          pieceText +=
            (pieceText.length === 0 ? "" : " ") + playerName + " plays with ";
          pieceText += playerPieceText[i];
        }
      }

      text += (pieceText.length === 0 ? "" : "\n") + pieceText;

      // @java Equipment.java:263–273 — rules for pieces
      if (ruleMap.size > 0) {
        const ruleKeys = [...ruleMap.keys()].sort();
        let ruleText = "";
        for (const rKey of ruleKeys) {
          ruleText += "\n     " + ruleMap.get(rKey) + ".";
        }
        text += "\nRules for Pieces:" + ruleText;
      }
    }

    return text;
  }

  // ---------------------------------------------------------------------------
  // createItems
  // ---------------------------------------------------------------------------

  /**
   * Creates all the items.
   *
   * @java Equipment.createItems(Game)
   *
   * @param game The game.
   */
  public createItems(game: unknown): void {
    const g = game as GameInterface;

    // @java Equipment.java:289–292 — create WIP lists
    const componentsWIP: Component[] = [];
    const containersWIP: Container[] = [];
    const regionsWIP: Regions[] = [];
    const mapsWIP: GameMap[] = [];

    // @java Equipment.java:296–299 — empty piece at index 0
    const emptyPiece = this._makeEmptyPiece();
    (emptyPiece as unknown as { setIndex(i: number): void }).setIndex(0);
    componentsWIP.push(emptyPiece);

    if (this._itemsToCreate !== null) {
      // @java Equipment.java:303 — sort items by ItemType ordinal
      const sortItems = Equipment._sort(this._itemsToCreate);

      let indexDie = 1;
      let indexCard = 1;

      for (const item of sortItems) {
        const itemType = item.type();

        // @java Equipment.java:310 — if this is a container
        if (itemTypeIsContainer(itemType)) {
          const c = item as unknown as Container;

          // @java Equipment.java:314–320 — Hand/Dice ordinal range
          const handOrdinal = ITEM_TYPE_ORDINAL["Hand"]!;
          const diceOrdinal = ITEM_TYPE_ORDINAL["Dice"]!;
          const typeOrdinal = ITEM_TYPE_ORDINAL[itemType ?? ""] ?? -1;

          if (typeOrdinal >= handOrdinal && typeOrdinal <= diceOrdinal) {
            if (c.role() !== null && c.role() === "Each" as RoleType) {
              // @java Equipment.java:323–330 — clone hand for each player
              const hand = c as unknown as Hand;
              for (let idPlayer = 1; idPlayer <= g.players().count(); idPlayer++) {
                const newHand = hand.clone();
                if (hand.name() === null) newHand.setName("Hand");
                newHand.setName((newHand.name() ?? "Hand") + idPlayer);
                newHand.setRoleFromPlayerId(idPlayer);
                containersWIP.push(newHand as unknown as Container);
              }
            } else if (itemType === "Dice") {
              // @java Equipment.java:333–368 — dice handling
              const dice = c as unknown as Dice;
              const indexSameDice = Equipment._multiDiceSameOwner(dice, containersWIP);
              if (indexSameDice === UNDEFINED) {
                containersWIP.push(c);
                for (let i = indexDie; i <= dice.numLocs() + indexDie - 1; i++) {
                  const die = this._makeDie(
                    "Die" + i,
                    dice.role(),
                    dice.getNumFaces(),
                    dice.getBiased(),
                    dice.getFaces()[i - indexDie]!,
                    dice.getStart(),
                  );
                  componentsWIP.push(die);
                }
                indexDie += dice.numLocs();
              } else {
                for (let i = indexDie; i <= dice.numLocs() + indexDie - 1; i++) {
                  const die = this._makeDie(
                    "Die" + i,
                    dice.role(),
                    dice.getNumFaces(),
                    dice.getBiased(),
                    dice.getFaces()[i - indexDie]!,
                    dice.getStart(),
                  );
                  componentsWIP.push(die);
                }
                indexDie += dice.numLocs();
                // @java Equipment.java:363–368 — merge dice
                const existingDice = containersWIP[indexSameDice] as unknown as Dice;
                const merged = this._makeMergedDice(
                  dice.getNumFaces(),
                  dice.getFaces(),
                  dice.role(),
                  existingDice.numLocs() + dice.numLocs(),
                );
                containersWIP[indexSameDice] = merged;
              }
            } else if (c.isDeck()) {
              // @java Equipment.java:370–375 — deck handling
              containersWIP.push(c);
              const deck = c as unknown as Deck;
              const cards = deck.generateCards(indexCard, componentsWIP.length);
              for (const card of cards) componentsWIP.push(card);
              indexCard += cards.length;
            } else {
              // @java Equipment.java:378–382 — plain hand
              if (c.name() === null) {
                c.setName("Hand" + (c as unknown as { owner(): number }).owner());
              }
              containersWIP.push(c);
            }
          } else {
            // @java Equipment.java:386 — other containers (Board, etc.)
            containersWIP.push(c);
          }

          // @java Equipment.java:391–407 — deduction puzzle numbers
          if (g.isDeductionPuzzle()) {
            const puzzleBoard = c as unknown as Board;
            const ctx = new MinimalContext(g, new MinimalTrial(g));
            if (puzzleBoard.cellRange().max(ctx) !== 0) {
              for (
                let num = puzzleBoard.cellRange().min(ctx);
                num <= puzzleBoard.cellRange().max(ctx);
                num++
              ) {
                const number = this._makePiece(String(num), "P1" as RoleType);
                componentsWIP.push(number);
              }
            }
          }

        } else if (itemTypeIsComponent(itemType)) {
          // @java Equipment.java:409 — isComponent
          if (itemType === "Component") {
            const comp = item as unknown as Component;
            if (comp.role() !== null && comp.role() === "Each" as RoleType) {
              // @java Equipment.java:422–438 — clone for each player
              for (let idPlayer = 1; idPlayer <= g.players().count(); idPlayer++) {
                const compCopy = comp.clone();
                if (comp.name() === null) {
                  const className = comp.getClass().toString();
                  const componentName = className.substring(className.lastIndexOf(".") + 1);
                  compCopy.setName(componentName);
                }
                compCopy.setRoleFromPlayerId(idPlayer);
                compCopy.setName(compCopy.name() ?? "");
                compCopy.setIndex(componentsWIP.length - 1);
                componentsWIP.push(compCopy);
              }
            } else {
              // @java Equipment.java:441–448
              if (comp.name() === null) {
                const className = comp.getClass().toString();
                const componentName = className.substring(className.lastIndexOf(".") + 1);
                comp.setName(componentName + comp.owner());
              }
              componentsWIP.push(comp);
            }
          } else if (itemType === "Dominoes") {
            // @java Equipment.java:452–457
            const dominoesItem = item as unknown as DominoesItem;
            const listDominoes = dominoesItem.generateDominoes();
            for (const domino of listDominoes) {
              componentsWIP.push(domino);
            }
          }

        } else if (itemTypeIsRegion(itemType)) {
          // @java Equipment.java:460
          regionsWIP.push(item as unknown as Regions);
        } else if (itemTypeIsMap(itemType)) {
          // @java Equipment.java:463
          mapsWIP.push(item as unknown as GameMap);
        } else if (itemTypeIsHints(itemType)) {
          // @java Equipment.java:466–507
          const hints = item as unknown as HintsItem;
          const minSize = Math.min(hints.where().length, hints.values().length);
          const puzzleType = hints.getType();

          if (puzzleType === "Vertex") {
            this.setVertexWithHints(new Array(minSize).fill(null) as Array<number[] | null>);
            this.setVertexHints(new Array(minSize).fill(null) as Array<number | null>);
          } else if (puzzleType === "Edge") {
            this.setEdgeWithHints(new Array(minSize).fill(null) as Array<number[] | null>);
            this.setEdgeHints(new Array(minSize).fill(null) as Array<number | null>);
          } else if (puzzleType === "Cell") {
            this.setCellWithHints(new Array(minSize).fill(null) as Array<number[] | null>);
            this.setCellHints(new Array(minSize).fill(null) as Array<number | null>);
          }

          for (let i = 0; i < minSize; i++) {
            if (puzzleType === "Vertex") {
              this.verticesWithHints()[i] = hints.where()[i] ?? null;
              this.vertexHints()[i] = hints.values()[i] ?? null;
            } else if (puzzleType === "Edge") {
              this.edgesWithHints()[i] = hints.where()[i] ?? null;
              this.edgeHints()[i] = hints.values()[i] ?? null;
            } else if (puzzleType === "Cell") {
              this.cellsWithHints()[i] = hints.where()[i] ?? null;
              this.cellHints()[i] = hints.values()[i] ?? null;
            }
          }
        }
      }
    }

    // @java Equipment.java:524–537 — if no components (except placeholder), create defaults
    if (componentsWIP.length === 1 && !g.isDeductionPuzzle()) {
      for (let pid = 1; pid <= g.players().count(); pid++) {
        const name = "Ball" + pid;
        const piece = this._makePiece(name, ("P" + pid) as RoleType);
        componentsWIP.push(piece);
      }
    }

    // @java Equipment.java:541–544 — transform lists to arrays
    this._containers = containersWIP;
    this._components = componentsWIP;
    this._regions    = regionsWIP;
    this._maps       = mapsWIP;

    // @java Equipment.java:546
    this.initContainerAndParameters(game);

    // @java Equipment.java:548–572 — call create() on all items
    for (const cont of this._containers) {
      if (cont !== null) cont.create(g);
    }
    for (const comp of this._components) {
      if (comp !== null) comp.create(g);
    }
    for (const reg of this._regions) {
      reg.create(g);
    }
    for (const map of this._maps) {
      map.create(g);
    }

    // @java Equipment.java:571 — clean up
    this._itemsToCreate = null;

    // @java Equipment.java:573–596 — track setup
    if (g.hasTrack()) {
      const tracks = g.board().tracks();
      for (let i = 0; i < tracks.length; i++) {
        tracks[i]!.setTrackIdx(i);
      }

      const ownedTracks: Track[][] = new Array(g.players().size() + 1);
      for (let i = 0; i < ownedTracks.length; i++) {
        const ownedTrack: Track[] = [];
        for (const track of tracks) {
          if (track.owner() === i) ownedTrack.push(track);
        }
        ownedTracks[i] = ownedTrack;
      }
      g.board().setOwnedTrack(ownedTracks);
    }
  }

  // ---------------------------------------------------------------------------
  // sort (private static helper)
  // ---------------------------------------------------------------------------

  /**
   * Returns the list of items sorted by ItemType ordinal:
   * Main container, hands, dice, deck, regions, maps, components.
   *
   * @java Equipment.sort(Item[])
   */
  private static _sort(items: Item[]): Item[] {
    // @java Equipment.java:605–622
    const sortedItem: Item[] = new Array(items.length);
    let indexSortedItem = 0;

    for (let ordinalValue = 0; ordinalValue < MAX_ITEM_TYPE_ORDINAL; ordinalValue++) {
      for (const item of items) {
        const ord = ITEM_TYPE_ORDINAL[item.type() ?? ""] ?? -1;
        if (ord === ordinalValue) {
          sortedItem[indexSortedItem] = item;
          indexSortedItem++;
        }
      }
    }

    return sortedItem;
  }

  // ---------------------------------------------------------------------------
  // multiDiceSameOwner (private static helper)
  // ---------------------------------------------------------------------------

  /**
   * @java Equipment.multiDiceSameOwner(Dice, List<Container>)
   *
   * Returns the index of the dice if there is more than one Dice owned by the
   * same player (including shared), else UNDEFINED (-1).
   */
  private static _multiDiceSameOwner(c: Dice, containers: Container[]): number {
    // @java Equipment.java:628–641
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i]!;
      if (container.isDice()) {
        const containerDice = container as unknown as Dice;
        if (containerDice.owner() === c.owner() && containerDice !== c) {
          return i;
        }
      }
    }
    return UNDEFINED;
  }

  // ---------------------------------------------------------------------------
  // initContainerAndParameters
  // ---------------------------------------------------------------------------

  /**
   * To init totalSites, offset, sitesFrom, containerId.
   *
   * @java Equipment.initContainerAndParameters(Game)
   *
   * @param game The game.
   */
  public initContainerAndParameters(game: unknown): void {
    const g = game as GameInterface;
    const containers = this._containers!;

    // @java Equipment.java:650
    const gameFlags = g.computeGameFlags();

    let index = 0;
    for (let e = 0; e < containers.length; e++) {
      const cont = containers[e]!;

      // @java Equipment.java:657–658 — create topology
      cont.createTopology(
        index,
        (cont.index() === 0) ? UNDEFINED : containers[0]!.topology().numEdges(),
      );

      const topology = cont.topology();

      // @java Equipment.java:662–700 — compute topology data for each SiteType
      for (const type of (["Vertex", "Edge", "Cell"] as SiteType[])) {
        topology.computeRelation(type);
        topology.computeSupportedDirection(type);

        for (const element of topology.getGraphElements(type)) {
          topology.convertPropertiesToList(type, element);
        }

        const threeDimensions = ((gameFlags & GameTypeFlags.ThreeDimensions) !== 0n);
        topology.computeRows(type, threeDimensions);
        topology.computeColumns(type, threeDimensions);

        if (!cont.isBoardless()) {
          topology.crossReferencePhases(type);
          topology.computeLayers(type);
          topology.computeCoordinates(type);
          topology.preGenerateDistanceTables(type);
        }

        // @java Equipment.java:688–697 — step distance precomputation
        if ((gameFlags & GameTypeFlags.StepAdjacentDistance) !== 0n) {
          topology.preGenerateDistanceToEachElementToEachOther(type, RelationType.Adjacent);
        } else if ((gameFlags & GameTypeFlags.StepAllDistance) !== 0n) {
          topology.preGenerateDistanceToEachElementToEachOther(type, RelationType.All);
        } else if ((gameFlags & GameTypeFlags.StepOffDistance) !== 0n) {
          topology.preGenerateDistanceToEachElementToEachOther(type, RelationType.OffDiagonal);
        } else if ((gameFlags & GameTypeFlags.StepDiagonalDistance) !== 0n) {
          topology.preGenerateDistanceToEachElementToEachOther(type, RelationType.Diagonal);
        } else if ((gameFlags & GameTypeFlags.StepOrthogonalDistance) !== 0n) {
          topology.preGenerateDistanceToEachElementToEachOther(type, RelationType.Orthogonal);
        }

        // @java Equipment.java:700
        topology.computeDoesCross();
      }

      // @java Equipment.java:703 — pregenerate features data for main board
      if (e === 0) {
        topology.pregenerateFeaturesData(g, cont);
      }

      // @java Equipment.java:706–711
      cont.setIndex(e);
      index += (cont.index() === 0)
        ? Math.max(
            topology.cells().length,
            topology.getGraphElements(cont.defaultSite()).length,
          )
        : cont.numSites();
      topology.optimiseMemory();
    }

    // @java Equipment.java:715–716 — INIT TOTAL SITES
    for (const cont of containers) {
      this._totalDefaultSites += cont.numSites();
    }

    const maxSiteMainBoard = Math.max(
      containers[0]!.topology().cells().length,
      containers[0]!.topology().getGraphElements(containers[0]!.defaultSite()).length,
    );

    let fakeTotalDefaultSite = maxSiteMainBoard;
    for (let i = 1; i < containers.length; i++) {
      fakeTotalDefaultSite += containers[i]!.topology().cells().length;
    }

    // @java Equipment.java:727–750 — INIT OFFSET
    this._offset = new Array(fakeTotalDefaultSite);
    let accumulatedOffset = 0;
    for (let i = 0; i < containers.length; i++) {
      const cont = containers[i]!;
      if (i === 0) {
        for (let j = 0; j < maxSiteMainBoard; ++j) {
          this._offset[j + accumulatedOffset] = j;
        }
        accumulatedOffset += maxSiteMainBoard;
      } else {
        for (let j = 0; j < cont.numSites(); ++j) {
          this._offset[j + accumulatedOffset] = j;
        }
        accumulatedOffset += cont.numSites();
      }
    }

    // @java Equipment.java:752–759 — INIT sitesFrom
    this._sitesFrom = new Array(containers.length);
    let count = 0;
    for (let i = 0; i < containers.length; i++) {
      this._sitesFrom[i] = count;
      count += (i === 0) ? maxSiteMainBoard : containers[i]!.numSites();
    }

    // @java Equipment.java:761–779 — INIT CONTAINER ID
    this._containerId = new Array(fakeTotalDefaultSite);
    count = 0;
    let idBoard = 0;
    for (let i = 0; i < containers.length - 1; i++) {
      for (let j = this._sitesFrom[i]!; j < this._sitesFrom[i + 1]!; j++) {
        this._containerId[count] = idBoard;
        count++;
      }
      idBoard++;
    }
    for (
      let j = this._sitesFrom[this._sitesFrom.length - 1]!;
      j < this._sitesFrom[this._sitesFrom.length - 1]! + containers[idBoard]!.numSites();
      j++
    ) {
      this._containerId[count] = idBoard;
      count++;
    }
  }

  // ---------------------------------------------------------------------------
  // computeStaticRegions
  // ---------------------------------------------------------------------------

  /**
   * @java Equipment.computeStaticRegions()
   *
   * @returns List of all static regions in this equipment.
   */
  public computeStaticRegions(): Regions[] {
    const staticRegions: Regions[] = [];
    for (const region of (this._regions ?? [])) {
      if (region.region() !== null) {
        let allStatic = true;
        for (const regionFunc of region.region()!) {
          if (!regionFunc.isStatic()) {
            allStatic = false;
            break;
          }
        }
        if (!allStatic) continue;
      } else if (region.sites() === null) {
        continue;
      }
      staticRegions.push(region);
    }
    return staticRegions;
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  /** @java Equipment.containers() */
  public containers(): Container[] | null { return this._containers; }

  /** @java Equipment.components() */
  public components(): Component[] | null { return this._components; }

  /** @java Equipment.clearComponents() — keeps null at index 0 */
  public clearComponents(): void {
    this._components = [null as unknown as Component];
  }

  /** @java Equipment.regions() */
  public regions(): Regions[] | null { return this._regions; }

  /** @java Equipment.maps() */
  public maps(): GameMap[] | null { return this._maps; }

  /** @java Equipment.totalDefaultSites() */
  public totalDefaultSites(): number { return this._totalDefaultSites; }

  /** @java Equipment.containerId() */
  public containerId(): number[] | null { return this._containerId; }

  /** @java Equipment.offset() */
  public offset(): number[] | null { return this._offset; }

  /** @java Equipment.sitesFrom() */
  public sitesFrom(): number[] | null { return this._sitesFrom; }

  /** @java Equipment.verticesWithHints() */
  public verticesWithHints(): Array<number[] | null> { return this._vertexWithHints; }

  /** @java Equipment.setVertexWithHints(Integer[][]) */
  public setVertexWithHints(regionWithHints: Array<number[] | null>): void {
    this._vertexWithHints = regionWithHints;
  }

  /** @java Equipment.cellsWithHints() */
  public cellsWithHints(): Array<number[] | null> { return this._cellWithHints; }

  /** @java Equipment.setCellWithHints(Integer[][]) */
  public setCellWithHints(cellWithHints: Array<number[] | null>): void {
    this._cellWithHints = cellWithHints;
  }

  /** @java Equipment.edgesWithHints() */
  public edgesWithHints(): Array<number[] | null> { return this._edgeWithHints; }

  /** @java Equipment.setEdgeWithHints(Integer[][]) */
  public setEdgeWithHints(edgeWithHints: Array<number[] | null>): void {
    this._edgeWithHints = edgeWithHints;
  }

  /** @java Equipment.vertexHints() */
  public vertexHints(): Array<number | null> { return this._vertexHints; }

  /** @java Equipment.setVertexHints(Integer[]) */
  public setVertexHints(hints: Array<number | null>): void {
    this._vertexHints = hints;
  }

  /** @java Equipment.cellHints() */
  public cellHints(): Array<number | null> { return this._cellHints; }

  /** @java Equipment.setCellHints(Integer[]) */
  public setCellHints(hints: Array<number | null>): void {
    this._cellHints = hints;
  }

  /** @java Equipment.edgeHints() */
  public edgeHints(): Array<number | null> { return this._edgeHints; }

  /** @java Equipment.setEdgeHints(Integer[]) */
  public setEdgeHints(hints: Array<number | null>): void {
    this._edgeHints = hints;
  }

  /**
   * @java Equipment.hints(SiteType)
   *
   * @param type The SiteType.
   * @returns The hints corresponding to the type.
   */
  public hints(type: SiteType): Array<number | null> {
    switch (type) {
      case "Edge":   return this.edgeHints();
      case "Vertex": return this.vertexHints();
      case "Cell":   return this.cellHints();
      default:       return [];
    }
  }

  /**
   * @java Equipment.withHints(SiteType)
   *
   * @param type The SiteType.
   * @returns The regions with hints corresponding to the type.
   */
  public withHints(type: SiteType): Array<number[] | null> {
    switch (type) {
      case "Edge":   return this.edgesWithHints();
      case "Vertex": return this.verticesWithHints();
      case "Cell":   return this.cellsWithHints();
      default:       return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Private factory helpers (escape hatches for Phase-2 stubs)
  // ---------------------------------------------------------------------------

  /**
   * Creates an empty Piece component (index 0 placeholder).
   * @java new Piece("Disc", RoleType.Neutral, null, null, null, null, null, null)
   */
  private _makeEmptyPiece(): Component {
    // Use escape hatch — Piece constructor is in Piece.ts which has a simpler signature.
    return { role: () => "Neutral" as RoleType, name: () => "Disc", setIndex: () => undefined,
             setName: () => undefined, setRole: () => undefined, setRoleFromPlayerId: () => undefined,
             owner: () => 0, index: () => 0, type: () => "Component" as ItemType,
             create: () => undefined, generator: () => null,
             clone: function() { return this; },
             getClass: () => ({ toString: () => "class game.equipment.component.Piece" }),
             componentGeneratorRulesToEnglish: () => "", getNameWithoutNumber: () => "Disc",
             toEnglish: () => "Disc",
           } as unknown as Component;
  }

  /**
   * Creates a Piece with given name and role.
   * @java new Piece(name, role, null, null, null, null, null, null)
   */
  private _makePiece(name: string, role: RoleType): Component {
    return { role: () => role, name: () => name, setIndex: () => undefined,
             setName: () => undefined, setRole: () => undefined, setRoleFromPlayerId: () => undefined,
             owner: () => 0, index: () => 0, type: () => "Component" as ItemType,
             create: () => undefined, generator: () => null,
             clone: function() { return this; },
             getClass: () => ({ toString: () => "class game.equipment.component.Piece" }),
             componentGeneratorRulesToEnglish: () => "", getNameWithoutNumber: () => name,
             toEnglish: () => name,
           } as unknown as Component;
  }

  /**
   * Creates a Die component.
   * @java new Die(name, role, numFaces, null, null)
   */
  private _makeDie(
    name: string,
    role: RoleType,
    _numFaces: number,
    _biased: unknown,
    _faces: unknown,
    _start: unknown,
  ): Component {
    return { role: () => role, name: () => name, setIndex: () => undefined,
             setName: () => undefined, setRole: () => undefined, setRoleFromPlayerId: () => undefined,
             owner: () => 0, index: () => 0, type: () => "Component" as ItemType,
             create: () => undefined, generator: () => null,
             clone: function() { return this; },
             getClass: () => ({ toString: () => "class game.equipment.component.Die" }),
             componentGeneratorRulesToEnglish: () => "", getNameWithoutNumber: () => name,
             toEnglish: () => name,
           } as unknown as Component;
  }

  /**
   * Creates a merged Dice container.
   * @java new Dice(numFaces, null, faces, null, role, numLocs, null)
   */
  private _makeMergedDice(
    _numFaces: number,
    _faces: unknown[][],
    _role: RoleType,
    _numLocs: number,
  ): Container {
    // This is a placeholder for the merged dice container.
    // The real Dice constructor is in Dice.ts (Phase 2 stub).
    throw new Error(
      "Equipment._makeMergedDice: Dice merging requires Dice.ts to be ported (Phase 2).",
    );
  }
}
