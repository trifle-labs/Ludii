// @java ViewController/src/view/component/custom/DieStyle.java

/**
 * Implementation of die component style.
 *
 * @author matthew.stephenson (Java original)
 * @java view.component.custom.DieStyle
 */

import { Color, Font, BOLD } from '../../../../../awt/index.js';
import { Point, Point2D } from '../../../../../awt/index.js';
import type { SVGGraphics2D } from '../../../../../awt/index.js';
import type { Graphics2D } from '../../../../../awt/index.js';
import type { Bridge } from '../../../bridge/Bridge.js';
import type { Component } from '../../../../../../ludemes/game/equipment/component/Component.js';
import type { Context } from '../../../../../../ludemes/other/context/Context.js';

// ---------------------------------------------------------------------------
// Escape hatch for PieceStyle (batch 18 — not yet ported).
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PieceStyleBase: any = class {
  protected svgName: string = '';
  protected component: Component;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(bridge: any, component: Component) {
    this.component = component;
    void bridge;
  }
  protected getSVGImageFromFilePath(
    _g2dOriginal: SVGGraphics2D,
    _context: Context,
    _imageSize: number,
    _filePath: string,
    _containerIndex: number,
    _localState: number,
    _value: number,
    _hiddenValue: number,
    _rotation: number,
    _secondary: boolean,
  ): SVGGraphics2D { throw new Error('PieceStyle shim — not yet implemented'); }
};

// ---------------------------------------------------------------------------
// Helper: approximate java.awt.Font.getStringBounds() via size heuristics.
// ---------------------------------------------------------------------------
function stringBounds(font: Font, str: string): { getWidth(): number; getHeight(): number } {
  const width  = str.length * font.getSize() * 0.6;
  const height = font.getSize() * 1.0;
  return {
    getWidth():  number { return width; },
    getHeight(): number { return height; },
  };
}

// ---------------------------------------------------------------------------

export class DieStyle extends PieceStyleBase {

  /**
   * @java view.component.custom.DieStyle#DieStyle(Bridge, Component)
   */
  constructor(bridge: Bridge, component: Component) {
    super(bridge, component);
    this.setDefaultDiceDesign();
  }

  // --------------------------------------------------------------------------

  /**
   * Sets the name of the dice component based on the number of faces it has.
   *
   * @java view.component.custom.DieStyle#setDefaultDiceDesign()
   */
  protected setDefaultDiceDesign(): void {
    const faces = this.component.getNumFaces();
    if (faces === 6 || faces === 10 || faces === 12) {
      this.component.setNameWithoutNumber('square');
    } else if (faces === 4) {
      this.component.setNameWithoutNumber('rectangle');
    } else if (faces === 2) {
      this.component.setNameWithoutNumber('paddle');
    } else {
      this.component.setNameWithoutNumber('triangle');
    }
  }

  // --------------------------------------------------------------------------

  /**
   * @java view.component.custom.DieStyle#getSVGImageFromFilePath
   */
  protected getSVGImageFromFilePath(
    g2d: SVGGraphics2D,
    context: Context,
    imageSize: number,
    filePath: string,
    containerIndex: number,
    localState: number,
    value: number,
    hiddenValue: number,
    rotation: number,
    secondary: boolean,
  ): SVGGraphics2D {
    const diceImage = super.getSVGImageFromFilePath(
      g2d, context, imageSize, filePath,
      containerIndex, localState, value, hiddenValue, rotation, secondary,
    );
    const diceCenter = new Point(
      Math.floor(diceImage.getWidth() / 2),
      Math.floor(diceImage.getHeight() / 2),
    );
    const faces = this.component.getFaces();
    const diceValue = faces[localState] ?? 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graphicsMeta = (context.game().metadata() as any)?.graphics?.();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgMeta: any = graphicsMeta?.pieceForeground?.(
      context, this.component.owner(), this.component.name(),
      containerIndex, localState, value,
    );
    if (!fgMeta || fgMeta.size === 0) {
      this.drawPips(context, diceCenter.x, diceCenter.y, diceValue, imageSize, diceImage);
    }

    return diceImage;
  }

  // --------------------------------------------------------------------------

  /**
   * Draws pips (or a number if too many) on the dice.
   *
   * @java view.component.custom.DieStyle#drawPips
   */
  public drawPips(
    context: Context,
    positionX: number,
    positionY: number,
    pipValue: number,
    imageSize: number,
    g2d: Graphics2D,
  ): void {
    const maxDieValueForPips = 6;
    let pipSpacingMultiplier = 0.8;
    let pipSizeFraction = 0.15;
    let pipTranslation: Point2D = new Point2D.Double(0, 0);

    const svgNameLower = this.svgName.toLowerCase();

    if (svgNameLower === 'triangle') {
      pipSpacingMultiplier = 0.4;
      pipSizeFraction = 0.1;
      pipTranslation = new Point2D.Double(0, 0.15);
    }
    if (svgNameLower === 'rectangle') {
      pipSpacingMultiplier = 0.4;
      pipSizeFraction = 0.1;
    }

    // Draw pips on dice if 6 or fewer pips, unless metadata says otherwise.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const noDicePips: boolean = (context.game().metadata() as any)?.graphics?.()?.noDicePips?.() ?? false;
    if (pipValue <= maxDieValueForPips && !noDicePips) {
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
        default:
          break;
      }

      for (let numPips = 0; numPips < pipPositions.length; numPips++) {
        const pip = pipPositions[numPips]!;
        const pipX = pip.x;
        const pipY = pip.y;

        g2d.setColor(Color.BLACK);
        g2d.fillOval(
          Math.floor(pipX - pipSize / 2),
          Math.floor(pipY - pipSize / 2),
          Math.floor(pipSize),
          Math.floor(pipSize),
        );
      }
    } else {
      // If more than 6 pips, draw the number on the dice instead.
      const valueFont = new Font('Arial', BOLD, Math.floor(imageSize / 3));
      g2d.setColor(Color.BLACK);
      g2d.setFont(valueFont);
      // Approximate Font.getStringBounds() via size heuristics.
      const rect = stringBounds(valueFont, String(pipValue));
      try {
        if (svgNameLower === 'triangle') {
          g2d.drawString(
            String(pipValue),
            Math.floor(positionX - rect.getWidth() / 2),
            Math.floor(positionY + rect.getHeight() / 1.5),
          );
        } else {
          g2d.drawString(
            String(pipValue),
            Math.floor(positionX - rect.getWidth() / 2),
            Math.floor(positionY + rect.getHeight() / 2),
          );
        }
      } catch (_e) {
        // carry on
      }
    }
  }

  // --------------------------------------------------------------------------
}
