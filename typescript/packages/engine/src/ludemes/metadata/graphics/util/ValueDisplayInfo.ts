/**
 * ValueDisplayInfo.ts
 *
 * @java metadata/graphics/util/ValueDisplayInfo.java
 *
 * Display information when drawing local states or values on a piece.
 */

import type { ValueLocationType } from "./ValueLocationType.js";

/**
 * @java metadata.graphics.util.ValueDisplayInfo
 */
export class ValueDisplayInfo {
  /** The location to draw the value. */
  private _locationType: ValueLocationType;

  /** Offset the image by the size of the displayed value. */
  private _offsetImage: boolean;

  /** Draw outline around the displayed value. */
  private _valueOutline: boolean;

  /** Scale of drawn value. */
  private _scale: number;

  /** Offset right for drawn value. */
  private _offsetX: number;

  /** Offset down for drawn value. */
  private _offsetY: number;

  /**
   * Default constructor — mirrors Java default constructor.
   * @java ValueDisplayInfo()
   */
  constructor();

  /**
   * @param locationType The location type for the value.
   * @param offsetImage  Offset the image by the size of the displayed value.
   * @param valueOutline Draw outline around the displayed value.
   * @param scale        Scale of drawn value.
   * @param offsetX      Offset right for drawn value.
   * @param offsetY      Offset down for drawn value.
   * @java ValueDisplayInfo(ValueLocationType, boolean, boolean, float, float, float)
   */
  constructor(
    locationType: ValueLocationType,
    offsetImage: boolean,
    valueOutline: boolean,
    scale: number,
    offsetX: number,
    offsetY: number,
  );

  constructor(
    locationType?: ValueLocationType,
    offsetImage?: boolean,
    valueOutline?: boolean,
    scale?: number,
    offsetX?: number,
    offsetY?: number,
  ) {
    this._locationType = locationType ?? "None";
    this._offsetImage = offsetImage ?? false;
    this._valueOutline = valueOutline ?? false;
    this._scale = scale ?? 1.0;
    this._offsetX = offsetX ?? 0;
    this._offsetY = offsetY ?? 0;
  }

  /** @java ValueDisplayInfo.getLocationType() */
  getLocationType(): ValueLocationType {
    return this._locationType;
  }

  /** @java ValueDisplayInfo.isOffsetImage() */
  isOffsetImage(): boolean {
    return this._offsetImage;
  }

  /** @java ValueDisplayInfo.isValueOutline() */
  isValueOutline(): boolean {
    return this._valueOutline;
  }

  /** @java ValueDisplayInfo.scale() */
  scale(): number {
    return this._scale;
  }

  /** @java ValueDisplayInfo.offsetX() */
  offsetX(): number {
    return this._offsetX;
  }

  /** @java ValueDisplayInfo.offsetY() */
  offsetY(): number {
    return this._offsetY;
  }
}
