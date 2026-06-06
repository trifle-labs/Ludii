/**
 * DeveloperGUI.ts
 * @java ViewController/src/util/DeveloperGUI.java
 *
 * Functions for drawing various graphical aspects which are only intended for developers.
 *
 * @author Matthew.Stephenson
 */

import { Color, BasicStroke, Graphics2D, Point } from '../../../awt/index.js';
import type { SiteType } from '../../../../ludemes/other/topology/TopologyElement.js';
import type { TopologyElement } from '../../../../ludemes/other/topology/TopologyElement.js';
import type { Vertex } from '../../../../ludemes/other/topology/Vertex.js';
import type { Edge } from '../../../../ludemes/other/topology/Edge.js';
import type { Cell } from '../../../../ludemes/other/topology/Cell.js';
import type { Topology } from '../../../../ludemes/other/topology/Topology.js';
import type { DirectionFacing } from '../../../../ludemes/game/util/directions/DirectionFacing.js';

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/**
 * Minimal surface of bridge.Bridge used by DeveloperGUI.
 * @java bridge.Bridge
 */
export interface IBridge {
  settingsVC(): ISettingsVC;
}

/**
 * Minimal surface of util.SettingsVC used by DeveloperGUI.
 * @java util.SettingsVC
 */
export interface ISettingsVC {
  lastClickedSite(): IWorldLocation | null;

  // Cell booleans
  drawNeighboursCells(): boolean;
  drawRadialsCells(): boolean;
  drawDistanceCells(): boolean;
  drawVerticesOfEdges(): boolean;
  drawVerticesOfFaces(): boolean;
  drawEdgesOfFaces(): boolean;
  drawEdgesOfVertices(): boolean;
  drawFacesOfEdges(): boolean;
  drawFacesOfVertices(): boolean;

  // Vertex booleans
  drawNeighboursVertices(): boolean;
  drawRadialsVertices(): boolean;
  drawDistanceVertices(): boolean;

  // Edge booleans
  drawDistanceEdges(): boolean;

  // Pregeneration region booleans — Cells
  drawCornerCells(): boolean;
  drawCornerConcaveCells(): boolean;
  drawCornerConvexCells(): boolean;
  drawMajorCells(): boolean;
  drawMinorCells(): boolean;
  drawOuterCells(): boolean;
  drawPerimeterCells(): boolean;
  drawInnerCells(): boolean;
  drawTopCells(): boolean;
  drawBottomCells(): boolean;
  drawLeftCells(): boolean;
  drawRightCells(): boolean;
  drawCenterCells(): boolean;
  drawPhasesCells(): boolean;
  drawSideCells(): Map<string, boolean>;
  drawColumnsCells(): boolean[];
  drawRowsCells(): boolean[];

  // Pregeneration region booleans — Vertices
  drawCornerVertices(): boolean;
  drawCornerConcaveVertices(): boolean;
  drawCornerConvexVertices(): boolean;
  drawMajorVertices(): boolean;
  drawMinorVertices(): boolean;
  drawOuterVertices(): boolean;
  drawPerimeterVertices(): boolean;
  drawInnerVertices(): boolean;
  drawTopVertices(): boolean;
  drawBottomVertices(): boolean;
  drawLeftVertices(): boolean;
  drawRightVertices(): boolean;
  drawCenterVertices(): boolean;
  drawPhasesVertices(): boolean;
  drawSideVertices(): Map<string, boolean>;
  drawColumnsVertices(): boolean[];
  drawRowsVertices(): boolean[];

