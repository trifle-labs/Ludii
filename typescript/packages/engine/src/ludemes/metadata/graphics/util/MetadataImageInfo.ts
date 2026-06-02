/**
 * MetadataImageInfo.ts
 *
 * @java metadata/graphics/util/MetadataImageInfo.java
 *
 * Generic object for holding various bits of information when applying
 * metadata graphics.
 *
 * Java's java.awt.Color fields are replaced by Colour from the TS port.
 * SiteType and BoardGraphicsType are stored as their TS string union types.
 */

import type { BoardGraphicsType } from "./BoardGraphicsType.js";
import type { CurveType } from "./CurveType.js";
import type { LineStyle } from "./LineStyle.js";

/**
 * @java metadata.graphics.util.MetadataImageInfo
 */
export class MetadataImageInfo {
  /** The vertices to draw a line through. */
  private _line: number[] | null = null;

  /** The site index. */
  private _site: number = -1;

  /** The type of the graph element (string mirror of SiteType). */
  private _siteType: string | null = null;

  /** The image path. */
  private _path: string | null = null;

  /** Text string. */
  private _text: string | null = null;

  /** The image scale along x-axis. */
  private _scaleX: number = 0;

  /** The image scale along y-axis. */
  private _scaleY: number = 0;

  /**
   * The main colour (fill colour).
   * Stored as opaque RGBA record `{ r, g, b, a }` — mirrors Java Color.
   */
  private _mainColour: { r: number; g: number; b: number; a: number } | null = null;

  /**
   * The secondary colour (edge colour).
   * Stored as opaque RGBA record `{ r, g, b, a }`.
   */
  private _secondaryColour: { r: number; g: number; b: number; a: number } | null = null;

  /** The BoardGraphicsType. */
  private _boardGraphicsType: BoardGraphicsType | null = null;

  /** The site type of the region. */
  private _regionSiteType: string | null = null;

  /** The offset distance to the right. */
  private _offestX: number = 0;

  /** The offset distance downwards. */
  private _offestY: number = 0;

  /** The rotation. */
  private _rotation: number = 0;

  /** The curve values. */
  private _curve: number[] | null = null;

  /** The type of curve. */
  private _curveType: CurveType = "Spline";

  /** The line style. */
  private _lineStyle: LineStyle = "Thin";

  //--------------------------------------------------------------------------
  // Constructors — mirroring Java overloads

  /**
   * @java MetadataImageInfo(int site, SiteType element, String path, float scale)
   */
  static forSitePath(
    site: number,
    element: string,
    path: string,
    scale: number,
  ): MetadataImageInfo {
    const m = new MetadataImageInfo();
    m._site = site;
    m._siteType = element;
    m._path = path;
    m._scaleX = scale;
    m._scaleY = scale;
    return m;
  }

  /**
   * @java MetadataImageInfo(Integer[] line, SiteType element, Color mainColour, float scale)
   */
  static forLineColour(
    line: number[],
    element: string,
    mainColour: { r: number; g: number; b: number; a: number } | null,
    scale: number,
  ): MetadataImageInfo {
    const m = new MetadataImageInfo();
    m._line = line.slice();
    m._mainColour = mainColour;
    m._scaleX = scale;
    m._scaleY = scale;
    m._siteType = element;
    return m;
  }

  /**
   * @java MetadataImageInfo(Integer[] line, Color mainColour, float scale, Float[] curve, SiteType siteType, CurveType curveType, LineStyle lineStyle)
   */
  static forLineCurve(
    line: number[],
    mainColour: { r: number; g: number; b: number; a: number } | null,
    scale: number,
    curve: number[] | null,
    siteType: string,
    curveType: CurveType,
    lineStyle: LineStyle,
  ): MetadataImageInfo {
    const m = new MetadataImageInfo();
    m._line = line.slice();
    m._mainColour = mainColour;
    m._scaleX = scale;
    m._scaleY = scale;
    m._curve = curve;
    m._siteType = siteType;
    m._curveType = curveType;
    m._lineStyle = lineStyle;
    return m;
  }

  /**
   * @java MetadataImageInfo(int site, SiteType element, String path, float scale, Color mainColour)
   */
  static forSitePathColour(
    site: number,
    element: string,
    path: string,
    scale: number,
    mainColour: { r: number; g: number; b: number; a: number } | null,
  ): MetadataImageInfo {
    const m = new MetadataImageInfo();
    m._site = site;
    m._siteType = element;
    m._path = path;
    m._scaleX = scale;
    m._scaleY = scale;
    m._mainColour = mainColour;
    return m;
  }

  /**
   * @java MetadataImageInfo(int site, SiteType element, BoardGraphicsType boardGraphicsType, Color mainColour)
   */
  static forSiteBoardGraphics(
    site: number,
    element: string,
    boardGraphicsType: BoardGraphicsType,
    mainColour: { r: number; g: number; b: number; a: number } | null,
  ): MetadataImageInfo {
    const m = new MetadataImageInfo();
    m._site = site;
    m._siteType = element;
    m._mainColour = mainColour;
    m._boardGraphicsType = boardGraphicsType;
    return m;
  }

  //--------------------------------------------------------------------------
  // Accessors / mutators

  /** @java MetadataImageInfo.scale() — max(scaleX, scaleY) */
  scale(): number {
    return Math.max(this._scaleX, this._scaleY);
  }

  line(): number[] | null { return this._line; }
  setLine(line: number[]): void { this._line = line; }

  site(): number { return this._site; }
  setSite(site: number): void { this._site = site; }

  siteType(): string | null { return this._siteType; }
  setSiteType(siteType: string | null): void { this._siteType = siteType; }

  path(): string | null { return this._path; }
  setPath(path: string | null): void { this._path = path; }

  text(): string | null { return this._text; }
  setText(text: string | null): void { this._text = text; }

  scaleX(): number { return this._scaleX; }
  setScaleX(scaleX: number): void { this._scaleX = scaleX; }

  scaleY(): number { return this._scaleY; }
  setScaleY(scaleY: number): void { this._scaleY = scaleY; }

  mainColour(): { r: number; g: number; b: number; a: number } | null { return this._mainColour; }
  setMainColour(c: { r: number; g: number; b: number; a: number } | null): void { this._mainColour = c; }

  secondaryColour(): { r: number; g: number; b: number; a: number } | null { return this._secondaryColour; }
  setSecondaryColour(c: { r: number; g: number; b: number; a: number } | null): void { this._secondaryColour = c; }

  boardGraphicsType(): BoardGraphicsType | null { return this._boardGraphicsType; }
  setBoardGraphicsType(t: BoardGraphicsType | null): void { this._boardGraphicsType = t; }

  regionSiteType(): string | null { return this._regionSiteType; }
  setRegionSiteType(t: string | null): void { this._regionSiteType = t; }

  offestX(): number { return this._offestX; }
  setOffestX(x: number): void { this._offestX = x; }

  offestY(): number { return this._offestY; }
  setOffestY(y: number): void { this._offestY = y; }

  rotation(): number { return this._rotation; }
  setRotation(r: number): void { this._rotation = r; }

  curve(): number[] | null { return this._curve; }
  setCurve(c: number[] | null): void { this._curve = c; }

  curveType(): CurveType { return this._curveType; }
  setCurveType(t: CurveType): void { this._curveType = t; }

  lineStyle(): LineStyle { return this._lineStyle; }
  setLineStyle(s: LineStyle): void { this._lineStyle = s; }
}
