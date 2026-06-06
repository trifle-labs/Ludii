// @java Player/src/app/PlayerApp.java

/**
 * Abstract PlayerApp class to be extended by each platform-specific Player.
 *
 * Faithful 1:1 port of app.PlayerApp.
 *
 * @author Matthew.Stephenson (Java original)
 * @java app.PlayerApp
 */

import { Color, Font, Graphics2D, Point, Rectangle, Point2D } from "../../../awt/index.js";
import type { SVGGraphics2D } from "../../../awt/index.js";
import type { Rectangle2D } from "../../../awt/index.js";
import type { Context } from "../../../../context.js";
import type { Move } from "../../../../move.js";
import type { Action } from "../../../../ludemes/other/action/Action.js";
import { FullLocation } from "../../../../ludemes/other/location/FullLocation.js";
import type { Location } from "../../../../ludemes/other/location/Location.js";
import { Manager } from "../../../Manager/src/manager/Manager.js";
import type { PlayerInterface } from "../../../Manager/src/manager/PlayerInterface.js";
import type { Tournament } from "../../../Manager/src/tournament/Tournament.js";
import { Bridge } from "../../../ViewController/src/bridge/Bridge.js";
import type { PlatformGraphics } from "../../../ViewController/src/bridge/PlatformGraphics.js";
import { HiddenUtil } from "../../../ViewController/src/util/HiddenUtil.js";
import { ImageInfo } from "../../../ViewController/src/util/ImageInfo.js";
import { PlaneType } from "../../../ViewController/src/util/PlaneType.js";
import { StringUtil } from "../../../ViewController/src/util/StringUtil.js";
import { AnimationVisualsType } from "./utils/AnimationVisualsType.js";
import { ContextSnapshot } from "./utils/ContextSnapshot.js";
import { RemoteDialogFunctionsPublic } from "./utils/RemoteDialogFunctionsPublic.js";
import { SettingsExhibition } from "./utils/SettingsExhibition.js";
import { SettingsPlayer } from "./utils/SettingsPlayer.js";
import { Sound } from "./utils/Sound.js";
import { SVGUtil } from "./utils/SVGUtil.js";
import { UpdateTabMessages } from "./utils/UpdateTabMessages.js";
import { AnimationType } from "./move/animation/AnimationType.js";
import { MoveAnimation } from "./move/animation/MoveAnimation.js";
import { MoveHandler } from "./move/MoveHandler.js";
import { View } from "./views/View.js";
import { pieceStackTypeFromValue } from "../../../../ludemes/metadata/graphics/util/PieceStackType.js";
import type { PieceStackType } from "../../../../ludemes/metadata/graphics/util/PieceStackType.js";
import type { SiteType as SiteTypeAlias } from "../../../../ludemes/other/other/BaseLudemeWithGraphElement.js";

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/**
 * java.awt.image.BufferedImage — browser shim.
 * @java java.awt.image.BufferedImage
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BufferedImage = any;

/**
 * app.utils.GraphicsCache — not yet ported.
 * @java app.utils.GraphicsCache
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GraphicsCache = any;

/**
 * game.equipment.container.board.Board — escape-hatch.
 * @java game.equipment.container.board.Board
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Board = any;

/**
 * other.state.State — escape-hatch for container state access.
 * @java other.state.State
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type State = any;

/**
 * other.state.container.ContainerState — escape-hatch.
 * @java other.state.container.ContainerState
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContainerState = any;

/**
 * metadata.graphics.util.StackPropertyType — string union.
 * @java metadata.graphics.util.StackPropertyType
 */
type StackPropertyType = "Scale" | "Limit" | "Type";

// Minimal Constants shape
const UNDEFINED_CONST = -1;
const MAX_PLAYERS = 16;
const MAX_STACK_HEIGHT = 64;

// ---------------------------------------------------------------------------

/**
 * Abstract PlayerApp class to be extended by each platform-specific Player.
 *
 * Implements PlayerInterface and PlatformGraphics.
 *
 * @java app.PlayerApp
 */
export abstract class PlayerApp implements PlayerInterface, PlatformGraphics {

  /** @java PlayerApp#manager */
  private readonly _manager: Manager = new Manager(this);

  /** @java PlayerApp#bridge */
  private readonly _bridge: Bridge = new Bridge();

