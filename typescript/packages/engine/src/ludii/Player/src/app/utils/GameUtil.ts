// @java Player/src/app/utils/GameUtil.java

import { MoveHandler } from "../move/MoveHandler.js";
import { MoveAnimation } from "../move/animation/MoveAnimation.js";
import { MVCSetup } from "./MVCSetup.js";
import { UpdateTabMessages } from "./UpdateTabMessages.js";
import { GameSetup } from "./GameSetup.js";
import { AIUtil } from "../../../../Manager/src/manager/ai/AIUtil.js";
import { TournamentUtil } from "../../../../Manager/src/tournament/TournamentUtil.js";

// ---------------------------------------------------------------------------
// Escape-hatch types for deps not yet ported in this batch.
// ---------------------------------------------------------------------------

/** @java app.PlayerApp */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlayerApp = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java other.move.Move */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Move = any;

/** @java main.options.Ruleset */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ruleset = any;

/** @java manager.Referee */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Referee = any;

/** @java main.Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

// ---------------------------------------------------------------------------

/**
 * Utility functions for games.
 *
 * @java app.utils.GameUtil
 * @author Matthew.Stephenson
 */
export class GameUtil {

  // ---------------------------------------------------------------------------

  /**
   * All function calls needed to restart the game.
   *
   * @java GameUtil.resetGame(PlayerApp, boolean)
   */
  public static resetGame(app: PlayerApp, keepSameTrial: boolean): void {
    const ref: Referee = app.manager().ref();
    const context: Context = ref.context();
    let game = context.game;

    app.manager().undoneMoves().clear();
    ref.interruptAI(app.manager());
    AIUtil.checkAISupported(app.manager(), context);

    // Web Player settings
    app.settingsPlayer().setWebGameResultValid(true);
    for (let i = 0; i <= game.players.count(); i++) {
      if (app.manager().aiSelected()[app.manager().playerToAgent(i)]?.ai() != null) {
        app.settingsPlayer().setAgentArray(i, true);
      } else {
        app.settingsPlayer().setAgentArray(i, false);
      }
    }

    // If game has stochastic equipment, need to recompile the whole game from scratch.
    if (typeof game.equipmentWithStochastic === "function" && game.equipmentWithStochastic()) {
      // Escape-hatch: compiler.Compiler not yet ported — use app's compile method if available.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Compiler: any = (globalThis as any).__LudiiCompiler;
      if (Compiler) {
        game = Compiler.compile(game.description(), app.manager().settingsManager().userSelections(), null, false);
      }
      app.manager().ref().setGame(app.manager(), game);
    }

    if (keepSameTrial) {
      // Reset all necessary information about the context.
      context.rng.restoreState(app.manager().currGameStartRngState());
      context.reset();
      context.state.initialise(context.currentInstanceContext().game);
      context.trial.setStatus(null);
    } else {
      app.manager().ref().setGame(app.manager(), game);
      UpdateTabMessages.postMoveUpdateStatusTab(app);
    }

    // Start the game
    GameUtil.startGame(app);

    GameUtil.updateRecentGames(app, app.manager().ref().context().game.name ?? app.manager().ref().context().game.name());
    GameUtil.resetUIVariables(app);
  }

  // ---------------------------------------------------------------------------

  /**
   * @java GameUtil.resetUIVariables(PlayerApp)
   */
  public static resetUIVariables(app: PlayerApp): void {
    app.contextSnapshot().setContext(app);
    MVCSetup.setMVC(app);

    app.bridge().setGraphicsRenderer(app);

    app.manager().ref().interruptAI(app.manager());

    app.bridge().settingsVC().setSelectedFromLocation(
      { site: () => UNDEFINED, siteType: () => "Cell", level: () => 0 },
    );
    app.bridge().settingsVC().setSelectingConsequenceMove(false);
    app.settingsPlayer().setCurrentWalkExtra(0);
    MoveAnimation.resetAnimationValues(app);

    app.manager().settingsManager().movesAllowedWithRepetition().clear();
    app.manager().settingsManager().storedGameStatesForVisuals().clear();
    app.manager().settingsManager().storedGameStatesForVisuals().add(
      BigInt(app.manager().ref().context().state.stateHash()),
    );

    app.settingsPlayer().setComponentIsSelected(false);
    app.bridge().settingsVC().setPieceBeingDragged(false);
    app.settingsPlayer().setDragComponent(null);

    app.setTemporaryMessage("");

    app.manager().settingsNetwork().resetNetworkPlayers();

    app.updateFrameTitle(true);

    AIUtil.pauseAgentsIfNeeded(app.manager());

    if (app.manager().isWebApp()) {
      const context: Context = app.manager().ref().context();

      // Check if that game contains a shared hand (above the board)
      let hasSharedHand = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const container of (context.equipment().containers() as any[])) {
        if (container.role().equals("Shared")) hasSharedHand = true;
      }

      // Check if the game has custom hand placement
      let hasCustomHandPlacement = false;
      // @java main.Constants.MAX_PLAYERS = 16
      const MAX_PLAYERS = 16;
      for (let i = 0; i <= MAX_PLAYERS; i++) {
        if (context.game.metadata().graphics().handPlacement(context, i) != null) {
          hasCustomHandPlacement = true;
        }
      }

      const boardBackground =
        context.game.metadata().graphics().boardBackground(context).size() > 0;

      // Make the margins around the board thinner
      if (
        context.board().defaultSite().equals("Cell") &&
        !hasSharedHand &&
        !boardBackground &&
        !hasCustomHandPlacement
      ) {
        app.bridge().getContainerStyle(0).setDefaultBoardScale(0.95);
      }
    }

