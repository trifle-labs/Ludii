// @java Player/src/app/utils/GameSetup.java

import { Description } from "../../../../Common/src/main/grammar/Description.js";
import { Report } from "../../../../Common/src/main/grammar/Report.js";
import { ReportMessengerGUI } from "./ReportMessengerGUI.js";

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported deps
// ---------------------------------------------------------------------------

/**
 * Minimal structural type for app.PlayerApp (not yet ported).
 * @java app.PlayerApp
 */
interface PlayerApp {
  manager(): Manager;
  reportError(msg: string): void;
  addTextToStatusPanel(text: string): void;
  loadGameSpecificPreferences(): void;
  loadGameFromName(name: string, options: string[], debug: boolean): void;
  writeTextToFile(filename: string, content: string): void;
  addTextToAnalysisPanel(text: string): void;
}

/**
 * Minimal structural type for manager.Manager.
 * @java manager.Manager
 */
interface Manager {
  settingsManager(): { userSelections(): unknown };
  ref(): { setGame(manager: Manager, game: GameShape): void; context(): ContextShape };
  aiSelected(): { setAI(ai: unknown): void }[];
  settingsNetwork(): SettingsNetworkShape;
  databaseFunctionsPublic(): { getRNG(manager: Manager): string };
  setCurrGameStartRngState(state: unknown): void;
}

/**
 * Minimal structural type for game.Game.
 * @java game.Game
 */
interface GameShape {
  name(): string;
  hasMissingRequirement(): boolean;
  requirementReport(): string[];
  willCrash(): boolean;
  crashReport(): string[];
  equipmentWithStochastic(): boolean;
  setMaxTurns(limit: number): void;
}

/**
 * Minimal structural type for other.context.Context.
 * @java other.context.Context
 */
interface ContextShape {
  game(): GameShape;
  rng(): { restoreState(state: unknown): void };
}

/**
 * Minimal structural type for manager.network.SettingsNetwork.
 * @java manager.network.SettingsNetwork
 */
interface SettingsNetworkShape {
  setLoadingNetworkGame(value: boolean): void;
  setActiveGameId(id: number): void;
  setNetworkPlayerNumber(num: number): void;
  setOnlineAIAllowed(allowed: boolean): void;
}

/**
 * Minimal structural type for manager.ai.AIDetails.
 * @java manager.ai.AIDetails
 */
interface AIDetailsShape {
  ai(): { closeAI(): void } | null;
}

/**
 * Escape-hatch for compiler.Compiler.
 * Not yet ported — represented as a stub.
 * @java compiler.Compiler
 */
interface ICompiler {
  compile(description: Description, userSelections: unknown, report: Report, debug: boolean): unknown;
}

/** Compiler is provided by an injectable singleton. */
let _compiler: ICompiler | null = null;

/** Inject a Compiler implementation (called by the platform layer). */
export function setCompiler(compiler: ICompiler): void {
  _compiler = compiler;
}

/**
 * Escape-hatch for main.Constants.MAX_PLAYERS.
 * @java main.Constants.MAX_PLAYERS
 */
const MAX_PLAYERS = 16;

/**
 * Escape-hatch for RandomProviderDefaultState.
 * @java org.apache.commons.rng.core.RandomProviderDefaultState
 */
type RandomProviderDefaultState = { bytes: Uint8Array };

// ---------------------------------------------------------------------------

/**
 * Functions to assist with setting up games.
 *
 * @author Matthew.Stephenson
 * @java app.utils.GameSetup
 */
export class GameSetup {

  // ---------------------------------------------------------------------------

