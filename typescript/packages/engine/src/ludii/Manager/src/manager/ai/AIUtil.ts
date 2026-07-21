// @java Manager/src/manager/ai/AIUtil.java

import type { AI } from "../../../../../ai/ai.js";
import type { Context } from "../../../../../context.js";
import { AIDetails, type JSONObject } from "./AIDetails.js";

/**
 * Escape-hatch for utils.AIRegistry.
 * @java utils.AIRegistry
 */
const AIRegistry_processJson = (_json: JSONObject): void => {
  // Not yet ported — no-op.
};

/**
 * Escape-hatch for utils.AIUtils.defaultAiForGame.
 * @java utils.AIUtils
 */
const AIUtils_defaultAiForGame = (_game: unknown): AI => {
  // Not yet ported — return a minimal AI stub.
  return {
    friendlyName: "Random",
    selectAction: () => undefined,
    initAI(_playerId: number) {},
    closeAI() {},
  } as unknown as AI;
};

/**
 * Escape-hatch for other.model.SimultaneousMove.
 * @java other.model.SimultaneousMove
 */
type SimultaneousMove = object;

/**
 * Manager shape needed by AIUtil — avoids circular import with Manager.ts.
 * Uses `unknown` in recursive manager-parameter positions to break the
 * structural type recursion that TypeScript struggles with.
 * @java manager.Manager
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ManagerShape = {
  aiSelected(): (AIDetails | null)[];
  moverToAgent(): number;
  ref(): {
    context(): Context & {
      game: {
        players: { count(): number };
      };
      model?: () => ({
        isInstanceOf?: (type: unknown) => boolean;
        constructor?: { name: string };
      } | SimultaneousMove);
    };
    interruptAI(manager: unknown): void;
  };
  settingsManager(): {
    setAgentsPaused(manager: unknown, paused: boolean): void;
  };
  settingsNetwork(): {
    getActiveGameId(): number;
    getOnlineAIAllowed(): boolean;
    backupAiPlayers(manager: unknown): void;
  };
  getPlayerInterface(): {
    addTextToStatusPanel(text: string): void;
    getNameFromJar(): JSONObject | null;
    getNameFromJson(): JSONObject | null;
    getNameFromAiDef(): JSONObject | null;
  };
};

/**
 * Functions for handling AI agents.
 *
 * @java manager.ai.AIUtil
 * @author Matthew.Stephenson
 */
export class AIUtil {

  /**
   * Cycles all players backwards by one.
   * @java AIUtil.cycleAgents(Manager)
   */
  public static cycleAgents(manager: ManagerShape): void {
    manager.settingsManager().setAgentsPaused(manager, true);

    const playerCount = manager.ref().context().game.players.count();
    // Cast to AIDetails's ManagerShape (structurally compatible, avoids TS recursive type mismatch)
    const m = manager as unknown as Parameters<typeof AIDetails.getCopyOf>[0];
    const player1Details = AIDetails.getCopyOf(m, manager.aiSelected()[1] ?? null, 1);

    for (let i = 2; i <= playerCount; i++) {
      manager.aiSelected()[i - 1] = AIDetails.getCopyOf(m, manager.aiSelected()[i] ?? null, i);
    }

    manager.aiSelected()[playerCount] = player1Details;

    manager.settingsNetwork().backupAiPlayers(manager);
  }

  // -------------------------------------------------------------------------

  /**
   * Update the selected AI agents for the given player numbers.
   * @java AIUtil.updateSelectedAI(Manager, JSONObject, int, String)
   */
  public static updateSelectedAI(
    manager: ManagerShape,
    inJSON: JSONObject,
    playerNum: number,
    aiMenuName: string,
  ): void {
    let menuName = aiMenuName;
    let json = inJSON;
    const aiObj = (json["AI"] ?? {}) as JSONObject;
    const algName = (aiObj["algorithm"] as string) ?? "";

    // Cast to AIDetails's ManagerShape (structurally compatible, avoids TS recursive type mismatch)
    const m = manager as unknown as ConstructorParameters<typeof AIDetails>[0];
    if (algName === "Human") {
      // First close previous AI if it exists
      manager.aiSelected()[playerNum]?.ai()?.closeAI();
      manager.aiSelected()[playerNum] = new AIDetails(m, null, playerNum, "Human");
      return;
    } else if (algName === "From JAR") {
      if (!("JAR File" in aiObj) || !("Class Name" in aiObj)) {
        const newJson = manager.getPlayerInterface().getNameFromJar();
        if (newJson === null) return;
        json = newJson;
        menuName = "From JAR";
      }
    } else if (algName === "From JSON") {
      if (!("JSON File" in aiObj) || !("Class Name" in aiObj)) {
        const newJson = manager.getPlayerInterface().getNameFromJson();
        if (newJson === null) return;
        json = newJson;
        menuName = "From JSON";
      }
    } else if (algName === "From AI.DEF") {
      if (!("AI.DEF File" in aiObj) || !("Class Name" in aiObj)) {
        const newJson = manager.getPlayerInterface().getNameFromAiDef();
        if (newJson === null) return;
        json = newJson;
        menuName = "From AI.DEF";
      }
    } else {
      AIRegistry_processJson(json);
    }

    // First close previous AI if it exists
    manager.aiSelected()[playerNum]?.ai()?.closeAI();

    manager.aiSelected()[playerNum] = new AIDetails(m, json, playerNum, menuName);

    manager.settingsNetwork().backupAiPlayers(manager);
    AIUtil.pauseAgentsIfNeeded(manager);
  }