    MoveHandler.checkMoveWarnings(app);

    // Equivalent of EventQueue.invokeLater
    Promise.resolve().then(() => {
      app.repaint();
    });
  }

  // ---------------------------------------------------------------------------

  /**
   * Various tasks that are performed when a normal game ends.
   *
   * @java GameUtil.gameOverTasks(PlayerApp, Move)
   */
  public static gameOverTasks(app: PlayerApp, move: Move): void {
    const context: Context = app.manager().ref().context();
    const moveNumber: number =
      context.currentInstanceContext().trial().numMoves() - 1;

    if (context.trial().over() && context.trial().lastMove().equals(move)) {
      app.addTextToStatusPanel(
        UpdateTabMessages.gameOverMessage(app.manager().ref().context(), context.trial()),
      );
      app.manager().databaseFunctionsPublic().sendResultToDatabase(app.manager(), context);
      TournamentUtil.saveTournamentResults(app.manager(), app.manager().ref().context());

      if (app.manager().isWebApp()) {
        app.setTemporaryMessage(
          UpdateTabMessages.gameOverMessage(
            app.manager().ref().context(),
            app.manager().ref().context().trial(),
          ),
        );
      } else if (!app.settingsPlayer().usingMYOGApp()) {
        app.setTemporaryMessage("Choose Game > Restart to play again.");
      }
    } else if (
      context.isAMatch() &&
      moveNumber < context.currentInstanceContext().trial().numInitialPlacementMoves()
    ) {
      GameUtil.resetUIVariables(app);
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * @java GameUtil.startGame(PlayerApp)
   */
  public static startGame(app: PlayerApp): void {
    const context: Context = app.manager().ref().context();
    context.game.start(context);
    context.game.incrementGameStartCount();

    const numPlayers: number = context.game.players().count();
    for (let p = 0; p < app.manager().aiSelected().length; ++p) {
      // Close AI players that may have had data from previous game
      if (app.manager().aiSelected()[p]?.ai() != null) {
        app.manager().aiSelected()[p].ai().closeAI();
      }
      // Initialise AI players (only if player ID relevant)
      if (p <= numPlayers && app.manager().aiSelected()[p]?.ai() != null) {
        app.manager().aiSelected()[p].ai().initIfNeeded(context.game, p);
      }
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Add gameName to the list of recent games, or update its position in this list.
   * These games can then be selected from the menu bar.
   *
   * @java GameUtil.updateRecentGames(PlayerApp, String)
   */
  private static updateRecentGames(app: PlayerApp, gameName: string): void {
    let gameMenuName: string = gameName;
    const recentGames: (string | null)[] = app.settingsPlayer().recentGames();

    if (!app.settingsPlayer().loadedFromMemory()) {
      gameMenuName = app.manager().savedLudName();
    }

    let gameAlreadyIncluded = -1;

    // Check if the game is already included in our recent games list, and record its position.
    for (let i = 0; i < recentGames.length; i++) {
      if (recentGames[i] != null && recentGames[i] === gameMenuName) {
        gameAlreadyIncluded = i;
      }
    }

    // If game was not already in recent games list, record the last position on the list
    if (gameAlreadyIncluded === -1) {
      gameAlreadyIncluded = recentGames.length - 1;
    }

    // Shift all games ahead of the record position down a spot.
    for (let i = gameAlreadyIncluded; i > 0; i--) {
      recentGames[i] = recentGames[i - 1]!;
    }

    // Add game at front of recent games list.
    recentGames[0] = gameMenuName;
  }

  // ---------------------------------------------------------------------------

  /**
   * @java GameUtil.checkMatchingRulesets(PlayerApp, Game, String)
   */
  public static checkMatchingRulesets(
    app: PlayerApp,
    game: Context["game"],
    rulesetName: string,
  ): boolean {
    const rulesets: Ruleset[] = game.description().rulesets();
    let rulesetSelected = false;

    if (rulesets != null && rulesets.length > 0) {
      for (let rs = 0; rs < rulesets.length; rs++) {
        const ruleset: Ruleset = rulesets[rs];
        if (ruleset.heading() === rulesetName) {
          // Match!
          app.manager().settingsManager().userSelections().setRuleset(rs);

          // Set the game options according to the chosen ruleset
          app.manager().settingsManager().userSelections().setSelectOptionStrings(
            [...ruleset.optionSettings()],
          );

          rulesetSelected = true;

          try {
            GameSetup.compileAndShowGame(app, game.description().raw(), false);
          } catch (_exception) {
            GameUtil.resetGame(app, false);
          }

          break;
        }
      }
    }

    return rulesetSelected;
  }

  // ---------------------------------------------------------------------------
}
