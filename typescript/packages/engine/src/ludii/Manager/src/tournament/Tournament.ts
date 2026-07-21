// @java Manager/src/tournament/Tournament.java

import type { Game } from "../../../../game.js";
import { AIUtil } from "../manager/ai/AIUtil.js";
import type { JSONObject } from "../manager/ai/AIDetails.js";

/**
 * Escape-hatch for manager.Manager — avoids circular import.
 * @java manager.Manager
 */
type ManagerShape = {
  aiSelected(): ({ ai(): { closeAI(): void } | null; name(): string; } | null)[];
  moverToAgent(): number;
  ref(): {
    context(): { game: Game & { players: { count(): number } } } | null;
    nextMove(manager: ManagerShape, humanBased: boolean): boolean;
    interruptAI(manager: ManagerShape): void;
  };
  settingsManager(): {
    setAgentsPaused(manager: ManagerShape, paused: boolean): void;
    agentsPaused(): boolean;
  };
  settingsNetwork(): {
    getActiveGameId(): number;
    getOnlineAIAllowed(): boolean;
    backupAiPlayers(manager: ManagerShape): void;
  };
  getPlayerInterface(): {
    loadGameFromName(name: string, options: string[], debug: boolean): void;
    addTextToStatusPanel(text: string): void;
    getNameFromJar(): JSONObject | null;
    getNameFromJson(): JSONObject | null;
    getNameFromAiDef(): JSONObject | null;
  };
  isWebApp(): boolean;
  setLiveAIs(ais: unknown[] | null): void;
  liveAIs(): unknown[] | null;
  updateCurrentGameRngInternalState(): void;
};

/**
 * A Ludii Tournament.
 *
 * @java tournament.Tournament
 * @author Dennis Soemers and Matthew Stephenson and cambolbro
 */
export class Tournament {
  /**
   * List of games we wish to play in tournament.
   * @java Tournament.gamesToPlay
   */
  private readonly gamesToPlay: string[];

  /**
   * List of agents to participate in tournament.
   * @java Tournament.agentsToPlay
   */
  private readonly agentsToPlay: unknown[];

  /**
   * Results of tournament.
   * @java Tournament.results
   */
  private readonly results: (string | undefined)[][] = [];

  /** @java Tournament.matchUps */
  private matchUps: number[][] = [];

  /** @java Tournament.matchUpIndex */
  private matchUpIndex: number = 0;

  /** @java Tournament.matchUp */
  private matchUp: number[] = [];

  // -------------------------------------------------------------------------

