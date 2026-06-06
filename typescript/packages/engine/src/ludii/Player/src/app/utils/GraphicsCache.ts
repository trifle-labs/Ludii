// @java Player/src/app/utils/GraphicsCache.java

import type { Graphics2D } from "../../../../awt/index.js";
import type { SVGGraphics2D } from "../../../../awt/index.js";
import type { Point } from "../../../../awt/index.js";
import type { SiteType } from "../../../../../ludemes/other/topology/TopologyElement.js";
import type { Context } from "../../../../ViewController/src/../../../ludemes/other/context/Context.js";
import type { Component } from "../../../../../ludemes/game/equipment/component/Component.js";
import { ActionUpdateDice } from "../../../../../ludemes/other/action/die/ActionUpdateDice.js";
import { ActionUseDie } from "../../../../../ludemes/other/action/die/ActionUseDie.js";
import type { Bridge } from "../../../../ViewController/src/bridge/Bridge.js";
import type { ComponentStyle } from "../../../../ViewController/src/view/component/ComponentStyle.js";
import { DrawnImageInfo, type BufferedImage } from "./DrawnImageInfo.js";
import type { ImageInfo } from "../../../../ViewController/src/util/ImageInfo.js";

/** @java main.Constants.MAX_PLAYERS */
const MAX_PLAYERS = 16;

/** @java main.Constants.UNDEFINED */
const UNDEFINED = -1;

// -------------------------------------------------------------------------

/**
 * Minimal structural interface for SVGUtil (not yet ported in this batch).
 * @java app.utils.SVGUtil
 */
export interface ISVGUtil {
  createSVGImage(svgDocument: string, width: number, height: number): BufferedImage;
}

/** Module-level injectable SVGUtil. Defaults to null; callers must inject. */
let _svgUtil: ISVGUtil | null = null;

/** Inject the SVGUtil implementation. */
export function injectSVGUtil(util: ISVGUtil): void {
  _svgUtil = util;
}

// -------------------------------------------------------------------------

/**
 * Minimal structural interface for BufferedImageUtil (not yet ported in this batch).
 * @java app.utils.BufferedImageUtil
 */
export interface IBufferedImageUtil {
  makeImageTranslucent(source: BufferedImage, alpha: number): BufferedImage;
  resize(img: BufferedImage, newW: number, newH: number): BufferedImage;
  pointOverlapsImage(p: Point, image: BufferedImage, imageDrawPosn: Point): boolean;
}

/** Module-level injectable BufferedImageUtil. Defaults to null; callers must inject. */
let _bufferedImageUtil: IBufferedImageUtil | null = null;

/** Inject the BufferedImageUtil implementation. */
export function injectBufferedImageUtil(util: IBufferedImageUtil): void {
  _bufferedImageUtil = util;
}

// -------------------------------------------------------------------------

/**
 * Nested class for storing the bufferedImages from the component SVGs.
 * [Container, Component, Owner, State, Value, HiddenValue, Rotation]
 *
 * Faithful 1:1 port of app.utils.GraphicsCache.cacheStorage.
 *
 * @java app.utils.GraphicsCache.cacheStorage
 */
export class CacheStorage {

  /** All component images for use on the containers (BufferedImages). */
  readonly cacheStorageImages: (BufferedImage | null)[][][][][][][] = [];

  /** All component image sizes for use on the containers (Integer). */
  readonly cacheStorageSizes: (number | null)[][][][][][][] = [];

  // -------------------------------------------------------------------------

  /** @java cacheStorage#getCacheImage */
  getCacheImage(
    containerId: number, componentId: number, owner: number,
    localState: number, value: number, hiddenValue: number, rotation: number,
  ): BufferedImage | null {
    return this.cacheStorageImages[containerId]?.[componentId]?.[owner]?.[localState]?.[value]?.[hiddenValue]?.[rotation] ?? null;
  }

