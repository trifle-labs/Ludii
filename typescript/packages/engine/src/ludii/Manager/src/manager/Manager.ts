// @java Manager/src/manager/Manager.java

import type { Move } from "../../../../move.js";
import { AIDetails } from "./ai/AIDetails.js";
import { DatabaseFunctionsPublic } from "./network/DatabaseFunctionsPublic.js";
import { SettingsManager } from "./utils/SettingsManager.js";
import { SettingsNetwork } from "./network/SettingsNetwork.js";
import { Referee } from "./Referee.js";
import type { PlayerInterface } from "./PlayerInterface.js";
import type { Tournament } from "../tournament/Tournament.js";

/** @java main.Constants.MAX_PLAYERS */
const MAX_PLAYERS = 16;

/**
 * Escape-hatch for org.apache.commons.rng.core.RandomProviderDefaultState.
 * @java org.apache.commons.rng.core.RandomProviderDefaultState
 */
export type RandomProviderDefaultState = unknown;

/**
 * The Manager class provides the link between the logic (Core/Referee) and the
 * playerDesktop. It handles all aspects of Ludii that are not specific to the
 * PC environment, e.g. Graphics2D.
 *
 * @java manager.Manager
 * @author Matthew.Stephenson and cambolbro and Eric.Piette
 */
export class Manager {
  /** @java Manager.playerInterface */
  private playerInterfaceVal!: PlayerInterface;

  /** @java Manager.databaseFunctionsPublic */
  private readonly databaseFunctionsPublicVal: DatabaseFunctionsPublic =
    DatabaseFunctionsPublic.construct();

  /**
   * Referee object that controls play.
   * @java Manager.ref
   */
  private readonly refVal: Referee;

  /**
   * Selects AI, based on player's choices in the Settings menu.
   * @java Manager.aiSelected
   */
  private readonly aiSelectedVal: (AIDetails | null)[] = new Array(MAX_PLAYERS + 1).fill(null);

  /**
   * Our current tournament.
   * @java Manager.tournament
   */
  private tournamentVal: Tournament | null = null;

  /**
   * Internal state of Context's RNG at the beginning of the game currently in the App.
   * @java Manager.currGameStartRngState
   */
  private currGameStartRngStateVal: RandomProviderDefaultState | null = null;

  /**
   * References to AIs for which we're visualising what they're thinking live.
   * @java Manager.liveAIs
   */
  private liveAIsVal: unknown[] | null = null;

  /**
   * lud filename for the last loaded game.
   * @java Manager.savedLudName
   */
  private savedLudNameVal: string | null = null;

  /**
   * List of the undone moves when viewing previous game states.
   * @java Manager.undoneMoves
   */
  private undoneMovesVal: Move[] = [];

  /** @java Manager.settingsManager */
  private readonly settingsManagerVal: SettingsManager = new SettingsManager();

  /** @java Manager.settingsNetwork */
  private readonly settingsNetworkVal: SettingsNetwork = new SettingsNetwork();

  /** @java Manager.webApp */
  private webAppVal: boolean = false;

  // -------------------------------------------------------------------------

  /**
   * Constructor.
   * @java Manager(PlayerInterface)
   */
  public constructor(playerInterface: PlayerInterface) {
    this.setPlayerInterface(playerInterface);
    this.refVal = new Referee();
  }

  // -------------------------------------------------------------------------

  /** @java Manager.ref() */
  public ref(): Referee {
    return this.refVal;
  }

  /** @java Manager.aiSelected() */
  public aiSelected(): (AIDetails | null)[] {
    return this.aiSelectedVal;
  }

  /** @java Manager.tournament() */
  public tournament(): Tournament | null {
    return this.tournamentVal;
  }

  // -------------------------------------------------------------------------

  /** @java Manager.updateCurrentGameRngInternalState() */
  public updateCurrentGameRngInternalState(): void {
    const ctx = this.refVal.context();
    if (ctx !== null) {
      this.setCurrGameStartRngState(ctx.rng.saveState());
    }
  }

  /** @java Manager.currGameStartRngState() */
  public currGameStartRngState(): RandomProviderDefaultState | null {
    return this.currGameStartRngStateVal;
  }

  /** @java Manager.setCurrGameStartRngState(RandomProviderDefaultState) */
  public setCurrGameStartRngState(newCurrGameStartRngState: RandomProviderDefaultState | null): void {
    this.currGameStartRngStateVal = newCurrGameStartRngState;
  }

  // -------------------------------------------------------------------------

  /**
   * @return The AIs for which we're visualising the thought process live.
   * @java Manager.liveAIs()
   */
  public liveAIs(): unknown[] | null {
    return this.liveAIsVal;
  }

  /**
   * Sets the AIs for which we're visualising the thought process live.
   * @java Manager.setLiveAIs(List<AI>)
   */
  public setLiveAIs(ais: unknown[] | null): void {
    this.liveAIsVal = ais;
  }

  // -------------------------------------------------------------------------

  /** @java Manager.savedLudName() */
  public savedLudName(): string | null {
    return this.savedLudNameVal;
  }

  /** @java Manager.setSavedLudName(String) */
  public setSavedLudName(savedLudName: string | null): void {
    this.savedLudNameVal = savedLudName;
  }

  // -------------------------------------------------------------------------

  /** @java Manager.setUndoneMoves(List<Move>) */
  public setUndoneMoves(moves: Move[]): void {
    this.undoneMovesVal = moves;
  }

  /** @java Manager.undoneMoves() */
  public undoneMoves(): Move[] {
    return this.undoneMovesVal;
  }

  // -------------------------------------------------------------------------

  /** @java Manager.settingsManager() */
  public settingsManager(): SettingsManager {
    return this.settingsManagerVal;
  }

  // -------------------------------------------------------------------------

  /** @java Manager.settingsNetwork() */
  public settingsNetwork(): SettingsNetwork {
    return this.settingsNetworkVal;
  }

  // -------------------------------------------------------------------------

  /** @java Manager.getPlayerInterface() */
  public getPlayerInterface(): PlayerInterface {
    return this.playerInterfaceVal;
  }

  /** @java Manager.setPlayerInterface(PlayerInterface) */
  public setPlayerInterface(playerInterface: PlayerInterface): void {
    this.playerInterfaceVal = playerInterface;
  }

  // -------------------------------------------------------------------------

  /** @java Manager.getTournament() */
  public getTournament(): Tournament | null {
    return this.tournamentVal;
  }

  /** @java Manager.setTournament(Tournament) */
  public setTournament(tournament: Tournament | null): void {
    this.tournamentVal = tournament;
  }

  // -------------------------------------------------------------------------

  /** @java Manager.databaseFunctionsPublic() */
  public databaseFunctionsPublic(): DatabaseFunctionsPublic {
    return this.databaseFunctionsPublicVal;
  }

  // -------------------------------------------------------------------------

  /** @java Manager.isWebApp() */
  public isWebApp(): boolean {
    return this.webAppVal;
  }

  /** @java Manager.setWebApp(boolean) */
  public setWebApp(webPlayer: boolean): void {
    this.webAppVal = webPlayer;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Manager.moverToAgent()
   */
  public moverToAgent(): number {
    const ctx = this.refVal.context();
    if (ctx === null) return 0;
    return ctx.state.playerToAgent(ctx.state.mover);
  }

  /**
   * @java Manager.playerToAgent(int)
   */
  public playerToAgent(i: number): number {
    const ctx = this.refVal.context();
    if (ctx === null) return i;
    return ctx.state.playerToAgent(i);
  }

  // -------------------------------------------------------------------------
}
