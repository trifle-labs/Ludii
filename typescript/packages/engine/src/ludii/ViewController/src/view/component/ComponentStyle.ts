// @java ViewController/src/view/component/ComponentStyle.java

/**
 * Something to be drawn.
 * View part of MVC for equipment.
 *
 * Faithful 1:1 port of view.component.ComponentStyle.
 *
 * @author matthew.stephenson and cambolbro (Java original)
 * @java view.component.ComponentStyle
 */

import type { SVGGraphics2D } from '../../../../awt/index.js';
import type { Color } from '../../../../awt/index.js';
import type { Point } from '../../../../awt/index.js';
import type { Point2D } from '../../../../awt/index.js';
import type { Context } from '../../../../../ludemes/other/context/Context.js';

export interface ComponentStyle {

  /**
   * Sets the (localState specific) image for the component.
   * @java ComponentStyle#renderImageSVG
   */
  renderImageSVG(
    context: Context,
    containerIndex: number,
    imageSize: number,
    localState: number,
    value: number,
    secondary: boolean,
    maskedValue: number,
    rotation: number,
  ): void;

  /**
   * Gets the SVG image for this component for a given localState value.
   * @java ComponentStyle#getImageSVG
   */
  getImageSVG(localState: number): SVGGraphics2D | null;

  // Functions for large pieces
  /** @java ComponentStyle#origin */
  origin(): Point[];

  /** @java ComponentStyle#largePieceSize */
  largePieceSize(): Point;

  /** @java ComponentStyle#getLargeOffsets */
  getLargeOffsets(): Point2D[];

  // Getters
  /** @java ComponentStyle#getSecondaryColour */
  getSecondaryColour(): Color | null;

  /** @java ComponentStyle#scale */
  scale(context: Context, containerIndex: number, localState: number, value: number): number;
}