  /**
   * Compile and display the specified description with the corresponding menu options.
   *
   * @java GameSetup#compileAndShowGame(PlayerApp, String, boolean)
   */
  public static compileAndShowGame(
    app: PlayerApp,
    desc: string,
    debug: boolean,
  ): void {
    const gameDescription = new Description(desc);
    const report = new Report();
    report.setReportMessageFunctions(new ReportMessengerGUI(app));

    try {
      if (_compiler === null) {
        throw new Error("Compiler not injected — call GameSetup.setCompiler() first.");
      }
      const game = _compiler.compile(
        gameDescription,
        app.manager().settingsManager().userSelections(),
        report,
        debug,
      ) as GameShape;
      app.manager().ref().setGame(app.manager(), game);

      GameSetup.printCompilationMessages(app, game, debug, report);

      // Reset all AI objects to null to free memory space.
      for (let i = 0; i < app.manager().aiSelected().length; i++) {
        app.manager().aiSelected()[i]?.setAI(null);
      }

      app.loadGameSpecificPreferences();
      // GameUtil.resetGame(app, false) — forward call to GameUtil when available.
      // Escape-hatch: GameUtil not yet ported; the platform layer must hook resetGame.
      GameSetup._resetGameHook?.(app, false);
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        app.reportError(e.message);
      }
    }