  // Pregeneration region booleans — Edges
  drawCornerEdges(): boolean;
  drawCornerConcaveEdges(): boolean;
  drawCornerConvexEdges(): boolean;
  drawMajorEdges(): boolean;
  drawMinorEdges(): boolean;
  drawAxialEdges(): boolean;
  drawHorizontalEdges(): boolean;
  drawVerticalEdges(): boolean;
  drawAngledEdges(): boolean;
  drawSlashEdges(): boolean;
  drawSloshEdges(): boolean;
  drawPerimeterEdges(): boolean;
  drawOuterEdges(): boolean;
  drawInnerEdges(): boolean;
  drawTopEdges(): boolean;
  drawBottomEdges(): boolean;
  drawLeftEdges(): boolean;
  drawRightEdges(): boolean;
  drawCentreEdges(): boolean;
  drawPhasesEdges(): boolean;
  drawSideEdges(): Map<string, boolean>;

  /** @java SettingsVC#displayFont() */
  displayFont(): import('../../../awt/index.js').Font;
}

/**
 * Minimal surface of util.WorldLocation used by DeveloperGUI.
 * @java util.WorldLocation
 */
export interface IWorldLocation {
  site(): number;
  siteType(): SiteType;
}

/**
 * Minimal surface of view.container.ContainerStyle used by DeveloperGUI.
 * @java view.container.ContainerStyle
 */
export interface IContainerStyle {
  cellRadiusPixels(): number;
  screenPosn(posn: { x?: number; y?: number; getX?(): number; getY?(): number }): Point;
  drawnCells(): Cell[];
  drawnVertices(): Vertex[];
}

/**
 * Minimal surface of Context used by DeveloperGUI.
 * @java other.context.Context
 */
export interface IContext {
  board(): { topology(): Topology };
  topology(): Topology;
}

// ---------------------------------------------------------------------------

/**
 * Functions for drawing various graphical aspects which are only intended for developers.
 * @java util.DeveloperGUI
 */
export class DeveloperGUI {