  /** @java PlayerApp#contextSnapshot */
  private readonly _contextSnapshot: ContextSnapshot = new ContextSnapshot();

  /** @java PlayerApp#settingsPlayer */
  private readonly _settingsPlayer: SettingsPlayer = new SettingsPlayer();

  /**
   * Graphics cache — escape-hatch because GraphicsCache is not yet ported.
   * @java PlayerApp#graphicsCache
   */
  private readonly _graphicsCache: GraphicsCache = PlayerApp._makeGraphicsCache();

  /** @java PlayerApp#remoteDialogFunctionsPublic */
  private readonly _remoteDialogFunctionsPublic: RemoteDialogFunctionsPublic =
    RemoteDialogFunctionsPublic.construct();

  // ---------------------------------------------------------------------------
  // Factory helper for the escape-hatch graphicsCache
  // ---------------------------------------------------------------------------

  /**
   * Creates a minimal graphicsCache shim.
   * When the real GraphicsCache port lands, replace with `new GraphicsCache()`.
   * @java new app.utils.GraphicsCache()
   */
  private static _makeGraphicsCache(): GraphicsCache {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache: any = {
      _boardImage: null as BufferedImage,
      _graphImage: null as BufferedImage,
      _connectionsImage: null as BufferedImage,
      _allDrawnComponents: [] as unknown[],
    };

    cache.boardImage = function(): BufferedImage { return cache._boardImage; };
    cache.setBoardImage = function(img: BufferedImage): void { cache._boardImage = img; };
    cache.graphImage = function(): BufferedImage { return cache._graphImage; };
    cache.setGraphImage = function(img: BufferedImage): void { cache._graphImage = img; };
    cache.connectionsImage = function(): BufferedImage { return cache._connectionsImage; };
    cache.setConnectionsImage = function(img: BufferedImage): void { cache._connectionsImage = img; };
    cache.allDrawnComponents = function(): unknown[] { return cache._allDrawnComponents; };
    cache.clearAllCachedImages = function(): void {
      cache._boardImage = null;
      cache._graphImage = null;
      cache._connectionsImage = null;
      cache._allDrawnComponents = [];
    };
    // drawPiece — faithfully mirrors GraphicsCache.drawPiece()
    cache.drawPiece = function(
      g2d: Graphics2D,
      _context: unknown,
      pieceImage: BufferedImage,
      posn: Point,
      site: number,
      level: number,
      type: unknown,
      transparency: number,
    ): void {
      void transparency;
      (g2d as unknown as { drawImage(img: unknown, x: number, y: number, obs: null): void })
        .drawImage(pieceImage, posn.x, posn.y, null);
      const info = new ImageInfo(posn, site, level, type as SiteTypeAlias);
      cache._allDrawnComponents.push({ pieceImage: () => pieceImage, imageInfo: () => info });
    };
    // getComponentImage — stub until GraphicsCache is ported
    cache.getComponentImage = function(): BufferedImage { return null; };

    return cache as GraphicsCache;
  }

  // ---------------------------------------------------------------------------
  // Abstract methods (platform-specific — Swing/DOM escape-hatch)
  // ---------------------------------------------------------------------------

  /** @java PlayerApp#tournament() */
  public abstract tournament(): Tournament | null;

  /** @java PlayerApp#setTournament(Tournament) */
  public abstract setTournament(tournament: Tournament | null): void;

  /** @java PlayerApp#reportError(String) */
  public abstract reportError(error: string): void;

  /**
   * @java PlayerApp#repaintComponentBetweenPoints(Context, Location, Point, Point)
   */
  public abstract repaintComponentBetweenPoints(
    context: Context,
    moveFrom: Location,
    startPoint: Point,
    endPoint: Point,
  ): void;

  /** @java PlayerApp#showPuzzleDialog(int) */
  public abstract showPuzzleDialog(site: number): void;

  /**
   * @java PlayerApp#showPossibleMovesDialog(Context, FastArrayList<Move>)
   */
  public abstract showPossibleMovesDialog(context: Context, possibleMoves: Move[]): void;

  /** @java PlayerApp#saveTrial() */
  public abstract saveTrial(): void;

  /** @java PlayerApp#playSound(String) */
  public abstract playSound(soundName: string): void;