    // Try to make GC run (no-op hint in JS)
    // System.gc() — no equivalent in JS.
  }

  // ---------------------------------------------------------------------------

  /**
   * Hook to allow external code to bind GameUtil.resetGame.
   * @java app.utils.GameUtil#resetGame(PlayerApp, boolean)
   */
  static _resetGameHook: ((app: PlayerApp, keepCurrentBoard: boolean) => void) | null = null;

  /**
   * Hook to allow external code to bind GameUtil.startGame.
   * @java app.utils.GameUtil#startGame(PlayerApp)
   */
  static _startGameHook: ((app: PlayerApp) => void) | null = null;

  // ---------------------------------------------------------------------------

  /**
   * @java GameSetup#printCompilationMessages(PlayerApp, Game, boolean, Report)
   */
  private static printCompilationMessages(
    app: PlayerApp,
    game: GameShape,
    debug: boolean,
    report: Report,
  ): void {
    app.addTextToStatusPanel("-------------------------------------------------\n");
    app.addTextToStatusPanel("Compiled " + game.name() + " successfully.\n");

    if (report.isWarning()) {
      for (const warning of report.warnings()) {
        app.reportError("Warning: " + warning);
      }
    }
    if (game.hasMissingRequirement()) {
      app.reportError("");
      app.reportError("Requirement Warning: ");
      const missingRequirements = game.requirementReport();
      for (const missingRequirement of missingRequirements) {
        app.reportError("--> " + missingRequirement);
      }
      app.reportError("");
    }
    if (game.willCrash()) {
      app.reportError("");
      app.reportError("Crash Warning: ");
      const crashes = game.crashReport();
      for (const crash of crashes) {
        app.reportError("--> " + crash);
      }
      app.reportError("");
    }
    if (game.equipmentWithStochastic()) {
      app.addTextToStatusPanel(
        "Warning: This game uses stochastic equipment, automatic trial saving is disabled.\n",
      );
    }
    if (debug) {
      app.writeTextToFile("debug_log.txt", report.log());
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Set up a network game.
   *
   * @java GameSetup#setupNetworkGame(PlayerApp, String, List, String, boolean, int, int)
   */
  public static setupNetworkGame(
    app: PlayerApp,
    gameName: string,
    gameOptions: string[],
    inputLinePlayerNumber: string,
    aiAllowed: boolean,
    selectedGameID: number,
    turnLimit: number,
  ): void {
    app.manager().settingsNetwork().setLoadingNetworkGame(true);

    try {
      if (inputLinePlayerNumber !== "" && GameSetup.isInteger(inputLinePlayerNumber)) {
        // Disable features which are not allowed in network games.
        // settingsPlayer() — SettingsPlayer not yet in this call, accessed via PlayerApp
        const sp = (app as unknown as { settingsPlayer(): SettingsPlayerShape }).settingsPlayer();
        sp.setCursorTooltipDev(false);
        sp.setSwapRule(false);
        sp.setNoRepetition(false);
        sp.setNoRepetitionWithinTurn(false);
        sp.setSandboxMode(false);

        const playerNumber = parseInt(inputLinePlayerNumber, 10);

        app.manager().settingsNetwork().setActiveGameId(selectedGameID);
        app.manager().settingsNetwork().setNetworkPlayerNumber(playerNumber);

        // Format the stored string into the syntax needed for loading the game.
        const formattedGameOptions: string[] = [];
        for (let i = 0; i < gameOptions.length; i++) {
          let formattedString = gameOptions[i] ?? "";
          formattedString = formattedString.replace(/_/g, " ");
          formattedString = formattedString.replace(/\|/g, "/");
          formattedGameOptions.push(formattedString);
        }

        const firstOption = formattedGameOptions[0] ?? "";
        if (firstOption !== "-" && firstOption !== "") {
          app.loadGameFromName(gameName, formattedGameOptions, false);
        } else {
          app.loadGameFromName(gameName, [], false);
        }

        if (playerNumber > MAX_PLAYERS) {
          app.addTextToStatusPanel("Joined game as a spectator\n");
        } else {
          app.addTextToStatusPanel("Joined game as player number " + playerNumber + "\n");
        }

        app.manager().ref().context().game().setMaxTurns(turnLimit);
        const gameRNG = app.manager().databaseFunctionsPublic().getRNG(app.manager());

        const byteStrings = gameRNG.split(",");
        const bytes = new Uint8Array(byteStrings.length);
        for (let i = 0; i < byteStrings.length; i++) {
          bytes[i] = parseInt(byteStrings[i] ?? "0", 10);
        }

        // RandomProviderDefaultState — escape-hatch
        const rngState: RandomProviderDefaultState = { bytes };
        app.manager().ref().context().rng().restoreState(rngState);

        // GameUtil.startGame(app)
        GameSetup._startGameHook?.(app);
        app.manager().setCurrGameStartRngState(rngState);

        for (let i = 0; i < app.manager().aiSelected().length; i++) {
          const aiDetails = app.manager().aiSelected()[i] as unknown as AIDetailsShape;
          if (aiDetails.ai() !== null) {
            aiDetails.ai()!.closeAI();
          }
          // new AIDetails(app.manager(), null, i, "Human") — recreate via escape-hatch
          (app.manager().aiSelected() as unknown[])[i] = GameSetup._makeAIDetailsHook?.(
            app.manager(),
            null,
            i,
            "Human",
          ) ?? null;
        }

        app.manager().settingsNetwork().setOnlineAIAllowed(aiAllowed);
      } else {
        app.addTextToStatusPanel(inputLinePlayerNumber);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
      }
    }

    app.manager().settingsNetwork().setLoadingNetworkGame(false);
  }

  // ---------------------------------------------------------------------------

  /**
   * Hook to allow external code to build AIDetails instances.
   * @java new manager.ai.AIDetails(Manager, AI, int, String)
   */
  static _makeAIDetailsHook:
    | ((manager: Manager, ai: unknown, playerIdx: number, name: string) => unknown)
    | null = null;

  // ---------------------------------------------------------------------------

  /**
   * Checks if a string represents an integer.
   * Equivalent to util.StringUtil.isInteger.
   * @java util.StringUtil#isInteger(String)
   */
  private static isInteger(s: string): boolean {
    return /^-?\d+$/.test(s.trim());
  }

  // ---------------------------------------------------------------------------
}

// ---------------------------------------------------------------------------
// Minimal structural type for SettingsPlayer (avoid circular import;
// SettingsPlayer is in the same batch).
// ---------------------------------------------------------------------------

/** @java app.utils.SettingsPlayer */
interface SettingsPlayerShape {
  setCursorTooltipDev(value: boolean): void;
  setSwapRule(value: boolean): void;
  setNoRepetition(value: boolean): void;
  setNoRepetitionWithinTurn(value: boolean): void;
  setSandboxMode(value: boolean): void;
}
