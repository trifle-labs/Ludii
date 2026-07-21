// @java ViewController/src/view/component/BaseComponentStyle.java

/**
 * Base style for drawing components.
 *
 * Faithful 1:1 port of view.component.BaseComponentStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.component.BaseComponentStyle
 */

import { Color, Font, BOLD, Point, Rectangle } from '../../../../awt/index.js';
import { SVGGraphics2D } from '../../../../awt/index.js';
import type { Point2D as Point2DType } from '../../../../awt/index.js';
import { SVGtoImage } from '../../../../Common/src/graphics/svg/SVGtoImage.js';
import { ImageUtil } from '../../../../Common/src/graphics/ImageUtil.js';
import { ImageConstants } from '../../../../Common/src/graphics/ImageConstants.js';
import type { Component } from '../../../../../ludemes/game/equipment/component/Component.js';
import type { Context } from '../../../../../ludemes/other/context/Context.js';
import { HiddenUtil } from '../../util/HiddenUtil.js';
import { StringUtil } from '../../util/StringUtil.js';
import type { Bridge } from '../../bridge/Bridge.js';
import type { ComponentStyle } from './ComponentStyle.js';
import { ValueDisplayInfo } from '../../../../../ludemes/metadata/graphics/util/ValueDisplayInfo.js';
import { ColourRoutines } from '../../../../../ludemes/metadata/graphics/util/colour/ColourRoutines.js';

// (ValueLocationType is used only in the Java original's switch; kept as comment)
// @java metadata.graphics.util.ValueLocationType

// ---------------------------------------------------------------------------
// Escape-hatch for metadata.graphics.Graphics (not yet fully ported).
// The Java code accesses context.game().metadata().graphics() which returns
// a Graphics object with many pieceXxx() methods.
// @java metadata.graphics.Graphics
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IMetadataGraphics = any;

// ---------------------------------------------------------------------------
// Escape-hatch for metadata.graphics.util.MetadataImageInfo
// @java metadata.graphics.util.MetadataImageInfo
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IMetadataImageInfo = any;

// ---------------------------------------------------------------------------

/**
 * Helper: access context.game().metadata().graphics() in a null-safe way.
 */
function getMetadataGraphics(context: Context): IMetadataGraphics {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = (context.game() as any)?.metadata?.()?.graphics?.();
  return g ?? {};
}

// ---------------------------------------------------------------------------

/**
 * Abstract base class for all component styles.
 *
 * @java view.component.BaseComponentStyle
 */
export abstract class BaseComponentStyle implements ComponentStyle {

  /** @java BaseComponentStyle#bridge */
  protected bridge: Bridge;

  /** @java BaseComponentStyle#component */
  protected component: Component;

  /** @java BaseComponentStyle#svgName */
  protected svgName: string = '';

  /** Component SVG image — indexed by localState. */
  private readonly imageSVG: (SVGGraphics2D | null)[] = [];

  /** Piece scale. @java BaseComponentStyle#scaleX */
  protected scaleX: number = 1.0;

  /** @java BaseComponentStyle#scaleY */
  protected scaleY: number = 1.0;

  /** @java BaseComponentStyle#maxBackgroundScale */
  protected maxBackgroundScale: number = 1.0;

  /** @java BaseComponentStyle#maxForegroundScale */
  protected maxForegroundScale: number = 1.0;

  /** Fill colour. @java BaseComponentStyle#fillColour */
  protected fillColour: Color | null = null;

  /** Edge colour. @java BaseComponentStyle#edgeColour */
  protected edgeColour: Color = Color.BLACK;

  /** Secondary colour. @java BaseComponentStyle#secondaryColour */
  protected secondaryColour: Color | null = null;

  /** If the piece image should be rotated. @java BaseComponentStyle#metadataRotation */
  protected metadataRotation: number = 0;

  /** @java BaseComponentStyle#showValue */
  protected showValue: ValueDisplayInfo = new ValueDisplayInfo();

  /** @java BaseComponentStyle#showLocalState */
  protected showLocalState: ValueDisplayInfo = new ValueDisplayInfo();

  /** Force all visuals to be drawn as strings (used for N puzzles). */
  protected drawStringVisuals: boolean = false;

  // -------------------------------------------------------------------------

