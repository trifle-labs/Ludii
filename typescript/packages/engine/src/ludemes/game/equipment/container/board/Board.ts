// @java Core/src/game/equipment/container/board/Board.java

/**
 * Defines a board by its graph, consisting of vertex locations and edge pairs.
 *
 * @java game/equipment/container/board/Board.java
 * @author Eric.Piette and cambolbro
 *
 * @remarks The values range are used for deduction puzzles. The state model for
 *          these puzzles is a Constraint Satisfaction Problem (CSP) model.
 */

import { Container } from "../Container.js";
import type { SiteType } from "../../../../other/action/SiteType.js";
import type { ContainerStyleType } from "../../../../metadata/graphics/util/ContainerStyleType.js";

/** Minimal GraphFunction interface for Board.graphFunction. */
export interface GraphFunction {
  /** @java GraphFunction.eval(Context, SiteType) */
  eval(context: unknown, siteType: SiteType): unknown;
  /** @java BaseLudeme.gameFlags(Game) */
  gameFlags(game: unknown): bigint;
  /** @java BaseLudeme.preprocess(Game) */
  preprocess(game: unknown): void;
}

/** Minimal Range interface used for deduction puzzle ranges. */
export interface Range {
  min(ctx: unknown): number;
  max(ctx: unknown): number;
}

/** Minimal Track-like interface for Board's track list. */
export interface TrackDescriptor {
  name(): string;
  owner(): number;
  islooped(): boolean;
}

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Board — the main playing surface defined by a graph function.
 *
 * @java game/equipment/container/board/Board.java — class Board extends Container
 */
export class Board extends Container {
  /** @java Board.graph — built by init() */
  protected graph: unknown = null;

  /** @java Board.graphFunction */
  private readonly graphFunction: GraphFunction;

  /** @java Board.edgeRange */
  private edgeRange: Range | null = null;

  /** @java Board.cellRange */
  private cellRange: Range | null = null;

  /** @java Board.vertexRange */
  private vertexRange: Range | null = null;

  /** @java Board.largeStack */
  private readonly largeStack: boolean;

  /**
   * @java game/equipment/container/board/Board.java constructor
   *
   * @param graphFn      The graph function used to build the board.
   * @param track        A single track on the board.
   * @param tracks       Multiple tracks on the board.
   * @param values       A single Values range entry for a deduction puzzle.
   * @param valuesArray  Multiple Values range entries for a deduction puzzle.
   * @param use          Graph element type to use by default [Cell].
   * @param largeStack   True if the game can involve stacks higher than 32.
   */
  public constructor(
    graphFn: GraphFunction,
    track: TrackDescriptor | null,
    tracks: TrackDescriptor[] | null,
    values: { type(): SiteType; range(): Range } | null,
    valuesArray: { type(): SiteType; range(): Range }[] | null,
    use: SiteType | null,
    largeStack: boolean | null,
  ) {
    // @java Board.java:92 — super("Board", Constants.UNDEFINED, RoleType.Neutral)
    super("Board", UNDEFINED, "Neutral");

    // @java Board.java:94–101 — track/tracks exclusivity check
    let numNonNull = 0;
    if (track !== null) numNonNull++;
    if (tracks !== null) numNonNull++;
    if (numNonNull > 1)
      throw new Error("Board: Only one of `track' or `tracks' can be non-null.");

    // @java Board.java:103–110 — values/valuesArray exclusivity check
    let valuesNonNull = 0;
    if (values !== null) valuesNonNull++;
    if (valuesArray !== null) valuesNonNull++;
    if (valuesNonNull > 1)
      throw new Error("Board(): Only one of `values' or `valuesArray' parameter can be non-null.");

    // @java Board.java:112–113
    this.defaultSite = (use === null) ? "Cell" : use;
    this.graphFunction = graphFn;

    // @java Board.java:115–158
    if (valuesNonNull === 1) {
      // Deduction puzzle path
      const valuesLocal: { type(): SiteType; range(): Range }[] =
        (valuesArray !== null) ? valuesArray : [values!];

      for (const valuesGraphElement of valuesLocal) {
        switch (valuesGraphElement.type()) {
          case "Cell":
            this.cellRange = valuesGraphElement.range();
            break;
          case "Edge":
            this.edgeRange = valuesGraphElement.range();
            break;
          case "Vertex":
            this.vertexRange = valuesGraphElement.range();
            break;
        }
      }

      // @java Board.java:135–143 — default zero-ranges
      if (this.vertexRange === null) this.vertexRange = makeZeroRange();
      if (this.edgeRange   === null) this.edgeRange   = makeZeroRange();
      if (this.cellRange   === null) this.cellRange   = makeZeroRange();

      // @java Board.java:144
      this.style = "Puzzle";
    } else {
      // Normal board path
      // @java Board.java:148–152
      if (tracks !== null) {
        for (const t of tracks) this.tracks.push(t);
      } else if (track !== null) {
        this.tracks.push(track);
      }

      // @java Board.java:154–157
      if (this.defaultSite === "Vertex" || this.defaultSite === "Edge")
        this.style = "Graph";
      else
        this.style = "Board";
    }

    // @java Board.java:160
    this.largeStack = (largeStack === null) ? false : largeStack;
  }

  // @java Board.java:167–170 — graph()
  /** @java Board.graph() */
  public getGraph(): unknown { return this.graph; }

  /** @java Board.largeStack() */
  public isLargeStack(): boolean { return this.largeStack; }

  /** @java Board.vertexRange() */
  public getVertexRange(): Range | null { return this.vertexRange; }

  /** @java Board.edgeRange() */
  public getEdgeRange(): Range | null { return this.edgeRange; }

  /** @java Board.cellRange() */
  public getCellRange(): Range | null { return this.cellRange; }

  /**
   * @java Board.getRange(SiteType)
   */
  public getRange(type: SiteType): Range | null {
    switch (type) {
      case "Vertex": return this.getVertexRange();
      case "Cell":   return this.getCellRange();
      case "Edge":   return this.getEdgeRange();
    }
    return null;
  }

  /**
   * @java Board.createTopology(int, int) — builds graph and fills topology.
   * In the TS port this is a no-op at the class level (topology handled by
   * the 1:1 engine via Board1to1); subclasses may override.
   */
  public createTopology(_beginIndex: number, _numEdges: number): void {
    // No-op: the 1:1 path uses Board1to1 for actual topology construction.
    // Subclass overrides (SurakartaBoard) call super then extend tracks.
  }

  /** @java Board.isBoardless() — always false for a plain Board */
  public override isBoardless(): boolean { return false; }
}

/** Helper: a range that is always [0..0]. */
function makeZeroRange(): Range {
  return { min: () => 0, max: () => 0 };
}
