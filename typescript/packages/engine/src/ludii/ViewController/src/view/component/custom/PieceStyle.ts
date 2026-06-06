// @java ViewController/src/view/component/custom/PieceStyle.java

/**
 * Implementation of regular piece style, no additional code from the base component style.
 *
 * Faithful 1:1 port of view.component.custom.PieceStyle.
 *
 * @author matthew.stephenson (Java original)
 * @java view.component.custom.PieceStyle
 */

import { Color, Font, BOLD, Point, Rectangle } from '../../../../../awt/index.js';
import { SVGGraphics2D } from '../../../../../awt/index.js';
import type { Bridge } from '../../../bridge/Bridge.js';
import type { Component } from '../../../../../../ludemes/game/equipment/component/Component.js';
import type { Context } from '../../../../../../ludemes/other/context/Context.js';
import { ImageConstants } from '../../../../../Common/src/graphics/ImageConstants.js';
import { ImageProcessing } from '../../../../../Common/src/graphics/ImageProcessing.js';
import { SVGtoImage } from '../../../../../Common/src/graphics/svg/SVGtoImage.js';
import { StringUtil } from '../../../util/StringUtil.js';
import { BaseComponentStyle } from '../BaseComponentStyle.js';
import type { ValueDisplayInfo } from '../../../../../../ludemes/metadata/graphics/util/ValueDisplayInfo.js';
import type { ValueLocationType } from '../../../../../../ludemes/metadata/graphics/util/ValueLocationType.js';

// ---------------------------------------------------------------------------
// Helper: approximate java.awt.Font.getStringBounds() via size heuristics.
// Returns a Rectangle2D-like object.
// ---------------------------------------------------------------------------
function fontStringBounds(
  font: Font,
  str: string,
): { getWidth(): number; getHeight(): number } {
  const width  = str.length * font.getSize() * 0.6;
  const height = font.getSize() * 1.0;
  return {
    getWidth():  number { return width; },
    getHeight(): number { return height; },
  };
}

// ---------------------------------------------------------------------------

/**
 * Implementation of regular piece style.
 *
 * @java view.component.custom.PieceStyle
 */
export class PieceStyle extends BaseComponentStyle {

