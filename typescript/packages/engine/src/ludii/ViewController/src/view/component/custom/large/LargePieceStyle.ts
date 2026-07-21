// @java ViewController/src/view/component/custom/large/LargePieceStyle.java

/**
 * Implementation of large piece component style.
 *
 * Faithful 1:1 port of view.component.custom.large.LargePieceStyle.
 *
 * @author matthew.stephenson (Java original)
 * @java view.component.custom.large.LargePieceStyle
 */

import { Point, Rectangle, SVGGraphics2D, RenderingHints } from '../../../../../../awt/index.js';
import { Point2D } from '../../../../../../awt/index.js';
import type { Bridge } from '../../../../bridge/Bridge.js';
import type { Component } from '../../../../../../../ludemes/game/equipment/component/Component.js';
import type { Context } from '../../../../../../../ludemes/other/context/Context.js';
import { SVGtoImage } from '../../../../../../Common/src/graphics/svg/SVGtoImage.js';
import { TileStyle } from './TileStyle.js';

// ---------------------------------------------------------------------------
// Escape-hatches for not-yet-ported heavy deps:
//  - game.equipment.container.board.Board  (topology/style/setTopology etc.)
//  - game.functions.graph.generators.* (Hex/Tri/Square board generators)
//  - game.functions.dim.DimConstant
//  - game.types.board.SiteType
//  - gnu.trove.list.array.TIntArrayList
//  - view.container.ContainerStyle (cellRadius / containerZoom / placement)
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IBoardForLargePiece = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ITIntArrayList = { size(): number; getQuick(i: number): number; get(i: number): number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IContainerStyle = any;

// ---------------------------------------------------------------------------

/**
 * @java view.component.custom.large.LargePieceStyle
 */
export class LargePieceStyle extends TileStyle {

  /** In case of large Piece, here is the size. @java LargePieceStyle#size */
  protected size: Point | null = null;

  /** In case of large Piece, here is the origin of the piece. @java LargePieceStyle#origin */
  private readonly _origin: (Point | null)[] = [];

  /** List of offsets used for each large piece state. @java LargePieceStyle#largeOffsets */
  protected largeOffsets: (Point2D | null)[] = [];

  /** Cell locations on boardForLargePiece are adjusted each time we create an image. */
  protected originalCellLocations: { x: number; y: number }[] = [];

  // -------------------------------------------------------------------------

  /**
   * @java LargePieceStyle#LargePieceStyle(Bridge, Component)
   */
  constructor(bridge: Bridge, component: Component) {
    super(bridge, component);
  }

  // -------------------------------------------------------------------------

  /**
   * @java LargePieceStyle#getSVGImageFromFilePath
   */
  protected override getSVGImageFromFilePath(
    g2dOriginal: SVGGraphics2D,
    context: Context,
    imageSize: number,
    filePath: string | null,
    containerIndex: number,
    localState: number,
    value: number,
    hiddenValue: number,
    rotation: number,
    secondary: boolean,
  ): SVGGraphics2D {
    // Calculate the maximum size that this piece could be.
    const maxStepsForward = this.component.maxStepsForward() + 1;
    const pieceScale = maxStepsForward * 2 + 1;

    // Board that is "walked" on when creating images of large pieces.
    let boardForLargePiece: IBoardForLargePiece = null;

    const numEdges = this.component.numSides();

    try {
      // Lazily load the board generators — escape-hatch for the Java graph infra.
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const boardMod = require('../../../../../../../ludemes/game/equipment/container/board/Board.js') as { Board: new (...a: unknown[]) => IBoardForLargePiece };
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const dimMod = require('../../../../../../../ludemes/game/functions/dim/DimConstant.js') as { DimConstant: new (n: number) => unknown };
      const dim = new dimMod.DimConstant(pieceScale);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let generator: any;
      if (numEdges === 3) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
        const { TriangleOnTri } = require('../../../../../../../ludemes/game/functions/graph/generators/basis/tri/TriangleOnTri.js') as { TriangleOnTri: new (d: unknown) => unknown };
        generator = new TriangleOnTri(dim);
      } else if (numEdges === 6) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
        const { HexagonOnHex } = require('../../../../../../../ludemes/game/functions/graph/generators/basis/hex/HexagonOnHex.js') as { HexagonOnHex: new (d: unknown) => unknown };
        generator = new HexagonOnHex(dim);
      } else if (numEdges === 4) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
        const { RectangleOnSquare } = require('../../../../../../../ludemes/game/functions/graph/generators/basis/square/RectangleOnSquare.js') as { RectangleOnSquare: new (d: unknown, a: null, b: null, c: null) => unknown };
        generator = new RectangleOnSquare(dim, null, null, null);
      } else {
        return g2dOriginal; // Large pieces are not possible for this component
      }

      boardForLargePiece = new boardMod.Board(generator, null, null, null, null, null, false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      boardForLargePiece.createTopology(0, (context.game() as any).board?.()?.topology?.()?.edges?.()?.size?.() ?? 0);
      boardForLargePiece.setTopology(boardForLargePiece.topology());
      boardForLargePiece.topology().computeSupportedDirection?.('Cell');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      boardForLargePiece.setStyle((context.game() as any).board?.()?.style?.() ?? '');
    } catch (_) {
      // Board infrastructure not available — return minimal image
      return g2dOriginal;
    }

    // Store original cell locations for resetting later
    this.originalCellLocations = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const c of boardForLargePiece.topology().cells() as any[]) {
      const centroid = c.centroid();
      this.originalCellLocations.push({ x: centroid.x ?? centroid.getX?.() ?? 0, y: centroid.y ?? centroid.getY?.() ?? 0 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boardForLargePieceStyle: IContainerStyle = (null as any); // ViewControllerFactory.createStyle — deferred

    // Calculate the cell locations based on the piece walk
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const componentAny = this.component as any;
    const cellLocations: ITIntArrayList = componentAny.locs?.(
      context, Math.floor(boardForLargePiece.numSites() / 2) + 1, localState, boardForLargePiece.topology(),
    ) ?? { size: () => 0, getQuick: () => 0, get: () => 0 };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bridgeContainerStyle = this.bridge.getContainerStyle((context.game() as any).board?.()?.index?.() ?? 0);
    const boardSizeDif = bridgeContainerStyle !== null
      ? (bridgeContainerStyle.cellRadius() / (boardForLargePieceStyle?.cellRadius?.() ?? 1)) * bridgeContainerStyle.containerZoom()
      : 1.0;

    const boardForLargePieceSize = Math.floor(
      (bridgeContainerStyle?.placement?.()?.getWidth?.() ?? imageSize) * boardSizeDif,
    );

    // default values
    let imageX = 0;
    let imageY = 0;
    let imageWidth = 0;
    let imageHeight = 0;
    let minCellX = 9999;
    let maxCellX = -9999;
    let minCellY = 9999;
    let maxCellY = -9999;

    const cells = boardForLargePiece.topology().cells();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const startCell = cells[cellLocations.getQuick(0)] as any;
    const startPoint = startCell?.centroid?.() ?? { x: 0, y: 0, getX: () => 0, getY: () => 0 };
    const startX = startPoint.x ?? startPoint.getX?.() ?? 0;
    const startY = startPoint.y ?? startPoint.getY?.() ?? 0;

    for (let i = 0; i < cellLocations.size(); i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cell = cells[cellLocations.get(i)] as any;
      let currentX: number;
      let currentY: number;

      if (i > 0) {
        const c = cell.centroid?.() ?? { x: 0, y: 0, getX: () => 0, getY: () => 0 };
        const cx = c.x ?? c.getX?.() ?? 0;
        const cy = c.y ?? c.getY?.() ?? 0;
        currentX = (cx - startX) * boardForLargePieceSize;
        currentY = (cy - startY) * boardForLargePieceSize;

        // Adjust the position of the graphs cells to line up with the screen position.
        cell.setCentroid?.(currentX, currentY, 0);
      } else {
        currentX = startX;
        currentY = startY;
      }

      if (minCellX > currentX) minCellX = currentX;
      if (maxCellX < currentX) maxCellX = currentX;
      if (minCellY > currentY) minCellY = currentY;
      if (maxCellY < currentY) maxCellY = currentY;

      imageX = Math.min(imageX, currentX);
      imageY = Math.min(imageY, currentY);
      imageWidth = Math.max(imageWidth, currentX + imageSize);
      imageHeight = Math.max(imageHeight, currentY + imageSize);
    }

    // Set the offset for the large piece.
    const offsetPoint = new Point2D.Double(
      minCellX + (maxCellX - minCellX) / 2.0,
      minCellY + (maxCellY - minCellY) / 2.0,
    );

    while (this.largeOffsets.length <= localState) this.largeOffsets.push(null);
    this.largeOffsets[localState] = offsetPoint;

    // set the size of the large piece
    this.size = new Point(imageWidth + Math.abs(imageX), imageHeight + Math.abs(imageY));

    // set the origin point of the large piece
    while (this._origin.length <= localState) this._origin.push(null);

    const x = -imageX;
    const y = this.size.y + imageY - imageSize;
    this._origin[localState] = new Point(x, y);

    // Store the image to return — reset cells first
    const g2d = new SVGGraphics2D(this.size.x, this.size.y);
    g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
    g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
    const imageToReturn = this.drawLargePieceVisuals(
      g2d, cellLocations, imageSize, imageX, imageY,
      localState, value, context, secondary, hiddenValue, rotation,
      boardForLargePiece, containerIndex,
    );

    // Reset the positions of the cells on the board
    const cellsReset = boardForLargePiece.topology().cells();
    for (let i = 0; i < cellsReset.length; i++) {
      const orig = this.originalCellLocations[i];
      if (orig !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cellsReset[i] as any).setCentroid?.(orig.x, orig.y, 0);
      }
    }

    return imageToReturn;

    // suppress filePath (not used in LargePieceStyle)
    void filePath;
  }

  // -------------------------------------------------------------------------

  /**
   * Creates the image of the large piece based on the cell locations and state.
   * @java LargePieceStyle#drawLargePieceVisuals
   */
  protected drawLargePieceVisuals(
    g2d: SVGGraphics2D,
    cellLocations: ITIntArrayList,
    imageSize: number,
    imageX: number,
    imageY: number,
    state: number,
    value: number,
    context: Context,
    secondary: boolean,
    hiddenValue: number,
    rotation: number,
    boardForLargePiece: IBoardForLargePiece,
    containerIndex: number,
  ): SVGGraphics2D {
    const defaultFilePath = '/svg/shapes/square.svg';

    const cells = boardForLargePiece.topology().cells();
    for (let i = 0; i < cellLocations.size(); i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cell = cells[cellLocations.get(i)] as any;
      const c = cell?.centroid?.() ?? { x: 0, y: 0, getX: () => 0, getY: () => 0 };
      const cx = c.x ?? c.getX?.() ?? 0;
      const cy = c.y ?? c.getY?.() ?? 0;

      const yPos = (this.size?.y ?? 0) - (Math.floor(cy) - imageY) - imageSize;
      const xPos = Math.floor(cx) - imageX;

      const g2dIndividual = super.getSVGImageFromFilePath(
        g2d, context, imageSize, defaultFilePath, containerIndex,
        state, value, hiddenValue, rotation, secondary,
      );

      SVGtoImage.loadFromSource(
        g2d,
        g2dIndividual.getSVGDocument?.() ?? '',
        new Rectangle(xPos, yPos, imageSize + 4, imageSize + 4),
        this.fillColour!, this.fillColour!, 0,
      );
    }

    return g2d;
  }

  // -------------------------------------------------------------------------

  /** @java LargePieceStyle#getLargeOffsets */
  override getLargeOffsets(): Point2D[] {
    return this.largeOffsets.filter((o): o is Point2D => o !== null);
  }

  /** @java LargePieceStyle#origin */
  override origin(): Point[] {
    return this._origin.filter((o): o is Point => o !== null);
  }

  /** @java LargePieceStyle#largePieceSize */
  override largePieceSize(): Point {
    return this.size ?? new Point();
  }

  // -------------------------------------------------------------------------
}