  /** @java cacheStorage#getCacheImageSize */
  getCacheImageSize(
    containerId: number, componentId: number, owner: number,
    localState: number, value: number, hiddenValue: number, rotation: number,
  ): number {
    return this.cacheStorageSizes[containerId]?.[componentId]?.[owner]?.[localState]?.[value]?.[hiddenValue]?.[rotation] ?? 0;
  }

  // -------------------------------------------------------------------------

  /** @java cacheStorage#setCacheImage */
  setCacheImage(
    image: BufferedImage | null,
    containerId: number, componentId: number, owner: number,
    localState: number, value: number, hiddenValue: number, rotation: number,
  ): void {
    const a = this.cacheStorageImages;
    const c0 = a[containerId];
    if (c0 === undefined) return;
    const c1 = c0[componentId];
    if (c1 === undefined) return;
    const c2 = c1[owner];
    if (c2 === undefined) return;
    const c3 = c2[localState];
    if (c3 === undefined) return;
    const c4 = c3[value];
    if (c4 === undefined) return;
    const c5 = c4[hiddenValue];
    if (c5 === undefined) return;
    c5[rotation] = image;
  }

  /** @java cacheStorage#setCacheImageSize */
  setCacheImageSize(
    size: number,
    containerId: number, componentId: number, owner: number,
    localState: number, value: number, hiddenValue: number, rotation: number,
  ): void {
    const a = this.cacheStorageSizes;
    const c0 = a[containerId];
    if (c0 === undefined) return;
    const c1 = c0[componentId];
    if (c1 === undefined) return;
    const c2 = c1[owner];
    if (c2 === undefined) return;
    const c3 = c2[localState];
    if (c3 === undefined) return;
    const c4 = c3[value];
    if (c4 === undefined) return;
    const c5 = c4[hiddenValue];
    if (c5 === undefined) return;
    c5[rotation] = size;
  }

  // -------------------------------------------------------------------------

  /**
   * Adds additional empty arrays and default values to the graphics cache, for
   * the intermediary values.
   * @java cacheStorage#setupCache
   */
  setupCache(
    containerId: number, componentId: number, owner: number,
    localState: number, value: number, hiddenValue: number, rotation: number,
    _secondary: boolean,
  ): CacheStorage {
    // Dim 0: containerId
    while (this.cacheStorageImages.length <= containerId) {
      this.cacheStorageImages.push([]);
      this.cacheStorageSizes.push([]);
    }

    // Dim 1: componentId
    const imgC = this.cacheStorageImages[containerId]!;
    const szC = this.cacheStorageSizes[containerId]!;
    while (imgC.length <= componentId) { imgC.push([]); szC.push([]); }

    // Dim 2: owner
    const imgCmp = imgC[componentId]!;
    const szCmp = szC[componentId]!;
    while (imgCmp.length <= owner) { imgCmp.push([]); szCmp.push([]); }

    // Dim 3: localState
    const imgO = imgCmp[owner]!;
    const szO = szCmp[owner]!;
    while (imgO.length <= localState) { imgO.push([]); szO.push([]); }

    // Dim 4: value
    const imgLS = imgO[localState]!;
    const szLS = szO[localState]!;
    while (imgLS.length <= value) { imgLS.push([]); szLS.push([]); }

    // Dim 5: hiddenValue
    const imgV = imgLS[value]!;
    const szV = szLS[value]!;
    while (imgV.length <= hiddenValue) { imgV.push([]); szV.push([]); }

    // Dim 6: rotation
    const imgH = imgV[hiddenValue]!;
    const szH = szV[hiddenValue]!;
    while (imgH.length <= rotation) { imgH.push(null); szH.push(0); }

    return this;
  }
}

// -------------------------------------------------------------------------

/**
 * GraphicsCache for storing all the images we need.
 *
 * Faithful 1:1 port of app.utils.GraphicsCache.
 *
 * @author Matthew.Stephenson (Java original)
 * @java app.utils.GraphicsCache
 */
export class GraphicsCache {

  /** All component images and sizes for use on the containers. */
  private _allComponentImages: CacheStorage = new CacheStorage();

