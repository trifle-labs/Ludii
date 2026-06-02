/**
 * Show.ts
 *
 * @java metadata/graphics/show/Show.java
 *
 * Factory class for creating Show graphics items. Each static `construct`
 * overload mirrors the corresponding Java factory method.
 *
 * This is a GUI rendering-hint class — not evaluated by the engine.
 */

import type { ShowSiteDataType } from "./ShowSiteDataType.js";
import type { ShowSymbolType } from "./ShowSymbolType.js";
import type { ShowLineType } from "./ShowLineType.js";
import type { ShowEdgeType } from "./ShowEdgeType.js";
import type { ShowBooleanType } from "./ShowBooleanType.js";
import type { ShowComponentType } from "./ShowComponentType.js";
import type { ShowComponentDataType } from "./ShowComponentDataType.js";
import type { ShowCheckType } from "./ShowCheckType.js";
import type { ShowScoreType } from "./ShowScoreType.js";
import type { ValueLocationType } from "../util/ValueLocationType.js";
import type { WhenScoreType } from "../util/WhenScoreType.js";
import type { CurveType } from "../util/CurveType.js";
import type { LineStyle } from "../util/LineStyle.js";
import type { HoleType } from "../util/HoleType.js";
import type { EdgeType } from "../util/EdgeType.js";
import type { BoardGraphicsType } from "../util/BoardGraphicsType.js";
import type { Colour } from "../util/colour/Colour.js";
import type { RoleTypeFull } from "../../../game/types/play/RoleType.js";
import type { RelationType } from "../../../game/types/board/RelationType.js";

import { ShowSitesAsHoles } from "./sites/ShowSitesAsHoles.js";
import { ShowSitesIndex } from "./sites/ShowSitesIndex.js";
import { ShowSymbol } from "./symbol/ShowSymbol.js";
import { ShowLine } from "./line/ShowLine.js";
import { ShowEdges } from "./edges/ShowEdges.js";
import { ShowPits } from "./Boolean/ShowPits.js";
import { ShowPlayerHoles } from "./Boolean/ShowPlayerHoles.js";
import { ShowLocalStateHoles } from "./Boolean/ShowLocalStateHoles.js";
import { ShowRegionOwner } from "./Boolean/ShowRegionOwner.js";
import { ShowCost } from "./Boolean/ShowCost.js";
import { ShowEdgeDirections } from "./Boolean/ShowEdgeDirections.js";
import { ShowPossibleMoves } from "./Boolean/ShowPossibleMoves.js";
import { ShowCurvedEdges } from "./Boolean/ShowCurvedEdges.js";
import { ShowStraightEdges } from "./Boolean/ShowStraightEdges.js";
import { ShowPieceState } from "./component/ShowPieceState.js";
import { ShowPieceValue } from "./component/ShowPieceValue.js";
import { ShowCheck } from "./check/ShowCheck.js";
import { ShowScore } from "./score/ShowScore.js";

/** Union of all Show sub-class instances. */
export type ShowItem =
  | ShowSitesAsHoles
  | ShowSitesIndex
  | ShowSymbol
  | ShowLine
  | ShowEdges
  | ShowPits
  | ShowPlayerHoles
  | ShowLocalStateHoles
  | ShowRegionOwner
  | ShowCost
  | ShowEdgeDirections
  | ShowPossibleMoves
  | ShowCurvedEdges
  | ShowStraightEdges
  | ShowPieceState
  | ShowPieceValue
  | ShowCheck
  | ShowScore;

/**
 * @java metadata.graphics.show.Show
 */
export class Show {
  /**
   * Factory: Show holes at given sites.
   * @java Show.construct(ShowSiteDataType, Integer[], HoleType) → ShowSitesAsHoles
   */
  static constructAsHoles(
    _showDataType: ShowSiteDataType,
    indices: number[],
    type: HoleType,
  ): ShowSitesAsHoles {
    return new ShowSitesAsHoles(indices, type);
  }

  /**
   * Factory: Show site indices.
   * @java Show.construct(ShowSiteDataType, SiteType, Integer) → ShowSitesIndex
   */
  static constructSiteIndex(
    _showDataType: ShowSiteDataType,
    type: string | null,
    additionalValue: number | null,
  ): ShowSitesIndex {
    return new ShowSitesIndex(type, additionalValue);
  }

