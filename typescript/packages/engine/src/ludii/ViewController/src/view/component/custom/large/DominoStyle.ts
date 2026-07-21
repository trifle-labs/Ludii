// @java ViewController/src/view/component/custom/large/DominoStyle.java

/**
 * Implementation of domino component style.
 *
 * Faithful 1:1 port of view.component.custom.large.DominoStyle.
 *
 * @author matthew.stephenson (Java original)
 * @java view.component.custom.large.DominoStyle
 */

import {
  Color, Font, BOLD,
  BasicStroke, CAP_BUTT, JOIN_MITER,
  Point, SVGGraphics2D,
} from '../../../../../../awt/index.js';
import { GeneralPath } from '../../../../../../awt/index.js';
import { Point2D } from '../../../../../../awt/index.js';
import type { Bridge } from '../../../../bridge/Bridge.js';
import type { Component } from '../../../../../../../ludemes/game/equipment/component/Component.js';
import type { Context } from '../../../../../../../ludemes/other/context/Context.js';
import { HiddenUtil } from '../../../../util/HiddenUtil.js';
import { LargePieceStyle } from './LargePieceStyle.js';

// Escape-hatch for TIntArrayList (gnu.trove)
type ITIntArrayList = { size(): number; getQuick(i: number): number; get(i: number): number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IBoardForLargePiece = any;

// ---------------------------------------------------------------------------
// Helper: approximate java.awt.Font.getStringBounds() via size heuristics.
// ---------------------------------------------------------------------------
function fontStringBounds(
  font: Font,
  str: string,
): { getWidth(): number; getHeight(): number } {
  const width  = str.length * font.getSize() * 0.6;
  const height = font.getSize() * 1.0;
  return { getWidth: () => width, getHeight: () => height };
}

// ---------------------------------------------------------------------------

/**
 * @java view.component.custom.large.DominoStyle
 */
export class DominoStyle extends LargePieceStyle {

  /**
   * @java DominoStyle#DominoStyle(Bridge, Component)
   */
  constructor(bridge: Bridge, component: Component) {
    super(bridge, component);
  }

  // -------------------------------------------------------------------------

  /**
   * @java DominoStyle#drawLargePieceVisuals
   */
  protected override drawLargePieceVisuals(
    g2dOriginal: SVGGraphics2D,
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
    const g2d = super.drawLargePieceVisuals(
      g2dOriginal, cellLocations, imageSize, imageX, imageY,
      state, value, context, secondary, hiddenValue, rotation,
      boardForLargePiece, containerIndex,
    );

    let currentPoint = new Point2D.Double(0, 0);

    let minCellLocationX = 99999;
    let maxCellLocationX = -99999;
    let minCellLocationY = 99999;
    let maxCellLocationY = -99999;

    const cells = boardForLargePiece.topology().cells();
    for (let i = 0; i < cellLocations.size(); i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cell = cells[cellLocations.get(i)] as any;
      const c = cell?.centroid?.() ?? { x: 0, y: 0, getX: () => 0, getY: () => 0 };
      const cx = c.x ?? c.getX?.() ?? 0;
      const cy = c.y ?? c.getY?.() ?? 0;
      currentPoint = new Point2D.Double(cx, cy);

      if (currentPoint.getX() < minCellLocationX) minCellLocationX = currentPoint.getX();
      if (currentPoint.getX() > maxCellLocationX) maxCellLocationX = currentPoint.getX();
      if (currentPoint.getY() < minCellLocationY) minCellLocationY = currentPoint.getY();
      if (currentPoint.getY() > maxCellLocationY) maxCellLocationY = currentPoint.getY();
    }

    maxCellLocationX -= minCellLocationX;
    minCellLocationX -= minCellLocationX; // 0
    maxCellLocationY -= minCellLocationY;
    minCellLocationY -= minCellLocationY; // 0

    const strokeWidth = Math.floor(imageSize / 5);

    maxCellLocationX = maxCellLocationX + imageSize;
    maxCellLocationY = maxCellLocationY + imageSize;
    g2d.setStroke(new BasicStroke(strokeWidth, CAP_BUTT, JOIN_MITER));
    const path = new GeneralPath();

    // domino outline
    path.moveTo(minCellLocationX + strokeWidth / 2,  minCellLocationY + strokeWidth / 2);
    path.lineTo(minCellLocationX + strokeWidth / 2,  maxCellLocationY - strokeWidth / 2);
    path.lineTo(maxCellLocationX - strokeWidth / 2,  maxCellLocationY - strokeWidth / 2);
    path.lineTo(maxCellLocationX - strokeWidth / 2,  minCellLocationY + strokeWidth / 2);
    path.lineTo(minCellLocationX + strokeWidth / 2,  minCellLocationY + strokeWidth / 2);
    path.closePath();

    const xDistance = maxCellLocationX - minCellLocationX;
    const yDistance = maxCellLocationY - minCellLocationY;

    // domino center line
    if (xDistance > yDistance) {
      path.moveTo(minCellLocationX + xDistance / 2, minCellLocationY);
      path.lineTo(minCellLocationX + xDistance / 2, maxCellLocationY);
    } else {
      path.moveTo(minCellLocationX,              minCellLocationY + yDistance / 2);
      path.lineTo(maxCellLocationX,              minCellLocationY + yDistance / 2);
    }

    g2d.setColor(Color.BLACK);
    g2d.draw(path);

    const dominoSides: Point2D.Double[] = [
      new Point2D.Double(minCellLocationX + imageSize, minCellLocationY + imageSize),
      new Point2D.Double(maxCellLocationX - imageSize, maxCellLocationY - imageSize),
    ];
    const dominoValues: number[] = [0, 0];

    if (state < 2) {
      dominoValues[0] = this.component.getValue();
      dominoValues[1] = this.component.getValue2();
    } else {
      dominoValues[1] = this.component.getValue();
      dominoValues[0] = this.component.getValue2();
    }

    for (let i = 0; i < dominoSides.length; i++) {
      const side = dominoSides[i]!;
      if (!HiddenUtil.intToBitSet(hiddenValue)[HiddenUtil.hiddenWhatIndex]) {
        DominoStyle.drawPips(Math.floor(side.getX()), Math.floor(side.getY()), dominoValues[i] ?? 0, imageSize * 2, g2d);
      } else {
        // If the what of the domino is hidden, draw a question mark.
        const valueFont = new Font('Arial', BOLD, imageSize);
        g2d.setFont(valueFont);
        const rect = fontStringBounds(valueFont, '?');
        g2d.drawString(
          '?',
          Math.floor(side.getX() - rect.getWidth() / 2),
          Math.floor(side.getY() + rect.getHeight() / 3),
        );
      }
    }

    return g2d;
  }

  // -------------------------------------------------------------------------

  /**
   * Draws pips (or number if too many) on the domino.
   * @java DominoStyle#drawPips
   */
  private static drawPips(
    positionX: number,
    positionY: number,
    pipValue: number,
    imageSize: number,
    g2d: SVGGraphics2D,
  ): void {
    const maxDominoValueForPips = 9;
    const pipSpacingMultiplier = 0.8;
    const pipSizeFraction = 0.15;
    const pipTranslation = new Point2D.Double(0, 0);

    if (pipValue <= maxDominoValueForPips) {
      const pipSize = imageSize * pipSizeFraction;
      const dw = Math.floor(imageSize * pipSpacingMultiplier / 2 - pipSize);
      const dh = Math.floor(imageSize * pipSpacingMultiplier / 2 - pipSize);

      const dx = Math.floor(positionX + imageSize * pipTranslation.getX());
      const dy = Math.floor(positionY + imageSize * pipTranslation.getY());

      const pipPositions: Point[] = [];

      switch (pipValue) {
        case 1:
          pipPositions.push(new Point(dx, dy));
          break;
        case 2:
          pipPositions.push(new Point(dx + dw, dy + dh));
          pipPositions.push(new Point(dx - dw, dy - dw));
          break;
        case 3:
          pipPositions.push(new Point(dx, dy));
          pipPositions.push(new Point(dx + dw, dy + dh));
          pipPositions.push(new Point(dx - dw, dy - dw));
          break;
        case 4:
          pipPositions.push(new Point(dx + dw, dy + dh));
          pipPositions.push(new Point(dx - dw, dy - dw));
          pipPositions.push(new Point(dx - dw, dy + dh));
          pipPositions.push(new Point(dx + dw, dy - dw));
          break;
        case 5:
          pipPositions.push(new Point(dx + dw, dy + dh));
          pipPositions.push(new Point(dx - dw, dy - dw));
          pipPositions.push(new Point(dx - dw, dy + dh));
          pipPositions.push(new Point(dx + dw, dy - dw));
          pipPositions.push(new Point(dx, dy));
          break;
        case 6:
          pipPositions.push(new Point(dx + dw, dy + dh));
          pipPositions.push(new Point(dx - dw, dy - dw));
          pipPositions.push(new Point(dx - dw, dy + dh));
          pipPositions.push(new Point(dx + dw, dy - dw));
          pipPositions.push(new Point(dx, dy + dh));
          pipPositions.push(new Point(dx, dy - dw));
          break;
        case 7:
          pipPositions.push(new Point(dx + dw, dy + dh));
          pipPositions.push(new Point(dx - dw, dy - dw));
          pipPositions.push(new Point(dx - dw, dy + dh));
          pipPositions.push(new Point(dx + dw, dy - dw));
          pipPositions.push(new Point(dx, dy + dh));
          pipPositions.push(new Point(dx, dy - dw));
          pipPositions.push(new Point(dx, dy));
          break;
        case 8:
          pipPositions.push(new Point(dx + dw, dy + dh));
          pipPositions.push(new Point(dx - dw, dy - dw));
          pipPositions.push(new Point(dx - dw, dy + dh));
          pipPositions.push(new Point(dx + dw, dy - dw));
          pipPositions.push(new Point(dx, dy + dh));
          pipPositions.push(new Point(dx, dy - dw));
          pipPositions.push(new Point(dx + dw, dy));
          pipPositions.push(new Point(dx - dw, dy));
          break;
        case 9:
          pipPositions.push(new Point(dx + dw, dy + dh));
          pipPositions.push(new Point(dx - dw, dy - dw));
          pipPositions.push(new Point(dx - dw, dy + dh));
          pipPositions.push(new Point(dx + dw, dy - dw));
          pipPositions.push(new Point(dx, dy + dh));
          pipPositions.push(new Point(dx, dy - dw));
          pipPositions.push(new Point(dx + dw, dy));
          pipPositions.push(new Point(dx - dw, dy));
          pipPositions.push(new Point(dx, dy));
          break;
        default:
          break;
      }

      for (let numPips = 0; numPips < pipPositions.length; numPips++) {
        const pip = pipPositions[numPips]!;
        g2d.setColor(Color.BLACK);
        g2d.fillOval(
          Math.floor(pip.x - pipSize / 2),
          Math.floor(pip.y - pipSize / 2),
          Math.floor(pipSize),
          Math.floor(pipSize),
        );
      }
    } else {
      const valueFont = new Font('Arial', BOLD, Math.floor(imageSize / 2));
      g2d.setColor(Color.BLACK);
      g2d.setFont(valueFont);
      const rect = fontStringBounds(valueFont, String(pipValue));
      try {
        g2d.drawString(
          String(pipValue),
          Math.floor(positionX - rect.getWidth() / 2),
          Math.floor(positionY + rect.getHeight() / 2),
        );
      } catch (_e) {
        // carry on
      }
    }
  }

  // -------------------------------------------------------------------------
}
