/**
 * Specifies customised drawing of edges in the board graph.
 *
 * @java metadata/graphics/show/edges/ShowEdges.java
 *
 * @remarks Useful for graph games to show possible edge moves. Only works for
 * games that use GraphStyle, or a child of GraphStyle (e.g. Pen and Paper style).
 */

import type { RelationType } from "../../../../game/types/board/RelationType.js";
import type { EdgeType } from "../../util/EdgeType.js";
import type { LineStyle } from "../../util/LineStyle.js";
import type { Colour } from "../../util/colour/Colour.js";

/**
 * @java metadata/graphics/show/edges/ShowEdges.java — class ShowEdges implements GraphicsItem
 */
export class ShowEdges {
  /** EdgeType condition to check. */
  readonly type: EdgeType;

  /** RelationType condition to check. */
  readonly relationType: RelationType;

  /** If this concerns cell connections, rather than graph edges. */
  readonly connection: boolean;

  /** Line style of the edge. */
  readonly style: LineStyle;

  /** Colour of the edge. */
  readonly colour: Colour | null;

  constructor(
    type: EdgeType | null,
    relationType: RelationType | null,
    connection: boolean | null,
    style: LineStyle | null,
    colour: Colour | null,
  ) {
    this.type = type !== null ? type : "All";
    this.relationType = relationType !== null ? relationType : "All";
    this.connection = connection === null ? false : connection;
    this.style = style !== null ? style : "ThinDotted";
    // Java default is new Colour(UserColourType.LightGrey); use null here as a sentinel
    this.colour = colour;
  }

  /** @return EdgeType condition to check. */
  edgeType(): EdgeType {
    return this.type;
  }

  /** @return RelationType condition to check. */
  getRelationType(): RelationType {
    return this.relationType;
  }

  /** @return If this concerns cell connections, rather than graph edges. */
  isConnection(): boolean {
    return this.connection;
  }

  /** @return Line style of the edge. */
  getStyle(): LineStyle {
    return this.style;
  }

  /** @return Colour of the edge. */
  getColour(): Colour | null {
    return this.colour;
  }

  needRedraw(): boolean {
    return false;
  }
}