  /**
   * Draw the pre-generated sites of the container.
   * @java DeveloperGUI#drawPregeneration
   */
  public static drawPregeneration(
    bridge: IBridge,
    g2d: Graphics2D,
    context: IContext,
    containerStyle: IContainerStyle,
  ): void {
    try {
      const cellRadiusPixels = containerStyle.cellRadiusPixels();

      if (bridge.settingsVC().lastClickedSite() !== null) {
        const graph: Topology = context.board().topology();
        const lastSite = bridge.settingsVC().lastClickedSite()!;

        if (lastSite.siteType() === 'Cell') {
          if (bridge.settingsVC().drawNeighboursCells()) {
            DeveloperGUI.drawNeighbours(g2d, lastSite.site(), true, containerStyle);
          }
          if (bridge.settingsVC().drawRadialsCells()) {
            DeveloperGUI.drawRadials(bridge, g2d, context, lastSite.site(), containerStyle, 'Cell');
          }
          if (bridge.settingsVC().drawDistanceCells()) {
            DeveloperGUI.drawDistance(bridge, g2d, context, lastSite.site(), lastSite.siteType(), containerStyle);
          }
        }

        if (lastSite.siteType() === 'Vertex') {
          if (bridge.settingsVC().drawNeighboursVertices()) {
            DeveloperGUI.drawNeighbours(g2d, lastSite.site(), false, containerStyle);
          }
          if (bridge.settingsVC().drawRadialsVertices()) {
            DeveloperGUI.drawRadials(bridge, g2d, context, lastSite.site(), containerStyle, 'Vertex');
          }
          if (bridge.settingsVC().drawDistanceVertices()) {
            DeveloperGUI.drawDistance(bridge, g2d, context, lastSite.site(), lastSite.siteType(), containerStyle);
          }
        }

        if (lastSite.siteType() === 'Edge') {
          if (bridge.settingsVC().drawDistanceEdges()) {
            DeveloperGUI.drawDistance(bridge, g2d, context, lastSite.site(), lastSite.siteType(), containerStyle);
          }
        }

        if (bridge.settingsVC().drawVerticesOfEdges() && lastSite.siteType() === 'Edge') {
          for (const v of ((graph.edges()[lastSite.site()] as unknown as { vertices(): Vertex[] }) || { vertices: () => [] as Vertex[] }).vertices()) {
            g2d.setColor(new Color(0, 255, 255, 125));
            const drawPosn = containerStyle.screenPosn(v.centroid());
            g2d.fillOval(drawPosn.x - cellRadiusPixels / 2, drawPosn.y - cellRadiusPixels / 2, cellRadiusPixels, cellRadiusPixels);
          }
        }

        if (bridge.settingsVC().drawVerticesOfFaces() && lastSite.siteType() === 'Cell') {
          for (const v of ((graph.cells()[lastSite.site()] as unknown as { vertices(): Vertex[] }) || { vertices: () => [] as Vertex[] }).vertices()) {
            g2d.setColor(new Color(0, 255, 255, 125));
            const drawPosn = containerStyle.screenPosn(v.centroid());
            g2d.fillOval(drawPosn.x - cellRadiusPixels / 2, drawPosn.y - cellRadiusPixels / 2, cellRadiusPixels, cellRadiusPixels);
          }
        }

        if (bridge.settingsVC().drawEdgesOfFaces() && lastSite.siteType() === 'Cell') {
          for (const e of ((graph.cells()[lastSite.site()] as unknown as { edges(): Edge[] }) || { edges: () => [] as Edge[] }).edges()) {
            g2d.setColor(new Color(0, 255, 255, 125));
            const drawPosn = containerStyle.screenPosn(e.centroid());
            g2d.fillOval(drawPosn.x - cellRadiusPixels / 2, drawPosn.y - cellRadiusPixels / 2, cellRadiusPixels, cellRadiusPixels);
          }
        }

        if (bridge.settingsVC().drawEdgesOfVertices() && lastSite.siteType() === 'Vertex') {
          for (const e of ((graph.vertices()[lastSite.site()] as unknown as { edges(): Edge[] }) || { edges: () => [] as Edge[] }).edges()) {
            g2d.setColor(new Color(0, 255, 255, 125));
            const drawPosn = containerStyle.screenPosn(e.centroid());
            g2d.fillOval(drawPosn.x - cellRadiusPixels / 2, drawPosn.y - cellRadiusPixels / 2, cellRadiusPixels, cellRadiusPixels);
          }
        }

        if (bridge.settingsVC().drawFacesOfEdges() && lastSite.siteType() === 'Edge') {
          for (const c of ((graph.edges()[lastSite.site()] as unknown as { cells(): Cell[] }) || { cells: () => [] as Cell[] }).cells()) {
            g2d.setColor(new Color(0, 255, 255, 125));
            const drawPosn = containerStyle.screenPosn(c.centroid());
            g2d.fillOval(drawPosn.x - cellRadiusPixels / 2, drawPosn.y - cellRadiusPixels / 2, cellRadiusPixels, cellRadiusPixels);
          }
        }

        if (bridge.settingsVC().drawFacesOfVertices() && lastSite.siteType() === 'Vertex') {
          for (const c of ((graph.vertices()[lastSite.site()] as unknown as { cells(): Cell[] }) || { cells: () => [] as Cell[] }).cells()) {
            g2d.setColor(new Color(0, 255, 255, 125));
            const drawPosn = containerStyle.screenPosn(c.centroid());
            g2d.fillOval(drawPosn.x - cellRadiusPixels / 2, drawPosn.y - cellRadiusPixels / 2, cellRadiusPixels, cellRadiusPixels);
          }
        }
      }
    } catch (_E) {
      // something went wrong, probably changed an option or the game.
      return;
    }

    DeveloperGUI.drawPregenerationRegions(bridge, g2d, context, containerStyle);
  }

  // -------------------------------------------------------------------------

