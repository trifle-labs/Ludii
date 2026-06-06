// @java Player/src/app/views/BoardView.java

import { BasicStroke, Color, Graphics2D, Rectangle } from "../../../../awt/index.js";
import { View, type PlayerApp } from "./View.js";
import { SettingsExhibition } from "../utils/SettingsExhibition.js";
import { PlaneType } from "../../../../ViewController/src/util/PlaneType.js";

// ---------------------------------------------------------------------------
// Escape-hatch types
// ---------------------------------------------------------------------------

/** @java app.move.MoveVisuals */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MoveVisuals = any;

// ---------------------------------------------------------------------------

/**
 * Panel showing the game board.
 *
 * @author Matthew.Stephenson and cambolbro
 * @java app.views.BoardView
 */
export class BoardView extends View {

  /** Maximum percentage of application display width that board can take up. @java BoardView#boardToSizeRatio */
  private readonly boardToSizeRatio: number = 1.0;

  /** Size of the board. @java BoardView#boardSize */
  private readonly boardSize_: number;

  // -------------------------------------------------------------------------

  /**
   * @java BoardView(PlayerApp, boolean)
   */
  constructor(app: PlayerApp, exhibitionMode: boolean) {
    super(app);
    if (exhibitionMode) {
      this.boardSize_ = Math.min(app.height(), Math.trunc(app.width() * this.boardToSizeRatio));
      this.placement = new Rectangle(app.width() - this.boardSize_ + 30, 30, this.boardSize_, this.boardSize_);
      app.bridge().getContainerStyle(0).setDefaultBoardScale(0.7);
    } else if (SettingsExhibition.exhibitionVersion) {
      this.boardSize_ = Math.trunc(app.width() * 0.65);
      this.placement = new Rectangle(0, 0, this.boardSize_, this.boardSize_);
    } else {
      this.boardSize_ = Math.min(app.height(), Math.trunc(app.width() * this.boardToSizeRatio));
      this.placement = new Rectangle(0, 0, this.boardSize_, this.boardSize_);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java BoardView#paint(Graphics2D)
   */
  public override paint(g2d: Graphics2D): void {
    // Add border around board for exhibition app.
    if (this.app.settingsPlayer().usingMYOGApp()) {
      g2d.setColor(Color.black);
      g2d.setStroke(new BasicStroke(1, BasicStroke.CAP_SQUARE, BasicStroke.JOIN_MITER));
      g2d.fillRoundRect(
        this.placement.x + 50,
        this.placement.y + 50,
        this.placement.width - 100,
        this.placement.height - 100,
        40,
        40,
      );
      this.app.settingsPlayer().setBoardPlacement(
        new Rectangle(
          this.placement.x + 120,
          this.placement.y + 120,
          this.placement.width - 240,
          this.placement.height - 240,
        ),
      );
      this.app.settingsPlayer().setBoardMarginPlacement(
        new Rectangle(
          this.placement.x + 50,
          this.placement.y + 50,
          this.placement.width - 100,
          this.placement.height - 100,
        ),
      );
    }

    const context = this.app.contextSnapshot().getContext(this.app);

    this.app.bridge().getContainerStyle(context.board().index()).setPlacement(context, this.placement);

    if (this.app.settingsPlayer().showBoard() || context.board().isBoardless()) {
      this.app.bridge().getContainerStyle(context.board().index()).draw(g2d, PlaneType.BOARD, context);
    }

    if (this.app.settingsPlayer().showGraph()) {
      this.app.bridge().getContainerStyle(context.board().index()).draw(g2d, PlaneType.GRAPH, context);
    }

    if (this.app.settingsPlayer().showConnections()) {
      this.app.bridge().getContainerStyle(context.board().index()).draw(g2d, PlaneType.CONNECTIONS, context);
    }

    if (this.app.settingsPlayer().showAxes()) {
      this.app.bridge().getContainerStyle(context.board().index()).draw(g2d, PlaneType.AXES, context);
    }

    if (this.app.settingsPlayer().showPieces()) {
      this.app.bridge().getContainerStyle(context.board().index()).draw(g2d, PlaneType.COMPONENTS, context);
    }

    if (context.game().isDeductionPuzzle()) {
      this.app.bridge().getContainerStyle(context.board().index()).draw(g2d, PlaneType.HINTS, context);
    }

    if (this.app.bridge().settingsVC().showCandidateValues() && context.game().isDeductionPuzzle()) {
      this.app.bridge().getContainerStyle(context.board().index()).draw(g2d, PlaneType.CANDIDATES, context);
    }

    this.app.bridge().getContainerStyle(context.board().index()).draw(g2d, PlaneType.TRACK, context);
    this.app.bridge().getContainerStyle(context.board().index()).draw(g2d, PlaneType.PREGENERATION, context);
    this.app.bridge().getContainerStyle(context.board().index()).draw(g2d, PlaneType.INDICES, context);
    this.app.bridge().getContainerStyle(context.board().index()).draw(g2d, PlaneType.COSTS, context);
    this.app.bridge().getContainerStyle(context.board().index()).draw(g2d, PlaneType.POSSIBLEMOVES, context);

    // Originally in the overlay view, but moved here to work with web app.
    if (
      this.app.settingsPlayer().showEndingMove() &&
      context.currentInstanceContext().trial().moveNumber() > 0 &&
      context.game().endRules() != null &&
      !this.app.settingsPlayer().sandboxMode()
    ) {
      // MoveVisuals.drawEndingMove — escape-hatch (app.move.MoveVisuals not yet ported)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const MoveVisualsMod = (globalThis as any).__LudiiMoveVisuals as MoveVisuals;
      if (MoveVisualsMod?.drawEndingMove) {
        MoveVisualsMod.drawEndingMove(this.app, g2d, context);
      }
    }

    this.paintDebug(g2d, Color.CYAN);
  }

  // -------------------------------------------------------------------------

  /**
   * @java BoardView#containerIndex()
   */
  public override containerIndex(): number {
    return this.app.contextSnapshot().getContext(this.app).board().index();
  }

  /**
   * @java BoardView#boardSize()
   */
  public boardSize(): number {
    return this.boardSize_;
  }
}