  /** @java PlayerApp#setVolatileMessage(String) */
  public abstract setVolatileMessage(text: string): void;

  /** @java PlayerApp#writeTextToFile(String, String) */
  public abstract writeTextToFile(fileName: string, log: string): void;

  /** @java PlayerApp#resetMenuGUI() */
  public abstract resetMenuGUI(): void;

  /** @java PlayerApp#showSettingsDialog() */
  public abstract showSettingsDialog(): void;

  /**
   * @java PlayerApp#showOtherDialog(FastArrayList<Move>)
   */
  public abstract showOtherDialog(otherPossibleMoves: Move[]): void;

  /** @java PlayerApp#showInfoDialog() */
  public abstract showInfoDialog(): void;

  /** @java PlayerApp#width() */
  public abstract width(): number;

  /** @java PlayerApp#height() */
  public abstract height(): number;

  /** @java PlayerApp#getPanels() */
  public abstract getPanels(): View[];

  /** @java PlayerApp#playerSwatchList() */
  public abstract playerSwatchList(): Rectangle[];

  /** @java PlayerApp#playerNameList() */
  public abstract playerNameList(): Rectangle[];

  /** @java PlayerApp#playerSwatchHover() */
  public abstract playerSwatchHover(): boolean[];

  /** @java PlayerApp#playerNameHover() */
  public abstract playerNameHover(): boolean[];

  /** @java PlayerApp#repaint(Rectangle) */
  public abstract repaint(rect?: Rectangle): void;

  // ---------------------------------------------------------------------------
  // PlayerInterface — abstract methods (subclass provides them)
  // ---------------------------------------------------------------------------

  // All PlayerInterface methods that are NOT provided by this base class are
  // delegated to concrete subclasses via the abstract contract above.
  // The following PlayerInterface methods ARE implemented here:
  //   restartGame, postMoveUpdates
  // All others (getNameFromJar, loadGameFromName, addTextToStatusPanel, etc.)
  // must be implemented by the concrete subclass.

  /** @java PlayerInterface#getNameFromJar() */
  public abstract getNameFromJar(): Record<string, unknown> | null;

  /** @java PlayerInterface#getNameFromJson() */
  public abstract getNameFromJson(): Record<string, unknown> | null;

  /** @java PlayerInterface#getNameFromAiDef() */
  public abstract getNameFromAiDef(): Record<string, unknown> | null;

  /** @java PlayerInterface#loadGameFromName(String, List, boolean) */
  public abstract loadGameFromName(name: string, options: string[], debug: boolean): void;

  /** @java PlayerInterface#addTextToStatusPanel(String) */
  public abstract addTextToStatusPanel(text: string): void;

  /** @java PlayerInterface#addTextToAnalysisPanel(String) */
  public abstract addTextToAnalysisPanel(text: string): void;

  /** @java PlayerInterface#selectAnalysisTab() */
  public abstract selectAnalysisTab(): void;

  /** @java PlayerInterface#reportForfeit(int) */
  public abstract reportForfeit(playerForfeitNumber: number): void;

  /** @java PlayerInterface#reportTimeout(int) */
  public abstract reportTimeout(playerForfeitNumber: number): void;

  /** @java PlayerInterface#reportDrawAgreed() */
  public abstract reportDrawAgreed(): void;

  /** @java PlayerInterface#updateFrameTitle(boolean) */
  public abstract updateFrameTitle(alsoUpdateMenu: boolean): void;

  /** @java PlayerInterface#updateTabs(Context) */
  public abstract updateTabs(context: Context): void;

  /** @java PlayerInterface#repaintTimerForPlayer(int) */
  public abstract repaintTimerForPlayer(playerId: number): void;

  /** @java PlayerInterface#setTemporaryMessage(String) */
  public abstract setTemporaryMessage(text: string): void;

  /** @java PlayerInterface#refreshNetworkDialog() */
  public abstract refreshNetworkDialog(): void;

  // ---------------------------------------------------------------------------
  // Concrete accessors (app state)
  // ---------------------------------------------------------------------------

  /** @java PlayerApp#manager() */
  public manager(): Manager {
    return this._manager;
  }

  /** @java PlayerApp#bridge() */
  public bridge(): Bridge {
    return this._bridge;
  }

  /** @java PlayerApp#settingsPlayer() */
  public settingsPlayer(): SettingsPlayer {
    return this._settingsPlayer;
  }

