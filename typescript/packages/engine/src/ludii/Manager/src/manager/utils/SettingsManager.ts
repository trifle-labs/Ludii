// @java Manager/src/manager/utils/SettingsManager.java

import type { Move } from "../../../../../move.js";

/** @java main.Constants.MAX_PLAYERS */
const MAX_PLAYERS = 16;
/** @java main.Constants.DEFAULT_TURN_LIMIT */
const DEFAULT_TURN_LIMIT = 1250;

/**
 * Escape-hatch for main.collections.FastArrayList<Move>.
 * The engine's Move array is used directly as a plain array here.
 * @java main.collections.FastArrayList
 */
type FastArrayListMove = Move[];

/**
 * Escape-hatch for main.options.UserSelections.
 * Not yet ported — represented as opaque shape.
 * @java main.options.UserSelections
 */
export interface UserSelectionsShape {
  options: string[];
}

/**
 * Escape-hatch for gnu.trove.map.hash.TObjectIntHashMap<String>.
 * Represented as a plain Map<string, number>.
 * @java gnu.trove.map.hash.TObjectIntHashMap
 */
type TObjectIntHashMap = Map<string, number>;

/**
 * Manager shape for setAgentsPaused, avoids circular dependency with Manager.
 * @java manager.Manager
 */
type ManagerForPause = {
  ref(): { interruptAI(manager: ManagerForPause): void };
};

/**
 * Settings used by the Manager Module.
 *
 * @java manager.utils.SettingsManager
 * @author Matthew.Stephenson and cambolbro
 */
export class SettingsManager {

  // -------------------------------------------------------------------------
  // User settings

  /** @java SettingsManager.showRepetitions */
  private showRepetitionsVal: boolean = false;

  /** @java SettingsManager.agentsPaused */
  private agentsPausedVal: boolean = true;

  /** @java SettingsManager.tickLength */
  private tickLengthVal: number = 0.1;

  /** @java SettingsManager.alwaysAutoPass */
  private alwaysAutoPassVal: boolean = false;

  /** @java SettingsManager.minimumAgentThinkTime */
  private minimumAgentThinkTimeVal: number = 0.5;

  // -------------------------------------------------------------------------
  // Variables used for displaying repeated moves.

  /** @java SettingsManager.storedGameStatesForVisuals */
  private storedGameStatesForVisualsVal: bigint[] = [];

  /** @java SettingsManager.movesAllowedWithRepetition */
  private movesAllowedWithRepetitionVal: FastArrayListMove = [];

  // -------------------------------------------------------------------------
  // Variables used for multiple consequence selection.

  /** @java SettingsManager.possibleConsequenceMoves */
  private possibleConsequenceMovesVal: Move[] = [];

  // -------------------------------------------------------------------------
  // Variables used for turn limits.

  /** @java SettingsManager.turnLimits */
  private turnLimitsVal: TObjectIntHashMap = new Map();

  // -------------------------------------------------------------------------

  /**
   * User selections for options and rulesets within a game.
   * @java SettingsManager.userSelections
   */
  private readonly userSelectionsVal: UserSelectionsShape = { options: [] };

  // -------------------------------------------------------------------------
  // Getters and setters

  /** @java SettingsManager.showRepetitions() */
  public showRepetitions(): boolean {
    return this.showRepetitionsVal;
  }

  /** @java SettingsManager.setShowRepetitions(boolean) */
  public setShowRepetitions(show: boolean): void {
    this.showRepetitionsVal = show;
  }

  /** @java SettingsManager.tickLength() */
  public tickLength(): number {
    return this.tickLengthVal;
  }

  /** @java SettingsManager.setTickLength(double) */
  public setTickLength(length: number): void {
    this.tickLengthVal = length;
  }

  /** @java SettingsManager.storedGameStatesForVisuals() */
  public storedGameStatesForVisuals(): bigint[] {
    return this.storedGameStatesForVisualsVal;
  }

  /** @java SettingsManager.setStoredGameStatesForVisuals(ArrayList) */
  public setStoredGameStatesForVisuals(stored: bigint[]): void {
    this.storedGameStatesForVisualsVal = stored;
  }

  /** @java SettingsManager.movesAllowedWithRepetition() */
  public movesAllowedWithRepetition(): FastArrayListMove {
    return this.movesAllowedWithRepetitionVal;
  }

  /** @java SettingsManager.setMovesAllowedWithRepetition(FastArrayList) */
  public setMovesAllowedWithRepetition(moves: FastArrayListMove): void {
    this.movesAllowedWithRepetitionVal = moves;
  }

  /** @java SettingsManager.possibleConsequenceMoves() */
  public possibleConsequenceMoves(): Move[] {
    return this.possibleConsequenceMovesVal;
  }

  /** @java SettingsManager.setPossibleConsequenceMoves(ArrayList) */
  public setPossibleConsequenceMoves(possible: Move[]): void {
    this.possibleConsequenceMovesVal = possible;
  }

  /**
   * @java SettingsManager.turnLimit(String)
   */
  public turnLimit(gameName: string): number {
    if (this.turnLimitsVal.has(gameName)) {
      return this.turnLimitsVal.get(gameName)!;
    }
    return DEFAULT_TURN_LIMIT;
  }

  /** @java SettingsManager.setTurnLimit(String, int) */
  public setTurnLimit(gameName: string, turnLimit: number): void {
    this.turnLimitsVal.set(gameName, turnLimit);
  }

  /** @java SettingsManager.turnLimits() */
  public turnLimits(): TObjectIntHashMap {
    return this.turnLimitsVal;
  }

  /** @java SettingsManager.setTurnLimits(TObjectIntHashMap) */
  public setTurnLimits(turnLimits: TObjectIntHashMap): void {
    this.turnLimitsVal = turnLimits;
  }

  /** @java SettingsManager.agentsPaused() */
  public agentsPaused(): boolean {
    return this.agentsPausedVal;
  }

  /**
   * @java SettingsManager.setAgentsPaused(Manager, boolean)
   */
  public setAgentsPaused(manager: ManagerForPause, paused: boolean): void {
    this.agentsPausedVal = paused;

    if (this.agentsPausedVal) {
      manager.ref().interruptAI(manager);
    }
  }

  /** @java SettingsManager.userSelections() */
  public userSelections(): UserSelectionsShape {
    return this.userSelectionsVal;
  }

  /** @java SettingsManager.alwaysAutoPass() */
  public alwaysAutoPass(): boolean {
    return this.alwaysAutoPassVal;
  }

  /** @java SettingsManager.setAlwaysAutoPass(boolean) */
  public setAlwaysAutoPass(alwaysAutoPass: boolean): void {
    this.alwaysAutoPassVal = alwaysAutoPass;
  }

  /** @java SettingsManager.minimumAgentThinkTime() */
  public minimumAgentThinkTime(): number {
    return this.minimumAgentThinkTimeVal;
  }

  /** @java SettingsManager.setMinimumAgentThinkTime(double) */
  public setMinimumAgentThinkTime(minimumAgentThinkTime: number): void {
    this.minimumAgentThinkTimeVal = minimumAgentThinkTime;
  }

  // -------------------------------------------------------------------------
}

/** Re-export MAX_PLAYERS for use by Manager */
export { MAX_PLAYERS, DEFAULT_TURN_LIMIT };
