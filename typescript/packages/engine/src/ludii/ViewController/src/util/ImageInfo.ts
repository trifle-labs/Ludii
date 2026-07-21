// @java ViewController/src/util/ImageInfo.java

import { Point } from "../../../awt/index.js";
import type { SiteType } from "../../../../ludemes/other/other/BaseLudemeWithGraphElement.js";
import type { Component } from "../../../../ludemes/game/equipment/component/Component.js";

/**
 * Object for storing all relevant information about a component image.
 *
 * Faithful 1:1 port of util.ImageInfo.
 *
 * @author Matthew.Stephenson (Java original)
 */
export class ImageInfo {

  /** World position of image. */
  private readonly _drawPosn: Point;

  /** Image transparency. */
  private readonly _transparency: number;

  /** Image rotation */
  private readonly _rotation: number;

  /** The site (index) of the image. */
  private readonly _site: number;

  /** The level of the image. */
  private readonly _level: number;

  /** The GraphElementType that the image is placed on. */
  private readonly _graphElementType: SiteType;

  /** The component associated with this image. */
  private readonly _component: Component | null;

  /** The local state of the component associated with this image. */
  private readonly _localState: number;

  /** The value of the component associated with this image. */
  private readonly _value: number;

  /** The index of the container where the image is drawn. */
  private readonly _containerIndex: number;

  /** The size of the image (in pixels). */
  private readonly _imageSize: number;

  /** the count for the image (including the minus one if dragged) */
  private readonly _count: number;

  // -------------------------------------------------------------------------

  /**
   * Constructor for specifying all information about image.
   * @java ImageInfo(Point, int, int, SiteType, Component, int, int, double, int, int, int, int)
   *
   * @param drawPosn       World position of image.
   * @param site           The site (index) of the image.
   * @param level          The level of the image.
   * @param graphElementType The GraphElementType that the image is placed on.
   * @param component      The component associated with this image.
   * @param localState     The local state of the component.
   * @param value          The value of the component.
   * @param transparency   Image transparency.
   * @param rotation       Image rotation.
   * @param containerIndex The index of the container where the image is drawn.
   * @param imageSize      The size of the image (in pixels).
   * @param count          The count for the image.
   */
  constructor(
    drawPosn: Point,
    site: number,
    level: number,
    graphElementType: SiteType,
    component?: Component | null,
    localState?: number,
    value?: number,
    transparency?: number,
    rotation?: number,
    containerIndex?: number,
    imageSize?: number,
    count?: number,
  ) {
    this._drawPosn = drawPosn;
    this._site = site;
    this._level = level;
    this._graphElementType = graphElementType;
    this._component = component ?? null;
    this._localState = localState ?? 0;
    this._value = value ?? 0;
    this._transparency = transparency ?? 0;
    this._rotation = rotation ?? 0;
    this._containerIndex = containerIndex ?? 0;
    this._imageSize = imageSize ?? 0;
    this._count = count ?? 0;
  }

  // -------------------------------------------------------------------------

  /** @java ImageInfo#drawPosn() */
  drawPosn(): Point {
    return this._drawPosn;
  }

  /** @java ImageInfo#transparency() */
  transparency(): number {
    return this._transparency;
  }

  /** @java ImageInfo#rotation() */
  rotation(): number {
    return this._rotation;
  }

  /** @java ImageInfo#site() */
  site(): number {
    return this._site;
  }

  /** @java ImageInfo#level() */
  level(): number {
    return this._level;
  }

  /** @java ImageInfo#graphElementType() */
  graphElementType(): SiteType {
    return this._graphElementType;
  }

  /** @java ImageInfo#component() */
  component(): Component | null {
    return this._component;
  }

  /** @java ImageInfo#localState() */
  localState(): number {
    return this._localState;
  }

  /** @java ImageInfo#containerIndex() */
  containerIndex(): number {
    return this._containerIndex;
  }

  /** @java ImageInfo#imageSize() */
  imageSize(): number {
    return this._imageSize;
  }

  /** @java ImageInfo#count() */
  count(): number {
    return this._count;
  }

  /** @java ImageInfo#value() */
  value(): number {
    return this._value;
  }

  // -------------------------------------------------------------------------
}