  /** @java PlayerApp#contextSnapshot() */
  public contextSnapshot(): ContextSnapshot {
    return this._contextSnapshot;
  }

  /** @java PlayerApp#graphicsCache() */
  public graphicsCache(): GraphicsCache {
    return this._graphicsCache;
  }

  /** @java PlayerApp#remoteDialogFunctionsPublic() */
  public remoteDialogFunctionsPublic(): RemoteDialogFunctionsPublic {
    return this._remoteDialogFunctionsPublic;
  }

  // ---------------------------------------------------------------------------
  // PlatformGraphics — locationOfClickedImage
  // ---------------------------------------------------------------------------

  /**
   * Returns the FullLocation of the component associated with the image clicked on.
   *
   * @java PlayerApp#locationOfClickedImage(Point)
   */
  public locationOfClickedImage(pt: Point): Location {
    const overlappedLocations: Location[] = [];
    const allDrawn: unknown[] = this.graphicsCache().allDrawnComponents();
    for (let imageIndex = 0; imageIndex < allDrawn.length; imageIndex++) {
      const entry = allDrawn[imageIndex] as {
        pieceImage(): BufferedImage;
        imageInfo(): ImageInfo;
      };
      const image: BufferedImage = entry.pieceImage();
      const imageDrawPosn: Point = entry.imageInfo().drawPosn();

      const pointOverlaps: boolean = PlayerApp._pointOverlapsImage(pt, image, imageDrawPosn);

      if (pointOverlaps) {
        const clickedIndex: number = entry.imageInfo().site();
        const clickedLevel: number = entry.imageInfo().level();
        const clickedType = entry.imageInfo().graphElementType();
        overlappedLocations.push(new FullLocation(clickedIndex, clickedLevel, clickedType));
      }
    }

    if (overlappedLocations.length === 1) {
      return overlappedLocations[0] as Location;
    } else if (overlappedLocations.length > 1) {
      let highestLocation: Location | null = null;
      let highestLevel = -1;
      for (const location of overlappedLocations) {
        if (location.level() > highestLevel) {
          highestLevel = location.level();
          highestLocation = location;
        }
      }
      return highestLocation as Location;
    }

    return new FullLocation(UNDEFINED_CONST, 0, "Cell");
  }

  /**
   * Minimal shim for BufferedImageUtil.pointOverlapsImage.
   * When BufferedImageUtil is ported, remove this and call it directly.
   * @java BufferedImageUtil#pointOverlapsImage(Point, BufferedImage, Point)
   */
  private static _pointOverlapsImage(pt: Point, image: BufferedImage, imageDrawPosn: Point): boolean {
    if (!image) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w: number = (image as any).width as number ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h: number = (image as any).height as number ?? 0;
    return (
      pt.x >= imageDrawPosn.x &&
      pt.x < imageDrawPosn.x + w &&
      pt.y >= imageDrawPosn.y &&
      pt.y < imageDrawPosn.y + h
    );
  }

  // ---------------------------------------------------------------------------
  // PlatformGraphics — drawSVG
  // ---------------------------------------------------------------------------

  /**
   * Draws a single SVG image onto g2d at the position specified in imageInfo.
   *
   * @java PlayerApp#drawSVG(Context, Graphics2D, SVGGraphics2D, ImageInfo)
   */
  public drawSVG(
    _context: Context,
    g2d: Graphics2D,
    svg: SVGGraphics2D,
    imageInfo: ImageInfo,
  ): void {
    const componentImage: unknown = SVGUtil.createSVGImage(
      svg.getSVGElement(),
      imageInfo.imageSize(),
      imageInfo.imageSize(),
    );
    (g2d as unknown as { drawImage(img: unknown, x: number, y: number, obs: null): void }).drawImage(
      componentImage,
      imageInfo.drawPosn().x - Math.trunc(imageInfo.imageSize() / 2),
      imageInfo.drawPosn().y - Math.trunc(imageInfo.imageSize() / 2),
      null,
    );
  }

  // ---------------------------------------------------------------------------
  // PlatformGraphics — drawComponent
  // ---------------------------------------------------------------------------

