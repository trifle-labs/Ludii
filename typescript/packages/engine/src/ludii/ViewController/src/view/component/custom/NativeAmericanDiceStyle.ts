// @java ViewController/src/view/component/custom/NativeAmericanDiceStyle.java

/**
 * Implementation of the Native American Dice style.
 * Used for games which use special styles for dice, mostly native american games (e.g. Kints).
 *
 * Faithful 1:1 port of view.component.custom.NativeAmericanDiceStyle.
 *
 * @author matthew.stephenson (Java original)
 * @java view.component.custom.NativeAmericanDiceStyle
 */

import { Color, Rectangle, SVGGraphics2D } from '../../../../../awt/index.js';
import type { Bridge } from '../../../bridge/Bridge.js';
import type { Component } from '../../../../../../ludemes/game/equipment/component/Component.js';
import type { Context } from '../../../../../../ludemes/other/context/Context.js';
import { DieStyle } from './DieStyle.js';
import { NativeAmericanDiceType } from './types/NativeAmericanDiceType.js';

// ---------------------------------------------------------------------------

/**
 * @java view.component.custom.NativeAmericanDiceStyle
 */
export class NativeAmericanDiceStyle extends DieStyle {

  /**
   * @java NativeAmericanDiceStyle#NativeAmericanDiceStyle(Bridge, Component)
   */
  constructor(bridge: Bridge, component: Component) {
    super(bridge, component);
    this.setDefaultDiceDesign();
  }

  // -------------------------------------------------------------------------

