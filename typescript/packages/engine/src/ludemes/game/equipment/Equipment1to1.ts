/**
 * @java game/equipment/Equipment.java Equipment
 *
 * 1:1-port equipment container.
 *
 * Holds the board, pieces, and optional hand containers for a game.
 * Assigns 1-based component indices to pieces (mirroring Java's
 * Equipment.create() which populates component[]).
 *
 * Hand support: Java's equipment may include Hand containers for each player.
 * A hand with default size 1 provides one extra site per player beyond the
 * board sites. Hand sites are numbered starting at board.numSites.
 *
 * @java game/equipment/Equipment.java — create()/components()/board()
 * @java game/equipment/container/other/Hand.java — hand container
 */

import type { Board1to1 } from "./container/board/Board1to1.js";
import type { Piece } from "./component/Piece.js";

/**
 * Describes a hand container registered in equipment.
 * @java game/equipment/container/other/Hand.java
 */
export interface HandSpec {
  /** Owner player id (1..N), or 0 for Shared/Neutral. */
  readonly owner: number;
  /** Hand size (number of slots). Default 1. */
  readonly size: number;
}

export class Equipment1to1 {
  /**
   * The board. @java Equipment.board()
   */
  public readonly board: Board1to1;

  /**
   * All pieces, indexed 0-based. Each piece's `index` field will be set to
   * its 1-based component index by this constructor.
   * @java Equipment.components() — 1-based array (index 0 unused)
   */
  public readonly pieces: readonly Piece[];

  /**
   * Hand containers registered in equipment. Each Hand maps owner → [siteStart, size].
   * Hand sites are allocated starting at board.numSites.
   * @java game/equipment/container/other/Hand.java
   */
  public readonly hands: readonly HandSpec[];

  /**
   * Total number of sites including hand slots.
   * @java Equipment.sitesFrom()[N] (sites beyond board)
   */
  public readonly totalSites: number;

  /**
   * Starting site index for hand slots (= board.numSites).
   */
  public readonly handSiteBase: number;

  /**
   * Map from player id → starting hand site index.
   * handSiteOf[0] = Shared/Neutral hand site start (if any).
   * handSiteOf[P] = P1/P2/... hand site start.
   */
  public readonly handSiteOf: ReadonlyMap<number, number>;

  /**
   * Named player regions (from `(regions P1 ...)` equipment declarations).
   * Map from player id → RegionFunction.
   * @java game/equipment/other/Regions.java
   */
  public readonly playerRegions: ReadonlyMap<number, import("../../base.js").RegionFunction>;

  /**
   * Named tracks (mancala/race): ordered site sequences with a loop flag.
   * @java game/equipment/container/board/Track.java
   */
  public readonly tracks: ReadonlyMap<string, { sites: readonly number[]; loop: boolean; owner: number }>;

  /**
   * Named player regions (from `(regions "Home" P1 …)` declarations): lowercased
   * name → player id → RegionFunction. Used by `(sites <role> "Name")`.
   * @java game/equipment/other/Regions.java
   */
  public readonly namedPlayerRegions: ReadonlyMap<string, ReadonlyMap<number, import("../../base.js").RegionFunction>>;

  /**
   * Dice face specifications, one entry per physical die.
   * Each entry lists the face VALUES printed on that die (e.g. [1,2,3,4,5,6]).
   * Populated from `(dice facesByDie:{{…}{…}} num:N)` or `(dice num:N)`.
   * Empty when the game has no dice.
   * @java game/equipment/container/other/Dice.java
   */
  public readonly diceSpecs: readonly { readonly faces: readonly number[] }[];

  /**
   * Site index at which dice containers start (= totalSites before dice).
   * diceSiteBase + i is the board-state site for die i.
   * -1 when the game has no dice.
   */
  public readonly diceSiteBase: number;

  /**
   * @java game/equipment/Equipment.java — create()
   *
   * Assigns 1-based component indices to pieces, matching Java's Equipment.
   * Java assigns indices starting at 1 in declaration order.
   */
  public constructor(
    board: Board1to1,
    pieces: Piece[],
    hands: HandSpec[] = [],
    playerRegions: Map<number, import("../../base.js").RegionFunction> = new Map(),
    tracks: Map<string, { sites: readonly number[]; loop: boolean; owner: number }> = new Map(),
    namedPlayerRegions: Map<string, Map<number, import("../../base.js").RegionFunction>> = new Map(),
    diceSpecs: { faces: number[] }[] = [],
  ) {
    this.board = board;
    this.tracks = tracks;
    this.namedPlayerRegions = namedPlayerRegions;
    // Assign 1-based component indices.
    // @java Equipment.java — for each Component, component.setIndex(i)
    for (let i = 0; i < pieces.length; i++) {
      pieces[i]!.index = i + 1;
    }
    this.pieces = Object.freeze([...pieces]);
    this.hands = Object.freeze([...hands]);

    // Compute hand site indices starting at the board container's index SPAN,
    // = max(numFaces, numPlaySites). On a vertex-played board with more cells
    // than vertices (AlquerqueBoard 5×5: 25 vertices, 32 cells) Java puts the
    // hand at 32, not 25 — matching the recorded trials.
    // @java Equipment.sitesFrom() / Equipment.initContainer maxSiteMainBoard.
    this.handSiteBase = board.containerSpan;
    let nextSite = board.containerSpan;
    const handMap = new Map<number, number>();
    for (const hand of hands) {
      handMap.set(hand.owner, nextSite);
      nextSite += hand.size;
    }
    this.handSiteOf = handMap;

    // Dice container sites: allocated after hand sites, one slot per die.
    // @java game/equipment/container/other/Dice.java — each Die is a container
    // with one site; Java Equipment.sitesFrom() assigns consecutive indices.
    if (diceSpecs.length > 0) {
      this.diceSiteBase = nextSite;
      nextSite += diceSpecs.length;
      this.diceSpecs = Object.freeze(diceSpecs.map(d => Object.freeze({ faces: Object.freeze([...d.faces]) })));
    } else {
      this.diceSiteBase = -1;
      this.diceSpecs = Object.freeze([]);
    }

    this.totalSites = nextSite;
    this.playerRegions = playerRegions;
  }

  /**
   * Resolve `(handSite PlayerRole)` to a site index.
   * @java game/functions/ints/board/HandSite.java — eval(context)
   *
   * @param owner  1-based player id (or 0 for Shared)
   * @param offset Slot offset within the hand (0-based). Default 0.
   */
  public handSiteFor(owner: number, offset = 0): number {
    const base = this.handSiteOf.get(owner);
    if (base === undefined) return -1; // No hand for this player
    return base + offset;
  }

  /**
   * Get piece by 1-based component index.
   * @java Equipment.components()[i]
   */
  public componentAt(index: number): Piece | undefined {
    return this.pieces[index - 1];
  }

  /**
   * Get all pieces owned by a given player.
   * @java game.components() filtered by owner
   */
  public piecesOwnedBy(owner: number): Piece[] {
    return this.pieces.filter(p => p.owner === owner) as Piece[];
  }
}