  /**
   * Draws a component based on the specified ImageInfo.
   *
   * @java PlayerApp#drawComponent(Graphics2D, Context, ImageInfo)
   */
  public drawComponent(
    g2d: Graphics2D,
    context: Context,
    imageInfo: ImageInfo,
  ): void {
    const state: State = (context as unknown as { state: State }).state;
    const cs: ContainerState = (state as State).containerStates()[imageInfo.containerIndex()];
    const hiddenValue: number = HiddenUtil.siteHiddenBitsetInteger(
      context as unknown as Parameters<typeof HiddenUtil.siteHiddenBitsetInteger>[0],
      cs,
      imageInfo.site(),
      imageInfo.level(),
      (state as State).mover,
      imageInfo.graphElementType(),
    );
    const componentImage: BufferedImage = this.graphicsCache().getComponentImage(
      this._bridge,
      imageInfo.containerIndex(),
      imageInfo.component(),
      imageInfo.component()?.owner() ?? 0,
      imageInfo.localState(),
      imageInfo.value(),
      imageInfo.site(),
      imageInfo.level(),
      imageInfo.graphElementType(),
      imageInfo.imageSize(),
      context,
      hiddenValue,
      imageInfo.rotation(),
      false,
    );
    this.graphicsCache().drawPiece(
      g2d,
      context,
      componentImage,
      imageInfo.drawPosn(),
      imageInfo.site(),
      imageInfo.level(),
      imageInfo.graphElementType(),
      imageInfo.transparency(),
    );
    this._drawPieceCount(g2d, context, imageInfo, cs);
  }

  // ---------------------------------------------------------------------------