  /**
   * @java NativeAmericanDiceStyle#getSVGImageFromFilePath
   */
  protected override getSVGImageFromFilePath(
    g2d: SVGGraphics2D,
    _context: Context,
    imageSize: number,
    _filePath: string | null,
    _containerIndex: number,
    localState: number,
    _value: number,
    _hiddenValue: number,
    _rotation: number,
    _secondary: boolean,
  ): SVGGraphics2D {
    // Rectangle that defines the position and size of the rectangle background.
    const rect = new Rectangle(
      0,
      Math.floor(imageSize / 5),
      imageSize - Math.floor(imageSize / 7),
      imageSize - Math.floor(imageSize / 3) - Math.floor(imageSize / 5),
    );
    g2d.drawRect(rect.x, rect.y, rect.width, rect.height);

    let nativeAmericanDiceType: NativeAmericanDiceType | null = null;
    for (const t of NativeAmericanDiceType.values()) {
      if (t.englishName() === this.svgName || t.name.toLowerCase() === this.svgName.toLowerCase())
        nativeAmericanDiceType = t;
    }

    if (nativeAmericanDiceType === null) return g2d;

    // Match by identity comparison against the static instances
    if (nativeAmericanDiceType === NativeAmericanDiceType.Patol1) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.drawLine(rect.x + Math.floor(rect.width / 2), rect.y, rect.x,                                rect.y + rect.height);
        g2d.drawLine(rect.x + rect.width,                 rect.y, rect.x + Math.floor(rect.width / 2),   rect.y + rect.height);
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Patol2) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.drawLine(rect.x,                                rect.y, rect.width,                                rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),  rect.y, rect.x,                                    rect.y + rect.height);
        g2d.drawLine(rect.x + rect.width,                   rect.y, rect.x + Math.floor(rect.width / 2),      rect.y + rect.height);
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Notched) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.drawLine(rect.x + Math.floor(rect.width / 5),      rect.y,                     rect.x + Math.floor(rect.width / 5),      rect.y + Math.floor(rect.height / 5));
        g2d.drawLine(rect.x + Math.floor(rect.width / 5 * 2),  rect.y,                     rect.x + Math.floor(rect.width / 5 * 2),  rect.y + Math.floor(rect.height / 5));
        g2d.drawLine(rect.x + Math.floor(rect.width / 5 * 3),  rect.y,                     rect.x + Math.floor(rect.width / 5 * 3),  rect.y + Math.floor(rect.height / 5));
        g2d.drawLine(rect.x + Math.floor(rect.width / 5 * 3),  rect.y + rect.height,       rect.x + Math.floor(rect.width / 5 * 3),  rect.y + rect.height - Math.floor(rect.height / 5));
        g2d.drawLine(rect.x + Math.floor(rect.width / 5 * 4),  rect.y + rect.height,       rect.x + Math.floor(rect.width / 5 * 4),  rect.y + rect.height - Math.floor(rect.height / 5));
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.SetDilth) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),                       rect.y, rect.x + Math.floor(rect.width / 3),                   rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2) + Math.floor(rect.width / 6), rect.y, rect.x + Math.floor(rect.width / 2),              rect.y + rect.height);
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Nebakuthana1) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.setColor(Color.RED);
        g2d.drawPolygon(
          [rect.x + Math.floor(rect.width / 10), rect.x + Math.floor(rect.width / 5) + Math.floor(rect.width / 10), rect.x + Math.floor(rect.width / 5)],
          [rect.y, rect.y, rect.y + Math.floor(rect.height / 5)], 3,
        );
        g2d.drawPolygon(
          [rect.x + rect.width - Math.floor(rect.width / 10), rect.x + rect.width - Math.floor(rect.width / 5) - Math.floor(rect.width / 10), rect.x + rect.width - Math.floor(rect.width / 5)],
          [rect.y, rect.y, rect.y + Math.floor(rect.height / 5)], 3,
        );
        g2d.drawPolygon(
          [rect.x + Math.floor(rect.width / 10), rect.x + Math.floor(rect.width / 5) + Math.floor(rect.width / 10), rect.x + Math.floor(rect.width / 5)],
          [rect.y + rect.height, rect.y + rect.height, rect.y + rect.height - Math.floor(rect.height / 5)], 3,
        );
        g2d.drawPolygon(
          [rect.x + rect.width - Math.floor(rect.width / 10), rect.x + rect.width - Math.floor(rect.width / 5) - Math.floor(rect.width / 10), rect.x + rect.width - Math.floor(rect.width / 5)],
          [rect.y + rect.height, rect.y + rect.height, rect.y + rect.height - Math.floor(rect.height / 5)], 3,
        );
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Nebakuthana2) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.setColor(Color.RED);
        g2d.drawLine(rect.x,                                  rect.y + Math.floor(rect.height / 2), rect.x + rect.width,                              rect.y + Math.floor(rect.height / 2));
        g2d.drawLine(rect.x + Math.floor(rect.width / 3),     rect.y,                               rect.x + Math.floor(rect.width / 3 * 2),          rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 3),     rect.y + rect.height,                 rect.x + Math.floor(rect.width / 3 * 2),          rect.y);
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Nebakuthana3) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.setColor(Color.RED);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2), rect.y + Math.floor(rect.height / 2), rect.x + Math.floor(rect.width / 2), rect.y + Math.floor(rect.height / 2));
        g2d.drawPolygon(
          [rect.x + Math.floor(rect.width / 2), rect.x + Math.floor(rect.width / 3), rect.x + Math.floor(rect.width / 2), rect.x + Math.floor(rect.width / 3 * 2)],
          [rect.y + Math.floor(rect.height / 10), rect.y + Math.floor(rect.height / 2), rect.y + rect.height - Math.floor(rect.height / 10), rect.y + Math.floor(rect.height / 2)],
          4,
        );
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Nebakuthana4) {
      if (localState === 0) {
        g2d.drawLine(rect.x + Math.floor(rect.width / 8),      rect.y,             rect.x + Math.floor(rect.width / 8),      rect.y + Math.floor(rect.height / 5));
        g2d.drawLine(rect.x + Math.floor(rect.width / 8 * 2),  rect.y,             rect.x + Math.floor(rect.width / 8 * 2),  rect.y + Math.floor(rect.height / 5));
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),      rect.y,             rect.x + Math.floor(rect.width / 2),      rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 8 * 6),  rect.y + rect.height, rect.x + Math.floor(rect.width / 8 * 6), rect.y + rect.height - Math.floor(rect.height / 5));
        g2d.drawLine(rect.x + Math.floor(rect.width / 8 * 7),  rect.y + rect.height, rect.x + Math.floor(rect.width / 8 * 7), rect.y + rect.height - Math.floor(rect.height / 5));
      } else if (localState === 1) {
        g2d.setColor(Color.GREEN);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),                        rect.y + Math.floor(rect.height / 2), rect.x + Math.floor(rect.width / 4),                  rect.y + Math.floor(rect.height / 2));
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),                        rect.y + Math.floor(rect.height / 2), rect.x + Math.floor(rect.width / 2) + Math.floor(rect.width / 4), rect.y + Math.floor(rect.height / 2));
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),                        rect.y + Math.floor(rect.height / 2), rect.x + Math.floor(rect.width / 2),                  rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),                        rect.y + Math.floor(rect.height / 2), rect.x + Math.floor(rect.width / 2),                  rect.y);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),                        rect.y + Math.floor(rect.height / 2), rect.x + Math.floor(rect.width / 4),                  rect.y);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),                        rect.y + Math.floor(rect.height / 2), rect.x + Math.floor(rect.width / 2) + Math.floor(rect.width / 4), rect.y);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),                        rect.y + Math.floor(rect.height / 2), rect.x + Math.floor(rect.width / 2) + Math.floor(rect.width / 4), rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),                        rect.y + Math.floor(rect.height / 2), rect.x + Math.floor(rect.width / 4),                  rect.y + rect.height);
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Kints1) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.drawLine(rect.x,                                     rect.y,                rect.x + Math.floor(rect.width / 6),       rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 3),        rect.y,                rect.x + Math.floor(rect.width / 6),       rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 3),        rect.y,                rect.x + Math.floor(rect.width / 2),       rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 3 * 2),    rect.y,                rect.x + Math.floor(rect.width / 2),       rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 3 * 2),    rect.y,                rect.x + Math.floor(rect.width / 6 * 5),   rect.y + rect.height);
        g2d.drawLine(rect.x + rect.width,                         rect.y,                rect.x + Math.floor(rect.width / 6 * 5),   rect.y + rect.height);
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Kints2) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.drawLine(rect.x + Math.floor(rect.width / 2) - Math.floor(rect.width / 6),  rect.y, rect.x + Math.floor(rect.width / 2) - Math.floor(rect.width / 6),  rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2) - Math.floor(rect.width / 3),  rect.y, rect.x + Math.floor(rect.width / 2) - Math.floor(rect.width / 3),  rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2) + Math.floor(rect.width / 6),  rect.y, rect.x + Math.floor(rect.width / 2) + Math.floor(rect.width / 6),  rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2) + Math.floor(rect.width / 3),  rect.y, rect.x + Math.floor(rect.width / 2) + Math.floor(rect.width / 3),  rect.y + rect.height);
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Kints3) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.drawLine(rect.x,                                      rect.y + rect.height, rect.x + Math.floor(rect.width / 6),      rect.y);
        g2d.drawLine(rect.x + Math.floor(rect.width / 3),         rect.y + rect.height, rect.x + Math.floor(rect.width / 6),      rect.y);
        g2d.drawLine(rect.x + rect.width,                          rect.y,               rect.x + rect.width - Math.floor(rect.width / 6), rect.y + rect.height);
        g2d.drawLine(rect.x + rect.width - Math.floor(rect.width / 3), rect.y,          rect.x + rect.width - Math.floor(rect.width / 6), rect.y + rect.height);
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Kints4) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.drawLine(rect.x + Math.floor(rect.width / 3),     rect.y,              rect.x + Math.floor(rect.width / 3 * 2), rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 3),     rect.y + rect.height, rect.x + Math.floor(rect.width / 3 * 2), rect.y);
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Kolica1) {
      if (localState === 1) { /* blank */ }
      else if (localState === 0) {
        g2d.drawPolygon(
          [rect.x + Math.floor(rect.width / 10), rect.x + Math.floor(rect.width / 5) + Math.floor(rect.width / 10), rect.x + Math.floor(rect.width / 5)],
          [rect.y, rect.y, rect.y + Math.floor(rect.height / 5)], 3,
        );
        g2d.drawPolygon(
          [rect.x + rect.width - Math.floor(rect.width / 10), rect.x + rect.width - Math.floor(rect.width / 5) - Math.floor(rect.width / 10), rect.x + rect.width - Math.floor(rect.width / 5)],
          [rect.y, rect.y, rect.y + Math.floor(rect.height / 5)], 3,
        );
        g2d.drawPolygon(
          [rect.x + Math.floor(rect.width / 10), rect.x + Math.floor(rect.width / 5) + Math.floor(rect.width / 10), rect.x + Math.floor(rect.width / 5)],
          [rect.y + rect.height, rect.y + rect.height, rect.y + rect.height - Math.floor(rect.height / 5)], 3,
        );
        g2d.drawPolygon(
          [rect.x + rect.width - Math.floor(rect.width / 10), rect.x + rect.width - Math.floor(rect.width / 5) - Math.floor(rect.width / 10), rect.x + rect.width - Math.floor(rect.width / 5)],
          [rect.y + rect.height, rect.y + rect.height, rect.y + rect.height - Math.floor(rect.height / 5)], 3,
        );
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Kolica2) {
      if (localState === 1) { /* blank */ }
      else if (localState === 0) {
        g2d.drawLine(rect.x,                                  rect.y + Math.floor(rect.height / 2), rect.x + rect.width,                              rect.y + Math.floor(rect.height / 2));
        g2d.drawLine(rect.x + Math.floor(rect.width / 3),     rect.y,                               rect.x + Math.floor(rect.width / 3 * 2),          rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 3),     rect.y + rect.height,                 rect.x + Math.floor(rect.width / 3 * 2),          rect.y);
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Kolica3) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),                        rect.y, rect.x + Math.floor(rect.width / 3),                    rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2) + Math.floor(rect.width / 6), rect.y, rect.x + Math.floor(rect.width / 2),              rect.y + rect.height);
      }
    } else if (nativeAmericanDiceType === NativeAmericanDiceType.Kolica4) {
      if (localState === 0) { /* blank */ }
      else if (localState === 1) {
        g2d.drawLine(rect.x + Math.floor(rect.width / 2),                        rect.y, rect.x + Math.floor(rect.width / 3),                    rect.y + rect.height);
        g2d.drawLine(rect.x + Math.floor(rect.width / 2) + Math.floor(rect.width / 6), rect.y, rect.x + Math.floor(rect.width / 2),              rect.y + rect.height);
      }
    }

    return g2d;
  }

  // -------------------------------------------------------------------------
}