  /**
   * Constructor from JSON.
   * @java Tournament(JSONObject)
   */
  public constructor(json: Record<string, unknown>) {
    const listGames = json["GAMES"] as string[];
    this.gamesToPlay = [];

    console.log("Tournament games:");
    for (const game of listGames) {
      this.gamesToPlay.push(game);
      console.log(game);
    }

    const listAgents = json["AGENTS"] as unknown[];
    this.agentsToPlay = [];

    console.log("Tournament agents:");
    for (const agent of listAgents) {
      this.agentsToPlay.push(agent);
      console.log(agent);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Sets up the tournament for a (new) start.
   * @java Tournament.setupTournament()
   */
  public setupTournament(): void {
    // Reset the global tournament variables
    this.results.length = 0;

    const totalNumberPlayers = this.agentsToPlay.length;

    const matchUpsFlipped = Tournament.generate(totalNumberPlayers, 2);
    this.matchUps = Tournament.generate(totalNumberPlayers, 2);

    for (let j = 0; j < this.matchUps.length; j++) {
      const arr = this.matchUps[j];
      if (arr === undefined) continue;
      for (let i = 0; i < Math.floor(arr.length / 2); i++) {
        const temp = arr[i] ?? 0;
        arr[i] = arr[arr.length - i - 1] ?? 0;
        arr[arr.length - i - 1] = temp;
      }
    }

    this.matchUps.push(...matchUpsFlipped);
    this.matchUpIndex = 0;
  }

  // -------------------------------------------------------------------------

  /**
   * Run the next game for the tournament.
   * @java Tournament.startNextTournamentGame(Manager)
   */
  public startNextTournamentGame(manager: ManagerShape): void {
    if (this.gamesToPlay.length > 0 && this.matchUps.length > 0) {
      this.matchUp = this.matchUps[this.matchUpIndex] ?? [];

      for (let i = 0; i < this.matchUp.length; i++) {
        const matchUpI = this.matchUp[i] ?? 0;
        const agent = this.agentsToPlay[matchUpI];
        let json: JSONObject;

        if (typeof agent === "object" && agent !== null && !Array.isArray(agent) && "AI" in agent) {
          json = agent as JSONObject;
        } else {
          json = { AI: { algorithm: agent } };
        }

        const aiObj = (json["AI"] ?? {}) as JSONObject;
        const algName = (aiObj["algorithm"] as string) ?? "";
        AIUtil.updateSelectedAI(manager as unknown as Parameters<typeof AIUtil.updateSelectedAI>[0], json, i + 1, algName);
      }

      const firstGame = this.gamesToPlay[0] ?? "";
      const gameAndOptions = firstGame.split("-");
      if (gameAndOptions.length > 1) {
        console.log(gameAndOptions[1]);
        manager.getPlayerInterface().loadGameFromName(
          (gameAndOptions[0] ?? "").trim(),
          gameAndOptions.slice(1).map(s => s.trim()),
          false,
        );
      } else {
        manager.getPlayerInterface().loadGameFromName(
          (gameAndOptions[0] ?? "").trim(),
          [],
          false,
        );
      }

      this.matchUpIndex++;
      if (this.matchUpIndex >= this.matchUps.length) {
        this.matchUpIndex = 0;
        this.gamesToPlay.splice(0, 1);
      }

      manager.settingsManager().setAgentsPaused(manager, false);
      manager.ref().nextMove(manager, false);
    } else {
      // The tournament is over, show the results
      console.log("FINAL RESULTS SHORT");

      for (let i = 0; i < this.results.length; i++) {
        const result = "[" + (this.results[i] ?? []).join(", ") + "]";
        console.log(result);
      }

      console.log("\nFINAL RESULTS LONG");

      for (let i = 0; i < this.results.length; i++) {
        const row = this.results[i] ?? [];
        const gameData = `GAME(${i + 1}) ${row[0] ?? ""}`;
        console.log(gameData);

        try {
          const playerField = row[1] ?? "";
          // Java: results.get(i)[1].length() — length of the JSON array string
          for (let j = 0; j < playerField.length; j++) {
            const playerIndexStr = playerField.split(",")[j]?.replace("[", "").replace("]", "").trim() ?? "";
            const result = `Player ${parseInt(playerIndexStr, 10) + 1} : ${row[j + 2] ?? ""}`;
            console.log(result);
          }
        } catch {
          // just skip the players that don't have scores
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Stores the results obtained in a single match.
   * @java Tournament.storeResults(Game, double[])
   */
  public storeResults(game: Game, ranking: number[]): void {
    const result: (string | undefined)[] = new Array(10).fill(undefined);

    try {
      result[0] = game.name;
      result[1] = "[" + this.matchUp.join(", ") + "]";
      result[2] = ranking[1] !== undefined ? String(ranking[1]) : undefined;
      result[3] = ranking[2] !== undefined ? String(ranking[2]) : undefined;
      result[4] = ranking[3] !== undefined ? String(ranking[3]) : undefined;
      result[5] = ranking[4] !== undefined ? String(ranking[4]) : undefined;
      result[6] = ranking[5] !== undefined ? String(ranking[5]) : undefined;
      result[7] = ranking[6] !== undefined ? String(ranking[6]) : undefined;
      result[8] = ranking[7] !== undefined ? String(ranking[7]) : undefined;
      result[9] = ranking[8] !== undefined ? String(ranking[8]) : undefined;
    } catch {
      // player number requested probably doesn't exist, carry on as normal
    }

    this.results.push(result);
  }

  // -------------------------------------------------------------------------

  /**
   * Called when the tournament is being aborted / ended.
   * @java Tournament.endTournament()
   */
  public endTournament(): void {
    // Do nothing (for now)
  }

  // -------------------------------------------------------------------------

  /**
   * Generates all nCr combinations (all round robin tournament combinations).
   * @java Tournament.generate(int, int)
   */
  private static generate(n: number, r: number): number[][] {
    const combinations: number[][] = [];
    const combination: number[] = new Array(r).fill(0);

    // Initialize with lowest lexicographic combination
    for (let i = 0; i < r; i++) {
      combination[i] = i;
    }

    while ((combination[r - 1] ?? 0) < n) {
      combinations.push([...combination]);

      // Generate next combination in lexicographic order
      let t = r - 1;
      while (t !== 0 && (combination[t] ?? 0) === n - r + t) {
        t--;
      }
      combination[t] = (combination[t] ?? 0) + 1;
      for (let i = t + 1; i < r; i++) {
        combination[i] = (combination[i - 1] ?? 0) + 1;
      }
    }

    return combinations;
  }

  // -------------------------------------------------------------------------
}