  /**
   * Draws the piece count label on a component image.
   *
   * @java PlayerApp#drawPieceCount(Graphics2D, Context, ImageInfo, ContainerState)
   */
  private _drawPieceCount(
    g2d: Graphics2D,
    context: Context,
    imageInfo: ImageInfo,
    cs: ContainerState,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctxAny = context as any;
    const equipment = ctxAny.game.equipment();
    const components: unknown[] = equipment.components() as unknown[];
    const whatIdx: number = (cs as ContainerState).what(imageInfo.site(), imageInfo.level(), imageInfo.graphElementType()) as number;
    const component = components[whatIdx] as { isDomino(): boolean; index(): number } | undefined;

    if (component?.isDomino()) return;

    const localState: number = (cs as ContainerState).state(imageInfo.site(), imageInfo.level(), imageInfo.graphElementType()) as number;
    const value: number = (cs as ContainerState).value(imageInfo.site(), imageInfo.level(), imageInfo.graphElementType()) as number;

    const stackTypeValue: number = ctxAny.game.metadata().graphics().stackMetadata(
      context,
      equipment.containers()[imageInfo.containerIndex()],
      imageInfo.site(),
      imageInfo.graphElementType(),
      localState,
      value,
      "Type" as StackPropertyType,
    ) as number;

    const componentStackType: PieceStackType | null = pieceStackTypeFromValue(Math.trunc(stackTypeValue));

    if (imageInfo.count() < 0) {
      this._drawCountValue(context, g2d, imageInfo, "?", 1, 1);
    }
    if (imageInfo.count() > 1) {
      this._drawCountValue(context, g2d, imageInfo, String(imageInfo.count()), 1, 1);
    } else if (componentStackType === "Count" && (cs as ContainerState).sizeStack(imageInfo.site(), imageInfo.graphElementType()) as number > 1) {
      this._drawCountValue(
        context, g2d, imageInfo,
        String((cs as ContainerState).sizeStack(imageInfo.site(), imageInfo.graphElementType())),
        1, 1,
      );
    } else if (componentStackType === "DefaultAndCount" && (cs as ContainerState).sizeStack(imageInfo.site(), imageInfo.graphElementType()) as number > 1) {
      this._drawCountValue(
        context, g2d, imageInfo,
        String((cs as ContainerState).sizeStack(imageInfo.site(), imageInfo.graphElementType())),
        1, 1,
      );
    } else if (componentStackType === "CountColoured" && (cs as ContainerState).sizeStack(imageInfo.site(), imageInfo.graphElementType()) as number > 1) {
      // Record the number of pieces owned by each player in this stack.
      const playerCountArray: number[] = new Array<number>(MAX_PLAYERS).fill(0);
      for (let i = 0; i < MAX_STACK_HEIGHT; i++) {
        if ((cs as ContainerState).what(imageInfo.site(), i, imageInfo.graphElementType()) as number !== 0) {
          const whoIdx = (cs as ContainerState).who(imageInfo.site(), i, imageInfo.graphElementType()) as number;
          playerCountArray[whoIdx] = (playerCountArray[whoIdx] ?? 0) + 1;
        }
      }

      // Record the total number of counts to be drawn.
      let totalCountsDrawn = 0;
      for (let i = 0; i < MAX_PLAYERS; i++) {
        if ((playerCountArray[i] ?? 0) !== 0) totalCountsDrawn++;
      }

      // Display the counts for each player.
      let numberCountsDrawn = 0;
      for (let i = 0; i < MAX_PLAYERS; i++) {
        if ((playerCountArray[i] ?? 0) !== 0) {
          this._drawCountValue(
            context, g2d, imageInfo,
            String(playerCountArray[i] ?? 0),
            ++numberCountsDrawn,
            totalCountsDrawn,
          );
        }
      }
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * For drawing a specific count value on an image, its position adjusted based
   * on how many are to be drawn.
   *
   * @param count             The count value.
   * @param numberCountsDrawn The index of this count, out of the total counts to be drawn.
   * @param totalCountsDrawn  The total number of counts to be drawn.
   *
   * @java PlayerApp#drawCountValue(Context, Graphics2D, ImageInfo, String, int, int)
   */
  private _drawCountValue(
    _context: Context,
    g2d: Graphics2D,
    imageInfo: ImageInfo,
    count: string,
    numberCountsDrawn: number,
    totalCountsDrawn: number,
  ): void {
    g2d.setFont(new Font("Arial", Font.PLAIN, Math.min(Math.trunc(imageInfo.imageSize() / 3), 20)));

    if (imageInfo.containerIndex() > 0) {
      g2d.setColor(Color.BLACK);
      if (SettingsExhibition.exhibitionVersion) {
        g2d.setColor(Color.WHITE);
      }
      // Java: g2d.getFont().getStringBounds(str, frc) → approximate via FontMetrics
      const fm1 = g2d.getFontMetrics(g2d.getFont());
      const countRectW: number = fm1.stringWidth("x" + count);
      const countRectH: number = fm1.getHeight();
      const drawPosnX: number = Math.trunc(
        imageInfo.drawPosn().x + imageInfo.imageSize() / 2 - countRectW / 2,
      );
      const drawPosnY: number = Math.trunc(
        imageInfo.drawPosn().y + imageInfo.imageSize() + (countRectH / 2) * 1.5,
      );
      g2d.drawString("x" + count, drawPosnX, drawPosnY);
    } else {
      g2d.setColor(
        this._bridge.getComponentStyle(imageInfo.component()?.index() ?? 0)?.getSecondaryColour?.() ?? Color.BLACK,
      );
      // Java: g2d.getFont().getStringBounds(str, frc) → approximate via FontMetrics
      const fm2 = g2d.getFontMetrics(g2d.getFont());
      const countRectH2: number = fm2.getHeight();
      const drawPosnX: number = imageInfo.drawPosn().x + Math.trunc(imageInfo.imageSize() / 2);
      const drawPosnY: number = imageInfo.drawPosn().y + Math.trunc(imageInfo.imageSize() / 2);
      StringUtil.drawStringAtPoint(
        g2d,
        count,
        null,
        new Point2D.Double(
          drawPosnX,
          drawPosnY + (numberCountsDrawn - 1) * countRectH2 -
            ((totalCountsDrawn - 1) * countRectH2) / 2,
        ),
        true,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // PlatformGraphics — drawBoard
  // ---------------------------------------------------------------------------

  /**
   * Draws the game board.
   *
   * @java PlayerApp#drawBoard(Context, Graphics2D, Rectangle2D)
   */
  public drawBoard(
    context: Context,
    g2d: Graphics2D,
    boardDimensions: Rectangle2D,
  ): void {
    if (this.graphicsCache().boardImage() === null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const board: Board = (context as any).board();
      this._bridge.getContainerStyle(board.index())?.render(PlaneType.BOARD, context);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svg: string | null | undefined = this._bridge.getContainerStyle(board.index())?.containerSVGImage();
      if (svg == null || svg === "") return;

      this.graphicsCache().setBoardImage(
        SVGUtil.createSVGImage(svg, boardDimensions.getWidth(), boardDimensions.getHeight()),
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boardHidden: boolean = (context as any).game.metadata().graphics().boardHidden() as boolean;

    if (!boardHidden) {
      (g2d as unknown as { drawImage(img: unknown, x: number, y: number, obs: null): void })
        .drawImage(this.graphicsCache().boardImage(), 0, 0, null);
    }
  }

  // ---------------------------------------------------------------------------
  // PlatformGraphics — drawGraph
  // ---------------------------------------------------------------------------

  /**
   * Draws the game board's graph.
   *
   * @java PlayerApp#drawGraph(Context, Graphics2D, Rectangle2D)
   */
  public drawGraph(
    context: Context,
    g2d: Graphics2D,
    boardDimensions: Rectangle2D,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const board: Board = (context as any).board();

    if (this.graphicsCache().graphImage() === null || (board.isBoardless() as boolean)) {
      this._bridge.getContainerStyle(board.index())?.render(PlaneType.GRAPH, context);

      const svg: string | null | undefined = this._bridge.getContainerStyle(board.index())?.graphSVGImage();
      if (svg == null) return;

      this.graphicsCache().setGraphImage(
        SVGUtil.createSVGImage(svg, boardDimensions.getWidth(), boardDimensions.getHeight()),
      );
    }

    (g2d as unknown as { drawImage(img: unknown, x: number, y: number, obs: null): void })
      .drawImage(this.graphicsCache().graphImage(), 0, 0, null);
  }

  // ---------------------------------------------------------------------------
  // PlatformGraphics — drawConnections
  // ---------------------------------------------------------------------------

  /**
   * Draws the game board's connections (dual graph).
   *
   * @java PlayerApp#drawConnections(Context, Graphics2D, Rectangle2D)
   */
  public drawConnections(
    context: Context,
    g2d: Graphics2D,
    boardDimensions: Rectangle2D,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const board: Board = (context as any).board();

    if (this.graphicsCache().connectionsImage() === null || (board.isBoardless() as boolean)) {
      this._bridge.getContainerStyle(board.index())?.render(PlaneType.CONNECTIONS, context);

      const svg: string | null | undefined = this._bridge.getContainerStyle(board.index())?.dualSVGImage();
      if (svg == null) return;

      this.graphicsCache().setConnectionsImage(
        SVGUtil.createSVGImage(svg, boardDimensions.getWidth(), boardDimensions.getHeight()),
      );
    }

    (g2d as unknown as { drawImage(img: unknown, x: number, y: number, obs: null): void })
      .drawImage(this.graphicsCache().connectionsImage(), 0, 0, null);
  }

  // ---------------------------------------------------------------------------
  // Misc
  // ---------------------------------------------------------------------------

  /** @java PlayerApp#clearGraphicsCache() */
  public clearGraphicsCache(): void {
    this.graphicsCache().clearAllCachedImages();
  }

  /**
   * @java PlayerApp#restartGame()
   */
  public restartGame(): void {
    // GameUtil.resetGame(this, false) — escape-hatch (GameUtil not yet ported).
    // No-op placeholder; override in subclass or replace when GameUtil is ported.
  }

  // ---------------------------------------------------------------------------
  // postMoveUpdates
  // ---------------------------------------------------------------------------

  /**
   * Called after a move is applied; handles animation and post-move tasks.
   *
   * @java PlayerApp#postMoveUpdates(Move, boolean)
   */
  public postMoveUpdates(move: Move, noAnimation: boolean): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctxAny = this._manager.ref().context() as any;
    const noAnim: boolean = ctxAny?.game?.metadata?.()?.graphics?.()?.noAnimation?.() as boolean ?? false;

    if (
      !noAnimation &&
      this._settingsPlayer.showAnimation() &&
      (this._bridge.settingsVC() as { pieceBeingDragged?(): boolean }).pieceBeingDragged?.() !== true &&
      !noAnim
    ) {
      if (this._settingsPlayer.animationType() === AnimationVisualsType.All) {
        // Animate all valid actions within the move.
        const singleActionMoves: Move[] = [];
        for (const a of (move as unknown as { actions(): Action[] }).actions()) {
          a.setDecision(true);
          // Create single-action move — escape-hatch: Move(Action) constructor
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const MoveCtor = (move as any).constructor as new (a: Action) => Move;
          const singleActionMove: Move = new MoveCtor(a);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (singleActionMove as any).setFromNonDecision(a.from());
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (singleActionMove as any).setToNonDecision(a.to());
          const animationType: AnimationType = MoveAnimation.getMoveAnimationType(this, singleActionMove);
          if (animationType !== AnimationType.NONE) {
            singleActionMoves.push(singleActionMove);
          }
        }
        if (singleActionMoves.length > 0) {
          this._animateMoves(singleActionMoves);
        }
      } else {
        // Animate just the first decision action within the move.
        this._animateMoves([move]);
      }
    } else {
      this.postAnimationUpdates(move);
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Animates a list of moves, one after the other.
   *
   * @java PlayerApp#animateMoves(List<Move>)
   */
  protected _animateMoves(moves: Move[]): void {
    const app = this;
    const move: Move = moves[0] as Move;
    const remainingMoves: Move[] = moves.slice(1);

    MoveAnimation.saveMoveAnimationDetails(this, move);

    if (SettingsExhibition.exhibitionVersion) {
      Sound.playSound("Ludemeljud5");
    }

    setTimeout(
      () => {
        const snapshotContext = app.contextSnapshot().getContext(app);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (move as any).apply(snapshotContext, false);
        app.contextSnapshot().setContext(snapshotContext);

        if (remainingMoves.length === 0) {
          app.postAnimationUpdates(move);
        } else {
          app._animateMoves(remainingMoves);
        }
      },
      MoveAnimation.ANIMATION_WAIT_TIME,
    );
  }

  // ---------------------------------------------------------------------------

  /**
   * Called after any animations for the moves have finished.
   *
   * @java PlayerApp#postAnimationUpdates(Move)
   */
  public postAnimationUpdates(move: Move): void {
    UpdateTabMessages.postMoveUpdateStatusTab(this as unknown as Parameters<typeof UpdateTabMessages.postMoveUpdateStatusTab>[0]);

    this._settingsPlayer.setComponentIsSelected(false);
    this._bridge.settingsVC().setSelectedFromLocation(new FullLocation(UNDEFINED_CONST));

    this._contextSnapshot.setContext(this);
    const context = this._contextSnapshot.getContext(this);

    // GameUtil.gameOverTasks — escape-hatch (GameUtil not yet ported); no-op for now.
    void context;

    MoveHandler.checkMoveWarnings(this as unknown as Parameters<typeof MoveHandler.checkMoveWarnings>[0]);

    const moveMover: number = (move as unknown as { mover: number }).mover ?? 0;
    if (
      move !== null &&
      this._manager.aiSelected()[this._manager.playerToAgent(moveMover)]?.ai() !== null
    ) {
      this.playSound("Pling-KevanGC-1485374730");
    }

    if (this._settingsPlayer.saveTrialAfterMove()) {
      this.saveTrial();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const needRedrawn: boolean = (context as any)?.game?.metadata?.()?.graphics?.()?.needRedrawn?.() as boolean ?? false;

    if (needRedrawn) {
      this.graphicsCache().clearAllCachedImages();
    }

    MoveAnimation.resetAnimationValues(this);
    this.updateFrameTitle(false);
    this.repaint();
  }

  // ---------------------------------------------------------------------------

  /**
   * Load specific game preferences for the current game.
   *
   * @java PlayerApp#loadGameSpecificPreferences()
   */
  public loadGameSpecificPreferences(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctxAny = this._manager.ref().context() as any;
    this._bridge.settingsColour().resetColours();

    const playerCount: number = ctxAny.game.players().count() as number;

    for (let pid = 0; pid <= playerCount + 1; pid++) {
      const colour: Color | null = ctxAny.game.metadata().graphics().playerColour(ctxAny, pid) as Color | null;

      if (pid > playerCount) {
        pid = MAX_PLAYERS + 1;
      }

      if (colour !== null) {
        this._bridge.settingsColour().setPlayerColour(pid, colour);
      }
    }

    ctxAny.game.setMaxTurns(
      this._manager.settingsManager().turnLimit(ctxAny.game.name() as string),
    );
  }

  // ---------------------------------------------------------------------------
}
