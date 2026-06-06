// @java Manager/src/manager/utils/game_logs/GameLogs.java

import type { Game } from "../../../../../../game.js";
import { MatchRecord } from "./MatchRecord.js";

/**
 * A collection of one or more game trials which can be serialized and
 * deserialized.
 *
 * @java manager.utils.game_logs.GameLogs
 * @author Dennis Soemers
 */
export class GameLogs {
  /** @java GameLogs.gameName */
  private readonly gameNameVal: string;

  /** @java GameLogs.game */
  private readonly gameVal: Game;

  /** @java GameLogs.matchRecords */
  private readonly matchRecordsVal: MatchRecord[] = [];

  // -------------------------------------------------------------------------

  /**
   * Constructor.
   * @java GameLogs(Game)
   */
  public constructor(game: Game) {
    this.gameNameVal = game.name;
    this.gameVal = game;
  }

  // -------------------------------------------------------------------------

  /** @java GameLogs.addMatchRecord(MatchRecord) */
  public addMatchRecord(matchRecord: MatchRecord): void {
    this.matchRecordsVal.push(matchRecord);
  }

  /** @java GameLogs.matchRecords() */
  public matchRecords(): MatchRecord[] {
    return this.matchRecordsVal;
  }

  /** @java GameLogs.game() */
  public game(): Game {
    return this.gameVal;
  }

  // -------------------------------------------------------------------------

  /**
   * Loads GameLogs from a serialized text representation (TS equivalent of
   * reading from an ObjectInputStream / binary file).
   *
   * In Java this reads a binary ObjectInputStream produced by Java
   * serialization. In TS we accept a string-array of already-decoded trial
   * text blocks (one per MatchRecord), as there is no direct equivalent of
   * Java binary serialization in a browser/Node context.
   *
   * @java GameLogs.fromFile(File, Game)
   */
  public static fromTrialTexts(
    trialTexts: string[],
    game: Game,
  ): GameLogs {
    const gameLogs = new GameLogs(game);

    for (const text of trialTexts) {
      const record = MatchRecord.loadMatchRecordFromText(text, game);
      if (record !== null) {
        gameLogs.addMatchRecord(record);
      }
    }

    return gameLogs;
  }

  /** @java GameLogs.getGameName() */
  public getGameName(): string {
    return this.gameNameVal;
  }

  // -------------------------------------------------------------------------
}