  /**
   * Factory: Show a symbol on sites.
   * @java Show.construct(ShowSymbolType, String, ...) → ShowSymbol
   */
  static constructSymbol(
    _showType: ShowSymbolType,
    imageName: string | null,
    text: string | null,
    region: string | null,
    roleType: string | null,
    graphElementType: string | null,
    sites: number[] | null,
    site: number | null,
    regionFunction: unknown | null,
    boardGraphicsType: BoardGraphicsType | null,
    fillColour: Colour | null,
    edgeColour: Colour | null,
    scale: number | null,
    scaleX: number | null,
    scaleY: number | null,
    rotation: number | null,
    offsetX: number | null,
    offsetY: number | null,
  ): ShowSymbol {
    return new ShowSymbol(
      imageName, text, region, roleType, graphElementType,
      sites, site, regionFunction, boardGraphicsType,
      fillColour, edgeColour, scale, scaleX, scaleY, rotation, offsetX, offsetY,
    );
  }

  /**
   * Factory: Show a line.
   * @java Show.construct(ShowLineType, Integer[][], ...) → ShowLine
   */
  static constructLine(
    _showType: ShowLineType,
    lines: number[][],
    siteType: string | null,
    style: LineStyle | null,
    colour: Colour | null,
    scale: number | null,
    curve: number[] | null,
    curveType: CurveType | null,
  ): ShowLine {
    return new ShowLine(lines, siteType, style, colour, scale, curve, curveType);
  }

  /**
   * Factory: Show edges.
   * @java Show.construct(ShowEdgeType, EdgeType, RelationType, Boolean, LineStyle, Colour) → ShowEdges
   */
  static constructEdges(
    _showType: ShowEdgeType,
    type: EdgeType | null,
    relationType: RelationType | null,
    connection: boolean | null,
    style: LineStyle | null,
    colour: Colour | null,
  ): ShowEdges {
    return new ShowEdges(type, relationType, connection, style, colour);
  }

  /**
   * Factory: Show boolean property.
   * @java Show.construct(ShowBooleanType, Boolean) → GraphicsItem
   */
  static constructBoolean(showType: ShowBooleanType, value: boolean | null): ShowItem {
    switch (showType) {
      case "Pits":            return new ShowPits(value);
      case "PlayerHoles":     return new ShowPlayerHoles(value);
      case "LocalStateHoles": return new ShowLocalStateHoles(value);
      case "RegionOwner":     return new ShowRegionOwner(value);
      case "Cost":            return new ShowCost(value);
      case "EdgeDirections":  return new ShowEdgeDirections(value);
      case "PossibleMoves":   return new ShowPossibleMoves(value);
      case "CurvedEdges":     return new ShowCurvedEdges(value);
      case "StraightEdges":   return new ShowStraightEdges(value);
      default:
        throw new Error(`Show.constructBoolean: unimplemented ShowBooleanType "${showType}"`);
    }
  }

  /**
   * Factory: Show piece data.
   * @java Show.construct(ShowComponentType, ShowComponentDataType, ...) → GraphicsItem
   */
  static constructPiece(
    _showType: ShowComponentType,
    showDataType: ShowComponentDataType,
    roleType: RoleTypeFull | null,
    pieceName: string | null,
    location: ValueLocationType | null,
    offsetImage: boolean | null,
    valueOutline: boolean | null,
    scale: number | null,
    offsetX: number | null,
    offsetY: number | null,
  ): ShowPieceState | ShowPieceValue {
    switch (showDataType) {
      case "State":
        return new ShowPieceState(roleType, pieceName, location, offsetImage, valueOutline, scale, offsetX, offsetY);
      case "Value":
        return new ShowPieceValue(roleType, pieceName, location, offsetImage, valueOutline, scale, offsetX, offsetY);
      default:
        throw new Error(`Show.constructPiece: unimplemented ShowComponentDataType "${showDataType}"`);
    }
  }

  /**
   * Factory: Show check.
   * @java Show.construct(ShowCheckType, RoleType, String) → ShowCheck
   */
  static constructCheck(
    _showType: ShowCheckType,
    roleType: RoleTypeFull | null,
    pieceName: string | null,
  ): ShowCheck {
    return new ShowCheck(roleType, pieceName);
  }

  /**
   * Factory: Show score.
   * @java Show.construct(ShowScoreType, WhenScoreType, RoleType, IntFunction, String) → ShowScore
   */
  static constructScore(
    _showType: ShowScoreType,
    whenScore: WhenScoreType | null,
    roleType: string | null,
    scoreReplacement: unknown | null,
    scoreSuffix: string | null,
  ): ShowScore {
    return new ShowScore(whenScore, roleType, scoreReplacement, scoreSuffix);
  }

  private constructor() {
    // Static factory — not instantiable.
  }
}