  /**
   * Returns an SVG image from a given file path.
   * @java BaseComponentStyle#getSVGImageFromFilePath
   */
  protected abstract getSVGImageFromFilePath(
    g2d: SVGGraphics2D,
    context: Context,
    imageSize: number,
    sVGPath: string | null,
    containerIndex: number,
    localState: number,
    value: number,
    hiddenValue: number,
    rotation: number,
    secondary: boolean,
  ): SVGGraphics2D;

  // -------------------------------------------------------------------------

  /**
   * @java BaseComponentStyle#BaseComponentStyle(Bridge, Component)
   */
  constructor(bridge: Bridge, component: Component) {
    this.component = component;
    this.bridge = bridge;
  }

  // -------------------------------------------------------------------------

  /**
   * @java BaseComponentStyle#renderImageSVG
   */
  renderImageSVG(
    context: Context,
    containerIndex: number,
    imageSize: number,
    localState: number,
    value: number,
    secondary: boolean,
    hiddenValue: number,
    rotation: number,
  ): void {
    this.edgeColour = new Color(0, 0, 0);
    this.fillColour = null;

    const g2dSize = Math.floor(imageSize * this.scale(context, containerIndex, localState, value));
    let g2d = new SVGGraphics2D(g2dSize, g2dSize);

    const hiddenBitset = HiddenUtil.intToBitSet(hiddenValue);
    g2d = BaseComponentStyle.hiddenCheck(context, hiddenBitset, g2d);

    const imageState = BaseComponentStyle.hiddenStateCheck(context, hiddenBitset, localState);
    const imageValue = BaseComponentStyle.hiddenValueCheck(context, hiddenBitset, value);

    // svgName from component name without number
    this.svgName = this.component.getNameWithoutNumber();
    this.svgName = this.genericMetadataChecks(context, containerIndex, imageState, imageValue);
    let SVGPath = ImageUtil.getImageFullPath(this.svgName);

    if (this.drawStringVisuals) SVGPath = null;

    SVGPath = this.hiddenWhatCheck(context, hiddenBitset, SVGPath);
    this.hiddenWhoCheck(context, hiddenBitset);

    let maxNumRotations = (context.currentInstanceContext().game() as unknown as { maximalRotationStates?(): number })
      .maximalRotationStates?.() ?? 0;
    if (maxNumRotations === 0) maxNumRotations = 1;

    const maxRotation = Math.floor(360 / maxNumRotations);
    const degreesRotation = rotation * maxRotation + this.metadataRotation;

    while (this.imageSVG.length <= localState) this.imageSVG.push(null);

    this.imageSVG[localState] = this.getSVGImageFromFilePath(
      g2d, context, imageSize, SVGPath,
      containerIndex, imageState, imageValue, hiddenValue, degreesRotation, secondary,
    );
  }

  // -------------------------------------------------------------------------

  /** @java BaseComponentStyle#hiddenCheck (private static) */
  private static hiddenCheck(
    _context: Context,
    hiddenBitset: boolean[],
    g2d: SVGGraphics2D,
  ): SVGGraphics2D {
    if (hiddenBitset[HiddenUtil.hiddenIndex]) return new SVGGraphics2D(0, 0);
    return g2d;
  }

  /** @java BaseComponentStyle#hiddenValueCheck (private static) */
  private static hiddenValueCheck(
    _context: Context,
    hiddenBitset: boolean[],
    value: number,
  ): number {
    if (hiddenBitset[HiddenUtil.hiddenValueIndex]) return -1;
    return value;
  }

  /** @java BaseComponentStyle#hiddenStateCheck (private static) */
  private static hiddenStateCheck(
    _context: Context,
    hiddenBitset: boolean[],
    localState: number,
  ): number {
    if (hiddenBitset[HiddenUtil.hiddenStateIndex]) return -1;
    return localState;
  }

  /** @java BaseComponentStyle#hiddenWhoCheck (private) */
  private hiddenWhoCheck(_context: Context, hiddenBitset: boolean[]): void {
    if (hiddenBitset[HiddenUtil.hiddenWhoIndex]) {
      this.fillColour = Color.GRAY;
      this.edgeColour = Color.GRAY;
    }
  }