  /** All component images and sizes for use on other GUI elements without a container. */
  private _allComponentImagesSecondary: CacheStorage = new CacheStorage();

  /** Other images we want to store. */
  private _boardImage: BufferedImage | null = null;
  private _graphImage: BufferedImage | null = null;
  private _connectionsImage: BufferedImage | null = null;
  private _allToolButtons: (BufferedImage | null)[] = new Array<BufferedImage | null>(9).fill(null);
  private readonly _allDrawnComponents: DrawnImageInfo[] = [];

  // -------------------------------------------------------------------------

  /**
   * Get the image of a component.
   * @java GraphicsCache#getComponentImage
   */
  getComponentImage(
    bridge: Bridge,
    containerId: number,
    component: Component,
    owner: number,
    localState: number,
    value: number,
    site: number,
    level: number,
    type: SiteType,
    imageSize: number,
    context: Context,
    hiddenValue: number,
    rotation: number,
    secondary: boolean,
  ): BufferedImage | null {
    const componentId = component.index();
    const componentStyle: ComponentStyle | null = bridge.getComponentStyle(component.index());

    // Retrieve and initialise the correct graphics cache object.
    let componentImageArray: CacheStorage;
    if (secondary && component.isTile()) {
      componentImageArray = this.allComponentImagesSecondary().setupCache(containerId, componentId, owner, localState, value, hiddenValue, rotation, secondary);
    } else {
      componentImageArray = this.allComponentImages().setupCache(containerId, componentId, owner, localState, value, hiddenValue, rotation, secondary);
    }

    // Fetch the image and size stored in the graphics cache.
    let cacheImage: BufferedImage | null = componentImageArray.getCacheImage(containerId, componentId, owner, localState, value, hiddenValue, rotation);
    let cacheImageSize: number = componentImageArray.getCacheImageSize(containerId, componentId, owner, localState, value, hiddenValue, rotation);

    // If the component does not have a stored image for the provided local state, create one.
    if (cacheImage === null || cacheImageSize !== imageSize) {
      if (componentStyle !== null) {
        if (containerId > 0 && component.isLargePiece()) {
          const containerStyle = bridge.getContainerStyle(0);
          const cellRadius = containerStyle !== null ? containerStyle.cellRadiusPixels() * 2 : imageSize;
          componentStyle.renderImageSVG(context, containerId, cellRadius, localState, value, true, hiddenValue, rotation);
        } else if (containerId > 0 && component.isTile()) {
          componentStyle.renderImageSVG(context, containerId, imageSize, localState, value, true, hiddenValue, rotation);
        } else {
          componentStyle.renderImageSVG(context, containerId, imageSize, localState, value, secondary, hiddenValue, rotation);
        }

        const svg: SVGGraphics2D | null = componentStyle.getImageSVG(localState);
        const componentImage = GraphicsCache._getComponentBufferedImage(svg, component, componentStyle, containerId, imageSize);

        componentImageArray.setCacheImage(componentImage, containerId, componentId, owner, localState, value, hiddenValue, rotation);
        componentImageArray.setCacheImageSize(imageSize, containerId, componentId, owner, localState, value, hiddenValue, rotation);

        cacheImage = componentImage;
        cacheImageSize = imageSize;
      }
    }

    void cacheImageSize; // suppress unused-var warning

    // Check if the component is a die.
    if (component.isDie()) {
      return GraphicsCache._getDiceImage(containerId, component, localState, site, context, cacheImage);
    }

    return cacheImage;
  }

  // -------------------------------------------------------------------------

