// @java ViewController/src/view/component/custom/ExtendedXiangqiStyle.java

/**
 * Implementation of extended Xiangqi piece style.
 * Used for games where the Xiangqi characters are drawn on top of blank SVGs
 * (e.g. Qi Guo Xiangxi).
 *
 * @author matthew.stephenson (Java original)
 * @java view.component.custom.ExtendedXiangqiStyle
 */

import { Color, Font, PLAIN } from '../../../../../awt/index.js';
import { AffineTransform } from '../../../../../awt/index.js';
import type { SVGGraphics2D } from '../../../../../awt/index.js';
import { ImageUtil } from '../../../../../Common/src/graphics/ImageUtil.js';
import type { Bridge } from '../../../bridge/Bridge.js';
import type { Component } from '../../../../../../ludemes/game/equipment/component/Component.js';
import type { Context } from '../../../../../../ludemes/other/context/Context.js';

// ---------------------------------------------------------------------------
// Escape hatches for batch-18 deps (PieceStyle, XiangqiType) not yet ported.
// ---------------------------------------------------------------------------

/** @java view.component.custom.types.XiangqiType */
interface XiangqiTypeEntry {
  englishName(): string;
  kanji(): string;
  romaji(): string;
  name(): string;
}

// Minimal abstract base standing in for PieceStyle (batch 18).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PieceStyleBase: any = class {
  protected svgName: string = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(..._args: any[]) { /* batch-18 shim */ }
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

// Minimal XiangqiType values shim.  Will be replaced once batch 18 lands.
/** @java view.component.custom.types.XiangqiType */
function getXiangqiTypeValues(): XiangqiTypeEntry[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const mod = require('./types/XiangqiType.js') as { XiangqiType?: { values(): XiangqiTypeEntry[] } };
    if (mod.XiangqiType && typeof mod.XiangqiType.values === 'function') {
      return mod.XiangqiType.values();
    }
  } catch (_) { /* not yet ported */ }
  return [];
}

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

export class ExtendedXiangqiStyle extends PieceStyleBase {

  /**
   * @java view.component.custom.ExtendedXiangqiStyle#ExtendedXiangqiStyle(Bridge, Component)
   */
  constructor(bridge: Bridge, component: Component) {
    super(bridge, component);
  }

  // --------------------------------------------------------------------------

  /**
   * Returns an SVG image from the given file path, overlaying the matching
   * Xiangqi kanji character(s) on top of a disc SVG.
   *
   * @java view.component.custom.ExtendedXiangqiStyle#getSVGImageFromFilePath
   */
  protected getSVGImageFromFilePath(
    g2dOriginal: SVGGraphics2D,
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
    const outlinePath = ImageUtil.getImageFullPath('disc') ?? 'disc';
    let g2d = super.getSVGImageFromFilePath(
      g2dOriginal, context, imageSize, outlinePath,
      containerIndex, localState, value, hiddenValue, rotation, secondary,
    );
    const g2dSize = g2d.getWidth();
    let valueFont: Font | null = null;

    // Temporarily rotate graphics object so that the drawn text is also
    // rotated correctly.
    const originalTransform: AffineTransform = g2d.getTransform();
    g2d.rotate(rotation * Math.PI / 180, g2dSize / 2, g2dSize / 2);

    const xiangqiValues = getXiangqiTypeValues();
    for (let i = 0; i < xiangqiValues.length; i++) {
      const xv = xiangqiValues[i]!;
      if (
        xv.englishName() === this.svgName ||
        xv.kanji()       === this.svgName ||
        xv.romaji().toLowerCase() === this.svgName.toLowerCase() ||
        xv.name().toLowerCase()   === this.svgName.toLowerCase()
      ) {
        const kanji = xv.kanji();
        if (kanji.length === 1) {
          valueFont = new Font('Arial', PLAIN, Math.floor(g2dSize / 2));
          g2d.setColor(Color.BLACK);
          g2d.setFont(valueFont);

          const rect = stringBounds(valueFont, kanji.charAt(0));
          g2d.drawString(
            kanji.charAt(0),
            Math.floor(g2dSize / 2 - rect.getWidth() / 2),
            Math.floor(g2dSize / 2 + rect.getHeight() / 3),
          );
          break;
        } else if (kanji.length === 2) {
          valueFont = new Font('Arial', PLAIN, Math.floor(g2dSize / 3));
          g2d.setColor(Color.BLACK);
          g2d.setFont(valueFont);

          let rect = stringBounds(valueFont, kanji.charAt(0));
          g2d.drawString(
            kanji.charAt(0),
            Math.floor(g2dSize / 2 - rect.getWidth() / 2),
            Math.floor(g2dSize / 2),
          );

          rect = stringBounds(valueFont, kanji.charAt(1));
          g2d.drawString(
            kanji.charAt(1),
            Math.floor(g2dSize / 2 - rect.getWidth() / 2),
            Math.floor(g2dSize / 2 + rect.getHeight() / 1.5),
          );
          break;
        }
      }
    }

    g2d.setTransform(originalTransform);

    // Couldn't find the name you were after; try to find an SVG instead
    // (used to force western style).
    if (valueFont === null) {
      g2d = super.getSVGImageFromFilePath(
        g2dOriginal, context, Math.floor(imageSize / 1.5), filePath,
        containerIndex, localState, value, hiddenValue, rotation, secondary,
      );
    }

    return g2d;
  }

  // --------------------------------------------------------------------------
}