  /** @java BaseComponentStyle#hiddenWhatCheck (private) */
  private hiddenWhatCheck(
    context: Context,
    hiddenBitset: boolean[],
    sVGPath: string | null,
  ): string | null {
    let filePath = sVGPath;
    if (hiddenBitset[HiddenUtil.hiddenWhatIndex]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hiddenImageName: string | null = (context.game() as any)?.metadata?.()?.graphics?.()?.pieceHiddenImage?.() ?? null;
      if (hiddenImageName !== null) {
        filePath = ImageUtil.getImageFullPath(hiddenImageName);
        this.svgName = hiddenImageName;
      } else {
        filePath = null;
        this.svgName = '?';
      }
    }
    return filePath;
  }

  // -------------------------------------------------------------------------

  /**
   * Performs all graphics metadata checks that apply to all piece types.
   * @java BaseComponentStyle#genericMetadataChecks
   */
  genericMetadataChecks(
    context: Context,
    containerIndex: number,
    localState: number,
    value: number,
  ): string {
    this.svgName = this.component.getNameWithoutNumber();

    const metadataGraphics: IMetadataGraphics = getMetadataGraphics(context);

    const scale: { getX(): number; getY(): number } = metadataGraphics?.pieceScale?.(
      context, this.component.owner(), this.component.name(), containerIndex, localState, value,
    ) ?? { getX: () => 1.0, getY: () => 1.0 };
    this.scaleX = scale.getX();
    this.scaleY = scale.getY();

    // Check the .lud metadata for piece name extension
    const nameExtension: string | null = metadataGraphics?.pieceNameExtension?.(
      context, this.component.owner(), this.component.name(), containerIndex, localState, value,
    ) ?? null;
    if (nameExtension !== null) this.svgName = this.svgName + nameExtension;

    const nameReplacement: string | null = metadataGraphics?.pieceNameReplacement?.(
      context, this.component.owner(), this.component.name(), containerIndex, localState, value,
    ) ?? null;
    if (nameReplacement !== null) this.svgName = nameReplacement;

    const addLocalStateToName: boolean = metadataGraphics?.addStateToName?.(
      context, this.component.owner(), this.component.name(), containerIndex, localState, value,
    ) ?? false;
    if (addLocalStateToName) this.svgName = this.svgName + localState;

    // Check the .lud metadata for piece colour
    const pieceColour: Color | null = metadataGraphics?.pieceColour?.(
      context, this.component.owner(), this.component.name(), containerIndex, localState, value, 'Fill',
    ) ?? null;
    if (pieceColour !== null) this.fillColour = pieceColour;

    const pieceEdgeColour: Color | null = metadataGraphics?.pieceColour?.(
      context, this.component.owner(), this.component.name(), containerIndex, localState, value, 'Edge',
    ) ?? null;
    if (pieceEdgeColour !== null) this.edgeColour = pieceEdgeColour;

    const pieceSecondaryColour: Color | null = metadataGraphics?.pieceColour?.(
      context, this.component.owner(), this.component.name(), containerIndex, localState, value, 'Secondary',
    ) ?? null;
    if (pieceSecondaryColour !== null) this.secondaryColour = pieceSecondaryColour;

    this.metadataRotation = metadataGraphics?.pieceRotate?.(
      context, this.component.owner(), this.component.name(), containerIndex, localState, value,
    ) ?? 0;

    this.showValue = metadataGraphics?.displayPieceValue?.(
      context, this.component.owner(), this.component.name(),
    ) ?? new ValueDisplayInfo();

    this.showLocalState = metadataGraphics?.displayPieceState?.(
      context, this.component.owner(), this.component.name(),
    ) ?? new ValueDisplayInfo();

    if (this.component.isDie()) this.showLocalState = new ValueDisplayInfo();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gameName: string = (context.game() as any).name ?? '';

    if (
      !this.component.isDie()
      && (
        this.bridge.settingsVC().pieceFamily(gameName)
          === ImageConstants.abstractFamilyKeyword
        || (
          this.bridge.settingsVC().pieceFamily(gameName) === ''
          && metadataGraphics?.pieceFamilies?.() !== null
          && (metadataGraphics?.pieceFamilies?.() as string[] | null)
            ?.includes(ImageConstants.abstractFamilyKeyword)
        )
      )
    ) {
      this.svgName = ImageConstants.customImageKeywords[0] ?? '';
    }

    this.bridge.settingsVC().setPieceStyleExtension(
      this.bridge.settingsVC().pieceFamily(gameName),
    );

    if (this.bridge.settingsVC().pieceStyleExtension() === '') {
      const pf = metadataGraphics?.pieceFamilies?.() as string[] | null;
      if (pf !== null && pf !== undefined && pf.length > 0)
        this.bridge.settingsVC().setPieceStyleExtension(pf[0]!);
    }

    const ext = this.bridge.settingsVC().pieceStyleExtension();
    if (
      !ImageConstants.defaultFamilyKeywords.includes(ext)
      && ext !== ImageConstants.abstractFamilyKeyword
      && ext !== ''
    ) {
      this.svgName = this.svgName + '_' + ext;
    }

    if (this.fillColour === null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.fillColour = this.bridge.settingsColour().playerColour(context as any, this.component.owner());

    if (this.secondaryColour === null)
      // getContrastColorFavourDark returns RgbaColour; cast to Color (both represent RGBA colours)
      this.secondaryColour = ColourRoutines.getContrastColorFavourDark(this.fillColour as unknown as import('../../../../../ludemes/metadata/graphics/util/colour/UserColourType.js').RgbaColour) as unknown as Color;

    return this.svgName;
  }

  // -------------------------------------------------------------------------

  /**
   * Returns an SVG image for the component style background.
   * @java BaseComponentStyle#getBackground
   */
  protected getBackground(
    g2d: SVGGraphics2D,
    context: Context,
    containerIndex: number,
    localState: number,
    value: number,
    dim: number,
  ): SVGGraphics2D {
    const metadataGraphics: IMetadataGraphics = getMetadataGraphics(context);

    const bgList: IMetadataImageInfo[] = metadataGraphics?.pieceBackground?.(
      context, this.component.owner(), this.component.name(), containerIndex, localState, value,
    ) ?? [];

    for (const backgroundImageInfo of bgList) {
      if (backgroundImageInfo?.path?.() !== null && backgroundImageInfo?.path?.() !== undefined) {
        const backgroundPath = ImageUtil.getImageFullPath(backgroundImageInfo.path()) ?? '';
        const backgroundScaleX: number = backgroundImageInfo.scaleX();
        const backgroundScaleY: number = backgroundImageInfo.scaleY();
        this.maxForegroundScale = Math.max(
          Math.max(backgroundScaleX, backgroundScaleY),
          this.maxBackgroundScale,
        );
        let backgroundColour: Color | null = backgroundImageInfo.mainColour();
        let backgroundEdgeColour: Color | null = backgroundImageInfo.secondaryColour();
        const rotationBg: number = backgroundImageInfo.rotation();
        const offsetX: number = backgroundImageInfo.offestX();
        const offsetY: number = backgroundImageInfo.offestY();

        if (backgroundColour === null)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          backgroundColour = this.bridge.settingsColour().playerColour(context as any, this.component.owner());
        if (backgroundEdgeColour === null)
          backgroundEdgeColour = Color.BLACK;

        const tileSizeX = Math.floor(dim * backgroundScaleX);
        const tileOffsetX = Math.floor((dim - tileSizeX) / 2);
        const tileSizeY = Math.floor(dim * backgroundScaleY);
        const tileOffsetY = Math.floor((dim - tileSizeY) / 2);
        SVGtoImage.loadFromFilePath(
          g2d, backgroundPath,
          new Rectangle(
            Math.floor(tileOffsetX + tileOffsetX * offsetX),
            Math.floor(tileOffsetY + tileOffsetY * offsetY),
            tileSizeX, tileSizeY,
          ),
          backgroundEdgeColour, backgroundColour, rotationBg,
        );
      }

      if (backgroundImageInfo?.text?.() !== null && backgroundImageInfo?.text?.() !== undefined) {
        const valueFont = new Font('Arial', BOLD, Math.floor(dim * backgroundImageInfo.scale()));
        g2d.setColor(backgroundImageInfo.mainColour());
        g2d.setFont(valueFont);
        StringUtil.drawStringAtPoint(
          g2d, backgroundImageInfo.text(), null,
          new Point(Math.floor(g2d.getWidth() / 2), Math.floor(g2d.getHeight() / 2)),
          true,
        );
      }
    }

    return g2d;
  }

  // -------------------------------------------------------------------------

  /**
   * Returns an SVG image for the component style foreground.
   * @java BaseComponentStyle#getForeground
   */
  protected getForeground(
    g2d: SVGGraphics2D,
    context: Context,
    containerIndex: number,
    localState: number,
    value: number,
    dim: number,
  ): SVGGraphics2D {
    const metadataGraphics: IMetadataGraphics = getMetadataGraphics(context);

    const fgList: IMetadataImageInfo[] = metadataGraphics?.pieceForeground?.(
      context, this.component.owner(), this.component.name(), containerIndex, localState, value,
    ) ?? [];

    for (const foregroundImageInfo of fgList) {
      if (foregroundImageInfo?.path?.() !== null && foregroundImageInfo?.path?.() !== undefined) {
        const foregroundPath = ImageUtil.getImageFullPath(foregroundImageInfo.path()) ?? '';
        const foregroundScaleX: number = foregroundImageInfo.scaleX();
        const foregroundScaleY: number = foregroundImageInfo.scaleY();
        this.maxForegroundScale = Math.max(
          Math.max(foregroundScaleX, foregroundScaleY),
          this.maxForegroundScale,
        );
        let foregroundColour: Color | null = foregroundImageInfo.mainColour();
        let foregroundEdgeColour: Color | null = foregroundImageInfo.secondaryColour();
        const rotationFg: number = foregroundImageInfo.rotation();
        const offsetX: number = foregroundImageInfo.offestX();
        const offsetY: number = foregroundImageInfo.offestY();

        if (foregroundColour === null)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          foregroundColour = this.bridge.settingsColour().playerColour(context as any, this.component.owner());
        if (foregroundEdgeColour === null)
          foregroundEdgeColour = Color.BLACK;

        const tileSizeX = Math.floor(dim * foregroundScaleX);
        const tileOffsetX = Math.floor((dim - tileSizeX) / 2);
        const tileSizeY = Math.floor(dim * foregroundScaleY);
        const tileOffsetY = Math.floor((dim - tileSizeY) / 2);
        SVGtoImage.loadFromFilePath(
          g2d, foregroundPath,
          new Rectangle(
            Math.floor(tileOffsetX + tileOffsetX * offsetX),
            Math.floor(tileOffsetY + tileOffsetY * offsetY),
            tileSizeX, tileSizeY,
          ),
          foregroundEdgeColour, foregroundColour, rotationFg,
        );
      }

      if (foregroundImageInfo?.text?.() !== null && foregroundImageInfo?.text?.() !== undefined) {
        const valueFont = new Font('Arial', BOLD, Math.floor(dim * foregroundImageInfo.scale()));
        g2d.setColor(foregroundImageInfo.mainColour());
        g2d.setFont(valueFont);
        StringUtil.drawStringAtPoint(
          g2d, foregroundImageInfo.text(), null,
          new Point(Math.floor(g2d.getWidth() / 2), Math.floor(g2d.getHeight() / 2)),
          true,
        );
      }
    }

    return g2d;
  }

  // -------------------------------------------------------------------------

  /**
   * @java BaseComponentStyle#getImageSVG
   */
  getImageSVG(localState: number): SVGGraphics2D | null {
    if (localState >= this.imageSVG.length) {
      if (this.imageSVG.length > 0) return this.imageSVG[0] ?? null;
      else return null;
    }
    return this.imageSVG[localState] ?? null;
  }

  // -------------------------------------------------------------------------

  /**
   * @java BaseComponentStyle#scale
   */
  scale(context: Context, containerIndex: number, localState: number, value: number): number {
    // Need to check metadata for any adjusted piece scales
    const metadataGraphics: IMetadataGraphics = getMetadataGraphics(context);
    const s: { getX(): number; getY(): number } = metadataGraphics?.pieceScale?.(
      context, this.component.owner(), this.component.name(), containerIndex, localState, value,
    ) ?? { getX: () => 1.0, getY: () => 1.0 };
    this.scaleX = s.getX();
    this.scaleY = s.getY();

    return Math.max(
      Math.max(Math.max(this.scaleX, this.scaleY), this.maxBackgroundScale),
      this.maxForegroundScale,
    );
  }

  /**
   * @java BaseComponentStyle#origin
   */
  origin(): Point[] {
    return [];
  }

  /**
   * @java BaseComponentStyle#getLargeOffsets
   */
  getLargeOffsets(): Point2DType[] {
    return [];
  }

  /**
   * @java BaseComponentStyle#largePieceSize
   */
  largePieceSize(): Point {
    return new Point();
  }

  // -------------------------------------------------------------------------

  /**
   * @java BaseComponentStyle#getSecondaryColour
   */
  getSecondaryColour(): Color | null {
    return this.secondaryColour;
  }

  // -------------------------------------------------------------------------
}