  // -------------------------------------------------------------------------

  /**
   * Pauses all agents if required.
   * Should be called any time the game is restarted/loaded, or an AI is selected.
   * @java AIUtil.pauseAgentsIfNeeded(Manager)
   */
  public static pauseAgentsIfNeeded(manager: ManagerShape): void {
    const context = manager.ref().context();
    const model = context.model?.();

    if (manager.settingsNetwork().getActiveGameId() !== 0 && !manager.settingsNetwork().getOnlineAIAllowed()) {
      manager.settingsManager().setAgentsPaused(manager, true);
    } else if (manager.aiSelected()[manager.moverToAgent()]?.ai() !== null) {
      manager.settingsManager().setAgentsPaused(manager, true);
    } else if (model !== undefined && model !== null && (model as { constructor?: { name: string } }).constructor?.name === "SimultaneousMove") {
      manager.settingsManager().setAgentsPaused(manager, true);
    } else if (context.game.players.count() === 0) {
      manager.settingsManager().setAgentsPaused(manager, true);
    } else {
      manager.settingsManager().setAgentsPaused(manager, false);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Checks if any of the currently selected AI are not supported by the current game.
   * @java AIUtil.checkAISupported(Manager, Context)
   */
  public static checkAISupported(manager: ManagerShape, context: Context): void {
    const game = context.game as unknown as {
      players: { count(): number };
    };

    for (let p = 1; p < manager.aiSelected().length; ++p) {
      const detail = manager.aiSelected()[p];
      if (detail === null || detail === undefined || detail.ai() === null) continue;

      const aiInstance = detail.ai()!;
      if (aiInstance === null || aiInstance === undefined) continue;
      const supportsGame = (aiInstance as unknown as { supportsGame?: (g: unknown) => boolean }).supportsGame;
      if (typeof supportsGame === "function" && !supportsGame.call(aiInstance, context.game)) {
        const oldAI = aiInstance;
        const newAI = AIUtils_defaultAiForGame(context.game);

        const json: JSONObject = { AI: { algorithm: newAI.friendlyName } };
        const mCheck = manager as unknown as ConstructorParameters<typeof AIDetails>[0];
        manager.aiSelected()[p] = new AIDetails(mCheck, json, p, "Ludii AI");

        // EventQueue.invokeLater equivalent — schedule microtask
        Promise.resolve().then(() => {
          manager.getPlayerInterface().addTextToStatusPanel(
            `${oldAI.friendlyName} does not support this game. Switching to default AI for this game: ${newAI.friendlyName}.\n`,
          );
        });
      }

      if (p <= game.players.count()) {
        const aiInst = manager.aiSelected()[p]?.ai();
        if (aiInst !== null && aiInst !== undefined) {
          const initIfNeeded = (aiInst as unknown as { initIfNeeded?: (g: unknown, p: number) => void }).initIfNeeded;
          if (typeof initIfNeeded === "function") {
            initIfNeeded.call(aiInst, context.game, p);
          }
        }
      }
    }

    manager.settingsNetwork().backupAiPlayers(manager);
  }

  // -------------------------------------------------------------------------

  /**
   * @param manager
   * @return If any of the game's players are being controlled by an AI.
   * @java AIUtil.anyAIPlayer(Manager)
   */
  public static anyAIPlayer(manager: ManagerShape): boolean {
    const playerCount = manager.ref().context().game.players.count();
    for (let i = 1; i <= playerCount; i++) {
      if (manager.aiSelected()[i]?.ai() !== null) return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
}
