// @java ViewController/src/view/component/custom/ExtendedShogiStyle.java

/**
 * Implementation of extended Shogi piece style.
 * Used for games where the Shogi characters are drawn on top of blank SVGs
 * (e.g. Taikyoku Shogi).
 *
 * @author matthew.stephenson (Java original)
 * @java view.component.custom.ExtendedShogiStyle
 */

import { Color, Font, PLAIN } from '../../../../../awt/index.js';
import { AffineTransform } from '../../../../../awt/index.js';
import type { SVGGraphics2D } from '../../../../../awt/index.js';
import { ImageUtil } from '../../../../../Common/src/graphics/ImageUtil.js';
import type { Bridge } from '../../../bridge/Bridge.js';
import type { Component } from '../../../../../../ludemes/game/equipment/component/Component.js';
import type { Context } from '../../../../../../ludemes/other/context/Context.js';

// ---------------------------------------------------------------------------
// Escape hatches for batch-18 deps (PieceStyle, ShogiType) not yet ported.
// ---------------------------------------------------------------------------

/** @java view.component.custom.types.ShogiType */
interface ShogiTypeEntry {
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

// Minimal ShogiType values shim.  Will be replaced once batch 18 lands.
/** @java view.component.custom.types.ShogiType */
function getShogiTypeValues(): ShogiTypeEntry[] {
  // Dynamically load from the batch-18 module when available; fall back to [].
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const mod = require('./types/ShogiType.js') as { ShogiType?: { values(): ShogiTypeEntry[] } };
    if (mod.ShogiType && typeof mod.ShogiType.values === 'function') {
      return mod.ShogiType.values();
    }
  } catch (_) { /* not yet ported */ }
  return [];
}

// ---------------------------------------------------------------------------
// Helper: approximate java.awt.Font.getStringBounds() via FontMetrics.
// Returns { width, height } for a single character string with the given font.
// ---------------------------------------------------------------------------
function stringBounds(font: Font, str: string): { getWidth(): number; getHeight(): number } {
  // Approximate: each char is ~0.6 × size wide; height ≈ size.
  const width  = str.length * font.getSize() * 0.6;
  const height = font.getSize() * 1.0;
  return {
    getWidth():  number { return width; },
    getHeight(): number { return height; },
  };
}

// ---------------------------------------------------------------------------

export class ExtendedShogiStyle extends PieceStyleBase {

  /**
   * @java view.component.custom.ExtendedShogiStyle#ExtendedShogiStyle(Bridge, Component)
   */
  constructor(bridge: Bridge, component: Component) {
    super(bridge, component);
  }

  // --------------------------------------------------------------------------

  /**
   * Returns an SVG image from the given file path, overlaying the matching
   * Shogi kanji character(s) on top of a blank Shogi piece outline SVG.
   *
   * @java view.component.custom.ExtendedShogiStyle#getSVGImageFromFilePath
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
    void filePath; // not used — we always load shogi_blank
    const outlinePath = ImageUtil.getImageFullPath('shogi_blank') ?? 'shogi_blank';
    const g2d = super.getSVGImageFromFilePath(
      g2dOriginal, context, imageSize, outlinePath,
      containerIndex, localState, value, hiddenValue, rotation, secondary,
    );
    const g2dSize = g2d.getWidth();

    // Temporarily rotate graphics object so that the drawn text is also
    // rotated correctly.
    const originalTransform: AffineTransform = g2d.getTransform();
    g2d.rotate(rotation * Math.PI / 180, g2dSize / 2, g2dSize / 2);

    const shogiValues = getShogiTypeValues();
    for (let i = 0; i < shogiValues.length; i++) {
      const sv = shogiValues[i]!;
      if (
        sv.englishName() === this.svgName ||
        sv.kanji()       === this.svgName ||
        sv.romaji().toLowerCase() === this.svgName.toLowerCase() ||
        sv.name().toLowerCase()   === this.svgName.toLowerCase()
      ) {
        const valueFont = new Font('Arial', PLAIN, Math.floor(g2dSize / 4));
        g2d.setColor(Color.BLACK);
        g2d.setFont(valueFont);

        const kanji = sv.kanji();
        if (kanji.length === 1) {
          const rect = stringBounds(valueFont, kanji.charAt(0));
          g2d.drawString(
            kanji.charAt(0),
            Math.floor(g2dSize / 2 - rect.getWidth() / 2),
            Math.floor(g2dSize / 2 + rect.getHeight() / 2),
          );
          break;
        } else if (kanji.length === 2) {
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
            Math.floor(g2dSize / 2 + rect.getHeight()),
          );
          break;
        } else if (kanji.length === 3) {
          let rect = stringBounds(valueFont, kanji.charAt(0));
          g2d.drawString(
            kanji.charAt(0),
            Math.floor(g2dSize / 2 - rect.getWidth() / 2),
            Math.floor(g2dSize / 2 - rect.getHeight() / 4),
          );

          rect = stringBounds(valueFont, kanji.charAt(1));
          g2d.drawString(
            kanji.charAt(1),
            Math.floor(g2dSize / 2 - rect.getWidth() / 2),
            Math.floor(g2dSize / 2 + rect.getHeight() / 2),
          );

          rect = stringBounds(valueFont, kanji.charAt(2));
          g2d.drawString(
            kanji.charAt(2),
            Math.floor(g2dSize / 2 - rect.getWidth() / 2),
            Math.floor(g2dSize / 2 + rect.getHeight() * 1.3),
          );
          break;
        }
      }
    }

    g2d.setTransform(originalTransform);

    return g2d;
  }

  // --------------------------------------------------------------------------
}