  /**
   * Creates the (basic) image of the component from its SVG.
   * @java GraphicsCache#getComponentBufferedImage
   */
  private static _getComponentBufferedImage(
    svg: SVGGraphics2D | null,
    component: Component,
    componentStyle: ComponentStyle,
    containerId: number,
    imageSize: number,
  ): BufferedImage | null {
    if (svg === null || _svgUtil === null) return null;

    if (component.isLargePiece()) {
      const largeSz = componentStyle.largePieceSize();
      let componentImage: BufferedImage = _svgUtil.createSVGImage(svg.getSVGDocument(), largeSz.x, largeSz.y);
      if (containerId !== 0 && _bufferedImageUtil !== null) {
        const maxSize = Math.max(largeSz.x, largeSz.y);
        const scaleFactor = 0.9 * imageSize / maxSize;
        componentImage = _bufferedImageUtil.resize(componentImage, Math.trunc(scaleFactor * largeSz.x), Math.trunc(scaleFactor * largeSz.y));
      }
      return componentImage;
    } else {
      return _svgUtil.createSVGImage(svg.getSVGDocument(), imageSize, imageSize);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Gets the image of the component if it's a dice (transparent if already used).
   * @java GraphicsCache#getDiceImage
   */
  private static _getDiceImage(
    containerId: number,
    component: Component,
    localState: number,
    site: number,
    context: Context,
    cacheImage: BufferedImage | null,
  ): BufferedImage | null {
    // get the index of the dice container (usually just one)
    let handDiceIndex = -1;
    const handDice = context.game().handDice() as Array<{ index(): number }>;
    for (let j = 0; j < handDice.length; j++) {
      const dice = handDice[j]!;
      if (dice.index() === containerId) {
        handDiceIndex = j;
        break;
      }
    }

    // Only grey out dice if they are in a dice hand.
    if (handDiceIndex !== -1) {
      const sitesFrom = context.game().equipment().sitesFrom();
      const currentDice = (context.state() as unknown as { currentDice(): number[][] }).currentDice();
      let previousValue = currentDice[handDiceIndex]![site - (sitesFrom[containerId] ?? 0)] ?? 0;

      let stateValue = localState;
      const movesResult = context.game().moves(context);
      const movesList = movesResult.moves();

      // Use a plain array so we can use instanceof checks
      const firstMoveActionsRaw: unknown[] = [];
      const m0 = movesList.isEmpty() ? null : movesList.get(0);
      if (m0 !== null) {
        const acts = m0.actions();
        for (const a of acts) firstMoveActionsRaw.push(a);
      }

      let useDieDetected = false;

      if (!movesList.isEmpty()) {
        // We check if the moves used an ActionUseDie.
        let i = 0;
        while (i < (movesList as unknown as { size(): number }).size()) {
          const m = movesList.get(i);
          for (const action of m.actions()) {
            if (action instanceof ActionUseDie) {
              useDieDetected = true;
              break;
            }
          }
          if (useDieDetected) break;
          i++;
        }

        // Keep only actions equal to ActionUpdateDice that are same across all moves.
        const allSameActions: unknown[] = [...firstMoveActionsRaw];
        let j2 = 0;
        while (j2 < (movesList as unknown as { size(): number }).size()) {
          const m = movesList.get(j2);
          const mActs = m.actions();
          for (let k = allSameActions.length - 1; k >= 0; k--) {
            if (mActs.length <= k || allSameActions[k] !== mActs[k]) {
              allSameActions.splice(k, 1);
            }
          }
          j2++;
        }
        // Remove non-ActionUpdateDice entries
        for (let k = allSameActions.length - 1; k >= 0; k--) {
          if (!(allSameActions[k] instanceof ActionUpdateDice)) {
            allSameActions.splice(k, 1);
          }
        }

        const loc = (sitesFrom[containerId] ?? 0) + site;
        for (const a of allSameActions) {
          const action = a as { from(): number; state(): number };
          if (action.from() === loc && stateValue !== UNDEFINED) {
            stateValue = action.state();
            previousValue = component.getFaces()[stateValue] ?? 0;
          }
        }
      }

      // Grey the die if the previous value was 0 and useDie was detected.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (context.state()!.mover() === context.state()!.prev() && previousValue === 0 && useDieDetected) {
        if (_bufferedImageUtil !== null && cacheImage !== null) {
          return _bufferedImageUtil.makeImageTranslucent(cacheImage, 0.2);
        }
      }
    }

    return cacheImage;
  }

  // -------------------------------------------------------------------------

  /**
   * Draws the image onto the view, and also saves its information for selection use later.
   * @java GraphicsCache#drawPiece
   */
  drawPiece(
    g2d: Graphics2D,
    _context: Context,
    pieceImage: BufferedImage | null,
    posn: Point,
    site: number,
    level: number,
    type: SiteType,
    transparency: number,
  ): void {
    let imageToDraw: BufferedImage | null = pieceImage;
    if (transparency !== 0 && pieceImage !== null && _bufferedImageUtil !== null) {
      imageToDraw = _bufferedImageUtil.makeImageTranslucent(pieceImage, transparency);
    }
    // Build a minimal ImageInfo-compatible object — ImageInfo TS constructor
    // requires drawPosn, site, level, graphElementType
    const imageInfo: ImageInfo = {
      drawPosn: () => posn,
      site: () => site,
      level: () => level,
      graphElementType: () => type,
      transparency: () => transparency,
      rotation: () => 0,
      component: () => null,
      localState: () => 0,
      value: () => 0,
      containerIndex: () => 0,
      imageSize: () => 0,
      count: () => 0,
    } as unknown as ImageInfo;
    this._allDrawnComponents.push(new DrawnImageInfo(pieceImage, imageInfo));
    if (imageToDraw !== null) {
      (g2d as unknown as {
        drawImage(img: BufferedImage | null, x: number, y: number, observer: null): void
      }).drawImage(imageToDraw, posn.x, posn.y, null);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Clear the graphics cache.
   * @java GraphicsCache#clearAllCachedImages
   */
  clearAllCachedImages(): void {
    this._allComponentImages = new CacheStorage();
    this._allComponentImagesSecondary = new CacheStorage();
    this._boardImage = null;
    this._graphImage = null;
    this._connectionsImage = null;
    this._allToolButtons = new Array<BufferedImage | null>(MAX_PLAYERS + 1).fill(null);
    this._allDrawnComponents.length = 0;
  }

  // -------------------------------------------------------------------------

  /**
   * Gets the size of the image for a component.
   * @java GraphicsCache#getComponentImageSize
   */
  getComponentImageSize(
    containerId: number, componentId: number, owner: number,
    localState: number, value: number, hiddenValue: number, rotation: number,
  ): number {
    return this.allComponentImages().getCacheImageSize(containerId, componentId, owner, localState, value, hiddenValue, rotation);
  }

  // -------------------------------------------------------------------------

  /** @java GraphicsCache#boardImage() */
  boardImage(): BufferedImage | null { return this._boardImage; }
  /** @java GraphicsCache#setBoardImage */
  setBoardImage(boardImage: BufferedImage | null): void { this._boardImage = boardImage; }

  /** @java GraphicsCache#graphImage() */
  graphImage(): BufferedImage | null { return this._graphImage; }
  /** @java GraphicsCache#setGraphImage */
  setGraphImage(graphImage: BufferedImage | null): void { this._graphImage = graphImage; }

  /** @java GraphicsCache#connectionsImage() */
  connectionsImage(): BufferedImage | null { return this._connectionsImage; }
  /** @java GraphicsCache#setConnectionsImage */
  setConnectionsImage(connectionsImage: BufferedImage | null): void { this._connectionsImage = connectionsImage; }

  /** @java GraphicsCache#allToolButtons() */
  allToolButtons(): (BufferedImage | null)[] { return this._allToolButtons; }
  /** @java GraphicsCache#setAllToolButtons */
  setAllToolButtons(allToolButtons: (BufferedImage | null)[]): void { this._allToolButtons = allToolButtons; }

  /** @java GraphicsCache#allDrawnComponents() */
  allDrawnComponents(): DrawnImageInfo[] { return this._allDrawnComponents; }

  private allComponentImages(): CacheStorage { return this._allComponentImages; }
  private allComponentImagesSecondary(): CacheStorage { return this._allComponentImagesSecondary; }

  // -------------------------------------------------------------------------
}
