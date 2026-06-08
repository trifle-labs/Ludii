/**
 * @java Core/src/game/functions/graph/generators/shape/Repeat.java
 * Repeats specified polygon shape(s) in a rows×columns grid.
 */

import { Graph } from "../../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../../BaseGraphFunction.js";
import type { DimFunction } from "../../../dim/DimFunction.js";
import { Poly } from "../../../../util/graph/Poly.js";

/** A polygon defined by its vertex coordinates. */
export interface RepeatPolygon {
  readonly points: ReadonlyArray<readonly [number, number]>;
}

/**
 * Repeat: tile a polygon (or set of polygons) in a grid.
 * @java game/functions/graph/generators/shape/Repeat.java
 */
export class Repeat extends BaseGraphFunction {
  private readonly rows: number;
  private readonly columns: number;
  /** Step vector to the next column. */
  private readonly stepColumn: readonly [number, number];
  /** Step vector to the next row. */
  private readonly stepRow: readonly [number, number];
  private readonly polygons: ReadonlyArray<RepeatPolygon>;

  /**
   * @java Repeat(DimFunction rows, DimFunction columns, Float[][] step, Poly poly, Poly[] polys)
   */
  constructor(
    rows: DimFunction,
    columns: DimFunction,
    step: ReadonlyArray<ReadonlyArray<number>>,
    poly: Poly | null,
    polys: ReadonlyArray<Poly> | null,
  ) {
    super();
    this.rows = rows.eval();
    this.columns = columns.eval();
    this._dim = [this.rows, this.columns];

    if (step.length < 2 || (step[0]?.length ?? 0) < 2 || (step[1]?.length ?? 0) < 2) {
      console.log("** Repeat: Step should contain two pairs of values.");
      this.stepColumn = [1, 0];
      this.stepRow = [0, 1];
    } else {
      this.stepColumn = [Number(step[0]![0]), Number(step[0]![1])];
      this.stepRow = [Number(step[1]![0]), Number(step[1]![1])];
    }

    if (poly !== null) {
      this.polygons = [toRepeatPolygon(poly)];
    } else {
      this.polygons = (polys ?? []).map(toRepeatPolygon);
    }
  }

  /** @java Repeat.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const graph = new Graph();

    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.columns; col += 1) {
        const refX =
          col * (this.stepColumn[0]) +
          row * (this.stepRow[0]);
        const refY =
          col * (this.stepColumn[1]) +
          row * (this.stepRow[1]);

        for (const polygon of this.polygons) {
          const pts = polygon.points;
          for (let n = 0; n < pts.length; n += 1) {
            const ptA = pts[n] as readonly [number, number];
            const ptB = pts[(n + 1) % pts.length] as readonly [number, number];
            const vA = graph.addVertex(refX + ptA[0], refY + ptA[1]);
            const vB = graph.addVertex(refX + ptB[0], refY + ptB[1]);
            graph.addEdge(vA, vB);
          }
        }
      }
    }

    graph.makeFaces();
    graph.reorder();

    return graph;
  }
}

function toRepeatPolygon(poly: Poly): RepeatPolygon {
  return {
    points: poly.polygon().points().map((point) => [point.x, point.y] as const),
  };
}
