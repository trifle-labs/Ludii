// @java Core/src/game/equipment/container/board/custom/MancalaBoard.java

/**
 * Defines a Mancala-style board.
 *
 * @java game/equipment/container/board/custom/MancalaBoard.java
 * @author Eric.Piette
 */

import { Board } from "../Board.js";
import type { TrackDescriptor } from "../Board.js";
import type { StoreType } from "../../../../types/board/StoreType.js";
import { buildMancalaGraph } from "../../../../../../eval/graph/board-graph.js";

/**
 * A Mancala board with configurable rows, columns, and store types.
 *
 * @java game/equipment/container/board/custom/MancalaBoard.java — class MancalaBoard extends Board
 */
export class MancalaBoard extends Board {
  /** @java MancalaBoard.numRows */
  private readonly numRows: number;

  /** @java MancalaBoard.numColumns */
  private readonly numColumns: number;

  /** @java MancalaBoard.storeType */
  private readonly storeType: StoreType;

  /** @java MancalaBoard.numStore */
  private readonly numStore: number;

  /**
   * @java game/equipment/container/board/custom/MancalaBoard.java constructor
   *
   * @param rows       The number of rows.
   * @param columns    The number of columns.
   * @param store      The type of the store [Outer].
   * @param numStores  The number of stores [2].
   * @param largeStack True if the game can involve stacks higher than 32.
   * @param track      A single track on the board.
   * @param tracks     Multiple tracks on the board.
   */
  public constructor(
    rows: number,
    columns: number,
    store: StoreType | null,
    numStores: number | null,
    largeStack: boolean | null,
    track: TrackDescriptor | null,
    tracks: TrackDescriptor[] | null,
  ) {
    // @java MancalaBoard.java:72–324 — super(new BaseGraphFunction{...}, ...)
    // The complex anonymous GraphFunction that builds the mancala graph is
    // captured here as a descriptor; actual graph construction is handled by the
    // 1:1 engine via named-tilings / MancalaBoard specialisation.
    super(
      makeMancalaGraphFn(rows, columns, store, numStores),
      track,
      tracks,
      null,
      null,
      "Vertex",    // @java MancalaBoard.java:324 — SiteType.Vertex
      largeStack,
    );

    // @java MancalaBoard.java:327–331 — store parameters
    this.numRows    = rows;
    this.numColumns = columns;
    this.storeType  = (store === null) ? "Outer" : store;
    this.numStore   = (numStores === null) ? 2 : numStores;

    // @java MancalaBoard.java:333–334 — row count validation
    if (rows > 6 || rows < 2)
      throw new Error("Board: Only 2 to 6 rows are supported for the Mancala board.");

    // @java MancalaBoard.java:336–341 — track exclusivity check
    let numNonNull = 0;
    if (track  !== null) numNonNull++;
    if (tracks !== null) numNonNull++;
    if (numNonNull > 1)
      throw new Error("Board: Only one of `track' or `tracks' can be non-null.");

    if (rows === 2 && hasTrackDirection(track, tracks, "1,E,N,W"))
      throw new Error("MancalaBoard: faithful two-row 1,E,N,W track route is not replay-safe yet.");
  }

  /** @java MancalaBoard.numRows() */
  public getNumRows(): number { return this.numRows; }

  /** @java MancalaBoard.numColumns() */
  public getNumColumns(): number { return this.numColumns; }

  /** @java MancalaBoard.storeType() */
  public getStoreType(): StoreType { return this.storeType; }

  /** @java MancalaBoard.numStore() */
  public getNumStore(): number { return this.numStore; }

  /** @java MancalaBoard.toEnglish(Game) */
  public toEnglish(_game: unknown): string {
    let s = this.numRows + " x " + this.numColumns + " Mancala board";
    if (this.numStore > 0)
      s += " with " + this.numStore + " " + this.storeType.toLowerCase() + " stores";
    return s;
  }
}

function hasTrackDirection(
  track: TrackDescriptor | null,
  tracks: TrackDescriptor[] | null,
  direction: string,
): boolean {
  const all = tracks ?? (track !== null ? [track] : []);
  return all.some((t) => (t as unknown as { trackDirection?: string | null }).trackDirection === direction);
}

/**
 * Creates a stub GraphFunction encoding the Mancala board parameters.
 * The Board constructor requires a GraphFunction; the 1:1 engine handles
 * actual graph construction.
 *
 * @java MancalaBoard.java:72–324 — anonymous BaseGraphFunction
 */
function makeMancalaGraphFn(
  rows: number,
  columns: number,
  store: StoreType | null,
  numStores: number | null,
): import("../Board.js").GraphFunction {
  return {
    eval(_context: unknown, _siteType: unknown): unknown {
      const spec = buildMancalaGraph(rows, columns, (store ?? "Outer") !== "None");
      if (!spec) return null;
      return spec.graph;
    },
    gameFlags(_game: unknown): bigint { return 0n; },
    preprocess(_game: unknown): void { /* no-op */ },
    // Expose parameters for consumers.
    mancalaRows: rows,
    mancalaColumns: columns,
    mancalaStoreType: (store === null) ? "Outer" : store,
    mancalaNumStores: (numStores === null) ? 2 : numStores,
  } as unknown as import("../Board.js").GraphFunction;
}