  /**
   * @java PieceStyle#PieceStyle(Bridge, Component)
   */
  constructor(bridge: Bridge, component: Component);
  /**
   * @java PieceStyle#PieceStyle(Bridge, Component, boolean)
   */
  constructor(bridge: Bridge, component: Component, drawStringVisuals: boolean);
  constructor(bridge: Bridge, component: Component, drawStringVisuals?: boolean) {
    super(bridge, component);
    if (drawStringVisuals !== undefined) {
      this.drawStringVisuals = drawStringVisuals;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java PieceStyle#getSVGImageFromFilePath
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
    let g2d = g2dOriginal;

    const scaledImageSizeX = Math.floor(imageSize * this.scaleX);
    const scaledImageSizeY = Math.floor(imageSize * this.scaleY);
    const scaledGraphicsSize = Math.floor(imageSize * this.scale(context, containerIndex, localState, value));

    g2d = this.getBackground(g2d, context, containerIndex, localState, value, imageSize);

    if (filePath !== null) {
      if (filePath !== undefined && ImageConstants.customImageKeywords.includes(filePath)) {
        let posnX = Math.floor((imageSize - scaledImageSizeX) / 2);
        let posnY = Math.floor((imageSize - scaledImageSizeX) / 2);

        // TODO not sure exactly why this needs to be done for scale > 1.0
        if (posnX < 0) posnX = 0;
        if (posnY < 0) posnY = 0;

        if (filePath.toLowerCase() === 'ball' || filePath.toLowerCase() === 'seed') {
          if (scaledImageSizeX > 1)
            ImageProcessing.ballImage(g2d, posnX, posnY, Math.floor(scaledImageSizeX / 2), this.fillColour!);
        } else if (filePath.toLowerCase() === 'marker') {
          if (scaledImageSizeX > 1)
            ImageProcessing.markerImage(g2d, posnX, posnY, Math.floor(scaledImageSizeX / 2), this.fillColour!);
        } else if (filePath.toLowerCase() === 'ring') {
          if (scaledImageSizeX > 1)
            ImageProcessing.ringImage(g2d, posnX, posnY, scaledImageSizeX, this.fillColour!);
        } else if (filePath.toLowerCase() === 'chocolate') {
          if (scaledImageSizeX > 1)
            ImageProcessing.chocolateImage(g2d, scaledImageSizeX, 4, this.fillColour!);
        }
      } else {
        let offsetDistance = 0;
        if (scaledImageSizeX < imageSize)
          offsetDistance = Math.floor((imageSize - scaledImageSizeX) / 2);

        if (this.showValue.isOffsetImage() || this.showLocalState.isOffsetImage()) {
          SVGtoImage.loadFromFilePath(
            g2d, filePath,
            new Rectangle(
              offsetDistance,
              offsetDistance + Math.floor(scaledGraphicsSize * 0.15),
              scaledImageSizeX, scaledImageSizeY,
            ),
            this.edgeColour, this.fillColour!, rotation,
          );
        } else {
          SVGtoImage.loadFromFilePath(
            g2d, filePath,
            new Rectangle(offsetDistance, offsetDistance, scaledImageSizeX, scaledImageSizeY),
            this.edgeColour, this.fillColour!, rotation,
          );
        }
      }
    } else {
      const valueFont = new Font('Arial', BOLD, Math.floor(scaledGraphicsSize * 0.7));
      g2d.setColor(this.fillColour!);
      g2d.setFont(valueFont);
      StringUtil.drawStringAtPoint(
        g2d, this.svgName, null,
        new Point(Math.floor(g2d.getWidth() / 2), Math.floor(g2d.getHeight() / 2)),
        true,
      );
    }

    g2d = this.getForeground(g2d, context, containerIndex, localState, value, imageSize);

    // Draw local state or value on piece
    g2d = this.displayNumberOnPiece(g2d, localState, scaledGraphicsSize, this.showLocalState);
    g2d = this.displayNumberOnPiece(g2d, value, scaledGraphicsSize, this.showValue);

    return g2d;
  }

  // -------------------------------------------------------------------------

  /**
   * Draws the local state or value on the piece if specified in metadata.
   * @java PieceStyle#displayNumberOnPiece
   */
  private displayNumberOnPiece(
    g2d: SVGGraphics2D,
    value: number,
    scaledGraphicsSizeOriginal: number,
    displayInfo: ValueDisplayInfo,
  ): SVGGraphics2D {
    const scaledGraphicsSize = Math.floor(scaledGraphicsSizeOriginal * displayInfo.scale());
    const valueLocation: ValueLocationType = displayInfo.getLocationType();
    const valueOutline: boolean = displayInfo.isValueOutline();
    const offsetX = Math.floor(displayInfo.offsetX() * scaledGraphicsSize);
    const offsetY = Math.floor(displayInfo.offsetY() * scaledGraphicsSize);

    if (value < 0) return g2d;

    const printvalue = String(value);

    // Draw the state/value of the piece in its top left corner.
    if (valueLocation === 'CornerLeft') {
      const valueFontCorner = new Font('Arial', BOLD, Math.floor(scaledGraphicsSize / 4));
      g2d.setColor(this.secondaryColour!);
      g2d.setFont(valueFontCorner);

      const rect = fontStringBounds(valueFontCorner, printvalue);
      if (valueOutline)
        StringUtil.drawStringAtPoint(
          g2d, printvalue, null,
          new Point(
            Math.floor(scaledGraphicsSize * 0.1 + rect.getWidth() / 2) + offsetX,
            Math.floor(rect.getHeight() / 2) + offsetY,
          ),
          true,
        );
      else
        g2d.drawString(printvalue, Math.floor(scaledGraphicsSizeOriginal * 0.1) + offsetX, Math.floor(rect.getHeight()) + offsetY);
    } else if (valueLocation === 'CornerRight') {
      const valueFontCorner = new Font('Arial', BOLD, Math.floor(scaledGraphicsSize / 4));
      g2d.setColor(this.secondaryColour!);
      g2d.setFont(valueFontCorner);

      const rect = fontStringBounds(valueFontCorner, printvalue);
      if (valueOutline)
        StringUtil.drawStringAtPoint(
          g2d, printvalue, null,
          new Point(
            Math.floor(scaledGraphicsSize * 0.9 - rect.getWidth() / 2) + offsetX,
            Math.floor(rect.getHeight() / 2) + offsetY,
          ),
          true,
        );
      else
        g2d.drawString(printvalue, Math.floor(scaledGraphicsSizeOriginal * 0.1) + offsetX, Math.floor(rect.getHeight()) + offsetY);
    } else if (valueLocation === 'Top') {
      // Draw the state/value of the piece above it.
      const valueFontCorner = new Font('Arial', BOLD, Math.floor(scaledGraphicsSize / 4));
      g2d.setColor(this.secondaryColour!);
      g2d.setFont(valueFontCorner);

      const rect = fontStringBounds(valueFontCorner, printvalue);
      if (valueOutline)
        StringUtil.drawStringAtPoint(
          g2d, printvalue, null,
          new Point(
            Math.floor(scaledGraphicsSize * 0.5) + offsetX,
            Math.floor(rect.getHeight() / 1.5) + offsetY,
          ),
          true,
        );
      else
        g2d.drawString(
          printvalue,
          Math.floor(scaledGraphicsSizeOriginal * 0.5 - rect.getWidth() / 2 - 1) + offsetX,
          Math.floor(rect.getHeight()) + offsetY,
        );
    } else if (valueLocation === 'Middle') {
      // Draw the state/value of the piece on top of it.
      const valueFontMiddle = new Font('Arial', BOLD, Math.floor(scaledGraphicsSize / 2));
      g2d.setColor(this.secondaryColour!);
      g2d.setFont(valueFontMiddle);

      const rect = fontStringBounds(valueFontMiddle, printvalue);
      if (valueOutline)
        StringUtil.drawStringAtPoint(
          g2d, printvalue, null,
          new Point(
            Math.floor(scaledGraphicsSize * 0.5) + offsetX,
            Math.floor(scaledGraphicsSize * 0.5) + offsetY,
          ),
          true,
        );
      else
        g2d.drawString(
          printvalue,
          Math.floor(scaledGraphicsSizeOriginal * 0.5 - rect.getWidth() / 2 - 1) + offsetX,
          Math.floor(scaledGraphicsSizeOriginal * 0.5 + rect.getHeight() / 3 - 1) + offsetY,
        );
    }

    return g2d;
  }

  // -------------------------------------------------------------------------
}