  /**
   * Draw the pre-generated regions of the container.
   * @java DeveloperGUI#drawPregenerationRegions
   */
  private static drawPregenerationRegions(
    bridge: IBridge,
    g2d: Graphics2D,
    context: IContext,
    containerStyle: IContainerStyle,
  ): void {
    const graph: Topology = context.board().topology();
    g2d.setStroke(new BasicStroke(2, BasicStroke.CAP_BUTT, BasicStroke.JOIN_ROUND));

    const allGraphElementsToDraw: TopologyElement[] = [];

    // --- Cells ---

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawCornerCells()) {
      for (const v of graph.corners('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 0, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawCornerConcaveCells()) {
      for (const v of graph.cornersConcave('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 0, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawCornerConvexCells()) {
      for (const v of graph.cornersConvex('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 0, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawOuterCells()) {
      for (const v of graph.outer('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawMajorCells()) {
      for (const v of graph.major('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawMinorCells()) {
      for (const v of graph.minor('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawPerimeterCells()) {
      for (const v of graph.perimeter('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawInnerCells()) {
      for (const v of graph.inner('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(127, 0, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawTopCells()) {
      for (const v of graph.top('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 127, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawBottomCells()) {
      for (const v of graph.bottom('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 0, 127, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawLeftCells()) {
      for (const v of graph.left('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawRightCells()) {
      for (const v of graph.right('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 0, 255, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawCenterCells()) {
      for (const v of graph.centre('Cell')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 127, 127, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    if (bridge.settingsVC().drawPhasesCells()) {
      g2d.setColor(new Color(255, 0, 0, 125));
      DeveloperGUI.drawPhase(bridge, g2d, context, 'Cell', containerStyle);
    }

    allGraphElementsToDraw.length = 0;
    for (const [directionFacing, elements] of graph.sides('Cell').entries()) {
      const directionName = (directionFacing as unknown as DirectionFacing).toString();
      if (bridge.settingsVC().drawSideCells().has(directionName) && bridge.settingsVC().drawSideCells().get(directionName)) {
        try {
          for (const c of elements) allGraphElementsToDraw.push(c);
        } catch (_e) {
          // carry on
        }
      }
    }
    g2d.setColor(new Color(255, 50, 50, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    // --- Vertices ---

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawCornerVertices()) {
      for (const v of graph.corners('Vertex')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 0, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawCornerConcaveVertices()) {
      for (const v of graph.cornersConcave('Vertex')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 0, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawCornerConvexVertices()) {
      for (const v of graph.cornersConvex('Vertex')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 0, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawMajorVertices()) {
      for (const v of graph.major('Vertex')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 0, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawMinorVertices()) {
      for (const v of graph.minor('Vertex')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 0, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawPerimeterVertices()) {
      for (const v of graph.perimeter('Vertex')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawOuterVertices()) {
      for (const v of graph.outer('Vertex')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawInnerVertices()) {
      for (const v of graph.inner('Vertex')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(127, 0, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawTopVertices()) {
      for (const v of graph.top('Vertex')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 127, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawBottomVertices()) {
      for (const v of graph.bottom('Vertex')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 0, 127, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawLeftVertices()) {
      for (const v of graph.left('Vertex')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawRightVertices()) {
      for (const v of graph.right('Vertex')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 0, 255, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawCenterVertices()) {
      for (const v of graph.centre('Vertex')) allGraphElementsToDraw.push(v);
    }
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    if (bridge.settingsVC().drawPhasesVertices()) {
      g2d.setColor(new Color(0, 255, 0, 125));
      DeveloperGUI.drawPhase(bridge, g2d, context, 'Vertex', containerStyle);
    }

    allGraphElementsToDraw.length = 0;
    for (const [directionFacing, elements] of graph.sides('Vertex').entries()) {
      const directionName = (directionFacing as unknown as DirectionFacing).toString();
      if (bridge.settingsVC().drawSideVertices().has(directionName) && bridge.settingsVC().drawSideVertices().get(directionName)) {
        try {
          for (const v of elements) allGraphElementsToDraw.push(v);
        } catch (_e) {
          // carry on
        }
      }
    }
    g2d.setColor(new Color(255, 50, 50, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    {
      const drawColCells = bridge.settingsVC().drawColumnsCells();
      for (let i = 0; i < drawColCells.length; i++) {
        if (drawColCells[i]) {
          try {
            const col = graph.columns('Cell')[i];
            if (col !== undefined) for (const v of col) allGraphElementsToDraw.push(v);
          } catch (_e) {
            // carry on
          }
        }
      }
    }
    g2d.setColor(new Color(0, 255, 255, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    {
      const drawColVertices = bridge.settingsVC().drawColumnsVertices();
      for (let i = 0; i < drawColVertices.length; i++) {
        if (drawColVertices[i]) {
          try {
            const col = graph.columns('Vertex')[i];
            if (col !== undefined) for (const v of col) allGraphElementsToDraw.push(v);
          } catch (_e) {
            // carry on
          }
        }
      }
    }
    g2d.setColor(new Color(0, 255, 255, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    {
      const drawRowCells = bridge.settingsVC().drawRowsCells();
      for (let i = 0; i < drawRowCells.length; i++) {
        if (drawRowCells[i]) {
          try {
            const row = graph.rows('Cell')[i];
            if (row !== undefined) for (const v of row) allGraphElementsToDraw.push(v);
          } catch (_e) {
            // carry on
          }
        }
      }
    }
    g2d.setColor(new Color(0, 255, 255, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    {
      const drawRowVertices = bridge.settingsVC().drawRowsVertices();
      for (let i = 0; i < drawRowVertices.length; i++) {
        if (drawRowVertices[i]) {
          try {
            const row = graph.rows('Vertex')[i];
            if (row !== undefined) for (const v of row) allGraphElementsToDraw.push(v);
          } catch (_e) {
            // carry on
          }
        }
      }
    }
    g2d.setColor(new Color(0, 255, 255, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    // --- Edges ---

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawCornerEdges()) {
      for (const v of graph.corners('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawCornerConcaveEdges()) {
      for (const v of graph.cornersConcave('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawCornerConvexEdges()) {
      for (const v of graph.cornersConvex('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawMajorEdges()) {
      for (const v of graph.major('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawMinorEdges()) {
      for (const v of graph.minor('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawAxialEdges()) {
      for (const v of graph.axial('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawHorizontalEdges()) {
      for (const v of graph.horizontal('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawVerticalEdges()) {
      for (const v of graph.vertical('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawAngledEdges()) {
      for (const v of graph.angled('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawSlashEdges()) {
      for (const v of graph.slash('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawSloshEdges()) {
      for (const v of graph.slosh('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawPerimeterEdges()) {
      for (const v of graph.perimeter('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawOuterEdges()) {
      for (const v of graph.outer('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawInnerEdges()) {
      for (const v of graph.inner('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(127, 0, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawTopEdges()) {
      for (const v of graph.top('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 127, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawBottomEdges()) {
      for (const v of graph.bottom('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(0, 0, 127, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawLeftEdges()) {
      for (const v of graph.left('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 255, 0, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawRightEdges()) {
      for (const v of graph.right('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 0, 255, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    allGraphElementsToDraw.length = 0;
    if (bridge.settingsVC().drawCentreEdges()) {
      for (const v of graph.centre('Edge')) allGraphElementsToDraw.push(v);
    }
    g2d.setColor(new Color(255, 0, 255, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);

    if (bridge.settingsVC().drawPhasesEdges()) {
      g2d.setColor(new Color(0, 0, 255, 125));
      DeveloperGUI.drawPhase(bridge, g2d, context, 'Edge', containerStyle);
    }

    allGraphElementsToDraw.length = 0;
    for (const [directionFacing, elements] of graph.sides('Edge').entries()) {
      const directionName = (directionFacing as unknown as DirectionFacing).toString();
      if (bridge.settingsVC().drawSideEdges().has(directionName) && bridge.settingsVC().drawSideEdges().get(directionName)) {
        try {
          for (const c of elements) allGraphElementsToDraw.push(c);
        } catch (_e) {
          // carry on
        }
      }
    }
    g2d.setColor(new Color(255, 50, 50, 125));
    DeveloperGUI.drawGraphElementList(g2d, allGraphElementsToDraw, containerStyle);
  }

  // -------------------------------------------------------------------------

  /**
   * Draw a circle at each of the specific graph elements in graphElementList.
   * @java DeveloperGUI#drawGraphElementList
   */
  private static drawGraphElementList(
    g2d: Graphics2D,
    graphElementList: TopologyElement[],
    containerStyle: IContainerStyle,
  ): void {
    for (let i = 0; i < graphElementList.length; i++) {
      const elem = graphElementList[i];
      if (elem === undefined) continue;
      const circleSize = 20;
      const drawPosn = containerStyle.screenPosn(elem.centroid());
      g2d.drawOval(drawPosn.x - circleSize / 2, drawPosn.y - circleSize / 2, circleSize, circleSize);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Draws container phases.
   * @java DeveloperGUI#drawPhase
   */
  public static drawPhase(
    bridge: IBridge,
    g2d: Graphics2D,
    context: IContext,
    type: SiteType,
    containerStyle: IContainerStyle,
  ): void {
    try {
      g2d.setFont(bridge.settingsVC().displayFont());

      const phases: TopologyElement[][] = context.topology().phases(type);
      for (let phase = 0; phase < phases.length; phase++) {
        const phaseElems = phases[phase];
        if (phaseElems === undefined) continue;
        for (const elementToPrint of phaseElems) {
          const str = `${phase}`;
          const drawPosn = containerStyle.screenPosn(elementToPrint.centroid());
          g2d.drawString(str, drawPosn.x, drawPosn.y);
        }
      }
    } catch (_E) {
      // probably invalid vertexIndex
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Draws distance from a given site.
   * @java DeveloperGUI#drawDistance
   */
  public static drawDistance(
    bridge: IBridge,
    g2d: Graphics2D,
    context: IContext,
    index: number,
    type: SiteType,
    containerStyle: IContainerStyle,
  ): void {
    try {
      g2d.setFont(bridge.settingsVC().displayFont());

      const element = context.board().topology().getGraphElement(type, index)!;
      const allDistances = context.board().topology().distancesToOtherSite(type);
      const distance = allDistances !== undefined ? allDistances[element.index()] : undefined;
      if (distance === undefined) return;
      for (let i = 0; i < distance.length; i++) {
        const elementToPrint = context.board().topology().getGraphElement(type, i)!;
        const str = `${distance[i]}`;
        const fm = g2d.getFontMetrics();
        const strW = fm.stringWidth(str);
        const strH = fm.getHeight();
        const drawPosn = containerStyle.screenPosn(elementToPrint.centroid());
        g2d.drawString(str, Math.trunc(drawPosn.x - strW), Math.trunc(drawPosn.y + strH));
      }
    } catch (_E) {
      // probably invalid vertexIndex
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Draws radials from a given graph element.
   * @java DeveloperGUI#drawRadials
   */
  public static drawRadials(
    bridge: IBridge,
    g2d: Graphics2D,
    context: IContext,
    indexElem: number,
    containerStyle: IContainerStyle,
    type: SiteType,
  ): void {
    try {
      const topology: Topology = context.board().topology();
      const directions: DirectionFacing[] = topology.supportedDirections(type as any) as any;

      for (const direction of directions) {
        const absDirection = direction.toAbsolute();
        // trajectories() is opaque; cast to access radials()
        const radials: Array<{ steps(): Array<{ id(): number }> }> =
          (topology.trajectories() as any).radials(type, indexElem, absDirection);

        const directionString = direction.toString();

        g2d.setFont(bridge.settingsVC().displayFont());
        g2d.setColor(Color.BLACK);

        for (const radial of radials) {
          for (let dist = 1; dist < radial.steps().length; dist++) {
            const step = radial.steps()[dist];
            if (step === undefined) continue;
            const indexElementRadial = step.id();
            const elementRadial = topology.getGraphElement(type, indexElementRadial)!;
            const label = directionString + dist;
            const fm = g2d.getFontMetrics();
            const strW = fm.stringWidth(label);
            const strH = fm.getHeight();
            const drawPosn = containerStyle.screenPosn(elementRadial.centroid());
            g2d.drawString(
              label,
              Math.trunc(drawPosn.x - strW / 2),
              Math.trunc(drawPosn.y + strH / 2),
            );
          }
        }
      }
    } catch (_E) {
      // probably invalid vertexIndex
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Draws neighbours of a given vertex index.
   * @java DeveloperGUI#drawNeighbours
   */
  public static drawNeighbours(
    g2d: Graphics2D,
    vertexIndex: number,
    drawCells: boolean,
    containerStyle: IContainerStyle,
  ): void {
    try {
      let adjacentNeighbours: TopologyElement[] = [];
      let orthogonalNeighbours: TopologyElement[] = [];
      let secondaryNeighbours: TopologyElement[] = [];
      let diagonalNeighbours: TopologyElement[] = [];

      if (drawCells) {
        const cell = containerStyle.drawnCells()[vertexIndex];
        adjacentNeighbours = (cell as unknown as { adjacent(): TopologyElement[] }).adjacent();
        orthogonalNeighbours = (cell as unknown as { orthogonal(): TopologyElement[] }).orthogonal();
        secondaryNeighbours = (cell as unknown as { off(): TopologyElement[] }).off();
        diagonalNeighbours = (cell as unknown as { diagonal(): TopologyElement[] }).diagonal();
      } else {
        const vertex = containerStyle.drawnVertices()[vertexIndex];
        adjacentNeighbours = (vertex as unknown as { adjacent(): TopologyElement[] }).adjacent();
        orthogonalNeighbours = (vertex as unknown as { orthogonal(): TopologyElement[] }).orthogonal();
        secondaryNeighbours = (vertex as unknown as { off(): TopologyElement[] }).off();
        diagonalNeighbours = (vertex as unknown as { diagonal(): TopologyElement[] }).diagonal();
      }

      const circleSize = containerStyle.cellRadiusPixels();

      if (adjacentNeighbours != null) {
        for (const v of adjacentNeighbours) {
          g2d.setColor(new Color(255, 0, 0, 125));
          const drawPosn = containerStyle.screenPosn(v.centroid());
          g2d.fillOval(drawPosn.x - circleSize / 2, drawPosn.y - circleSize / 2, circleSize, circleSize);
        }
      }

      if (orthogonalNeighbours != null) {
        for (const v of orthogonalNeighbours) {
          g2d.setColor(new Color(0, 255, 0, 125));
          const drawPosn = containerStyle.screenPosn(v.centroid());
          g2d.fillOval(drawPosn.x - circleSize / 2, drawPosn.y - circleSize / 2, circleSize, circleSize);
        }
      }

      if (secondaryNeighbours != null) {
        for (const v of secondaryNeighbours) {
          g2d.setColor(new Color(0, 0, 255, 125));
          const drawPosn = containerStyle.screenPosn(v.centroid());
          g2d.fillOval(drawPosn.x - circleSize / 2, drawPosn.y - circleSize / 2, circleSize, circleSize);
        }
      }

      if (diagonalNeighbours != null) {
        for (const v of diagonalNeighbours) {
          g2d.setColor(new Color(0, 255, 255, 125));
          const drawPosn = containerStyle.screenPosn(v.centroid());
          g2d.fillOval(drawPosn.x - circleSize / 2, drawPosn.y - circleSize / 2, circleSize, circleSize);
        }
      }
    } catch (_E) {
      // probably invalid vertexIndex
    }
  }

  // -------------------------------------------------------------------------
}
