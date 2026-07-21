// @java Manager/src/manager/network/DatabaseFunctionsPublic.java

import type { Context } from "../../../../../context.js";
import type { Move } from "../../../../../move.js";
import type { Trial } from "../../../../../trial.js";

// Manager and related types — escape-hatch for not-yet-typed deps
type ManagerShape = unknown;

/**
 * Escape-hatch for org.apache.commons.rng.core.RandomProviderDefaultState.
 * Not yet ported — represented as opaque byte-state.
 * @java org.apache.commons.rng.core.RandomProviderDefaultState
 */
export type RandomProviderDefaultState = { getState(): Uint8Array };

/**
 * Public class for calling database functions on the Ludii Server.
 * Fake function calls. Database functionality is not available in the source
 * code to prevent server spamming.
 *
 * @java manager.network.DatabaseFunctionsPublic
 * @author Matthew.Stephenson and Dennis Soemers
 */
export class DatabaseFunctionsPublic {

  // -------------------------------------------------------------------------

  /**
   * Class loader used to load private network code if available (not included
   * in public source code repo).
   * @java DatabaseFunctionsPublic.privateNetworkCodeClassLoader
   */
  private static privateNetworkCodeClassLoader: unknown = null;

  // -------------------------------------------------------------------------

  /**
   * Constructs a wrapper around the database functions. Tries to find a
   * private implementation first; falls back to this public no-op class.
   * @java DatabaseFunctionsPublic.construct()
   */
  public static construct(): DatabaseFunctionsPublic {
    // In the Java source, this uses URLClassLoader to optionally load
    // a private class from LudiiPrivate/NetworkPrivate/bin. In TS we
    // always return the public no-op implementation.
    return new DatabaseFunctionsPublic();
  }

  // -------------------------------------------------------------------------
  // Analysis

  /**
   * Gets all valid trials from the database for the provided parameters.
   * @java DatabaseFunctionsPublic.getTrialsFromDatabase(...)
   */
  public getTrialsFromDatabase(
    _gameName: string,
    _gameOptions: string[],
    _agentName: string,
    _thinkingTime: number,
    _maxTurns: number,
    _gameHash: number,
  ): string[] {
    return [];
  }

  /**
   * Stores a trial in the database.
   * @java DatabaseFunctionsPublic.storeTrialInDatabase(...)
   */
  public storeTrialInDatabase(
    _gameName: string,
    _gameOptions: string[],
    _agentName: string,
    _thinkingTime: number,
    _maxTurns: number,
    _gameHash: number,
    _trial: Trial,
    _RNG: RandomProviderDefaultState,
  ): void {
    // Do nothing.
  }

  /**
   * Stores a website trial in the database.
   * @java DatabaseFunctionsPublic.storeWebTrialInDatabase(...)
   */
  public storeWebTrialInDatabase(
    _gameName: string,
    _rulesetName: string,
    _gameOptions: string[],
    _gameId: number,
    _rulesetId: number,
    _agents: boolean[],
    _username: string,
    _gameHash: number,
    _trial: Trial,
    _RNG: RandomProviderDefaultState,
  ): void {
    // Do nothing.
  }

  // -------------------------------------------------------------------------
  // Remote

  /**
   * Begins repeating network actions that must be continuously performed while online.
   * @java DatabaseFunctionsPublic.repeatNetworkActions(Manager)
   */
  public repeatNetworkActions(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Provides an md5 encrypted hash string of a given password.
   * @java DatabaseFunctionsPublic.md5(String)
   */
  public md5(_passwordToHash: string): string {
    return "";
  }

  /**
   * Refresh login flag on server, and make sure secret number up to date.
   * @java DatabaseFunctionsPublic.refreshLogin(Manager)
   */
  public refreshLogin(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Sets the remaining time for each player.
   * @java DatabaseFunctionsPublic.checkRemainingTime(Manager)
   */
  public checkRemainingTime(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Get a String representation of the remaining time for all players.
   * @java DatabaseFunctionsPublic.getRemainingTime(Manager)
   */
  public getRemainingTime(_manager: ManagerShape): string {
    return "";
  }

  /**
   * Get a String representation of all (offline or online) players.
   * @java DatabaseFunctionsPublic.GetAllPlayers()
   */
  public GetAllPlayers(): string {
    return "";
  }

  /**
   * Get a String representation of all tournaments that we have joined.
   * @java DatabaseFunctionsPublic.findJoinedTournaments(Manager)
   */
  public findJoinedTournaments(_manager: ManagerShape): string {
    return "";
  }

  /**
   * Update the incoming messages chat with any new private messages.
   * @java DatabaseFunctionsPublic.updateIncomingMessages(Manager)
   */
  public updateIncomingMessages(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Update the last time the server was contacted.
   * @java DatabaseFunctionsPublic.updateLastServerTime(Manager)
   */
  public updateLastServerTime(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Get a String representation of all private games that we have not previously joined.
   * @java DatabaseFunctionsPublic.findJoinableGames(Manager)
   */
  public findJoinableGames(_manager: ManagerShape): string {
    return "";
  }

  /**
   * Get a String representation of all games that we have previously joined.
   * @java DatabaseFunctionsPublic.findJoinedGames(Manager)
   */
  public findJoinedGames(_manager: ManagerShape): string {
    return "";
  }

  /**
   * Get a String representation of all games that we can spectate.
   * @java DatabaseFunctionsPublic.findOtherGames(Manager)
   */
  public findOtherGames(_manager: ManagerShape): string {
    return "";
  }

  /**
   * Get a String representation of all private tournaments that we have not previously joined.
   * @java DatabaseFunctionsPublic.findJoinableTournaments(Manager)
   */
  public findJoinableTournaments(_manager: ManagerShape): string {
    return "";
  }

  /**
   * Get a String representation of all tournaments that we have previously joined.
   * @java DatabaseFunctionsPublic.findHostedTournaments(Manager)
   */
  public findHostedTournaments(_manager: ManagerShape): string {
    return "";
  }

  /**
   * Sends a message to the group chat for the current game.
   * @java DatabaseFunctionsPublic.sendGameChatMessage(Manager, String)
   */
  public sendGameChatMessage(_manager: ManagerShape, _s: string): void {
    // Do nothing.
  }

  /**
   * Sends a specified move to the database.
   * @java DatabaseFunctionsPublic.sendMoveToDatabase(Manager, Move, int, String, int)
   */
  public sendMoveToDatabase(
    _manager: ManagerShape,
    _m: Move,
    _nextMover: number,
    _score: string,
    _moveNumber: number,
  ): void {
    // Do nothing.
  }

  /**
   * Sends the database a message to say that the game is finished.
   * @java DatabaseFunctionsPublic.sendGameOverDatabase(Manager)
   */
  public sendGameOverDatabase(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Sends the database a message to say that you have forfeit the game.
   * @java DatabaseFunctionsPublic.sendForfeitToDatabase(Manager)
   */
  public sendForfeitToDatabase(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Sends the database a message to say that you have proposed a draw.
   * @java DatabaseFunctionsPublic.sendProposeDraw(Manager)
   */
  public sendProposeDraw(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Checks if each of the current game players are online or offline.
   * @java DatabaseFunctionsPublic.checkOnlinePlayers(Manager)
   */
  public checkOnlinePlayers(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Checks if there are any outstanding moves in the database that need to be carried out.
   * @java DatabaseFunctionsPublic.getMoveFromDatabase(Manager)
   */
  public getMoveFromDatabase(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Checks if there are any outstanding moves in the database that need to be carried out.
   * @java DatabaseFunctionsPublic.checkStatesMatch(Manager)
   */
  public checkStatesMatch(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Checks if any players have forfeit or timed out.
   * @java DatabaseFunctionsPublic.checkForfeitAndTimeoutAndDraw(Manager)
   */
  public checkForfeitAndTimeoutAndDraw(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Checks if any players have proposed a draw.
   * @java DatabaseFunctionsPublic.checkDrawProposed(Manager)
   */
  public checkDrawProposed(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Gets the username of each player in the game.
   * @java DatabaseFunctionsPublic.getActiveGamePlayerNames(Manager)
   */
  public getActiveGamePlayerNames(_manager: ManagerShape): string[] {
    return [];
  }

  /**
   * Sends the database the current ranking of all players in the game.
   * @java DatabaseFunctionsPublic.sendGameRankings(Manager, double[])
   */
  public sendGameRankings(_manager: ManagerShape, _rankingOriginal: number[]): void {
    // Do nothing.
  }

  /**
   * Converts a RandomProviderDefaultState object into a String representation.
   * @java DatabaseFunctionsPublic.convertRNGToText(RandomProviderDefaultState)
   */
  public convertRNGToText(_rngState: RandomProviderDefaultState): string {
    return "";
  }

  /**
   * Gets the initial RNG seed for the game from the database.
   * @java DatabaseFunctionsPublic.getRNG(Manager)
   */
  public getRNG(_manager: ManagerShape): string {
    return "";
  }

  /**
   * Gets leaderboard information from the database.
   * @java DatabaseFunctionsPublic.getLeaderboard()
   */
  public getLeaderboard(): string {
    return "";
  }

  /**
   * Ping the server to check if we are still connected to it.
   * @java DatabaseFunctionsPublic.pingServer(String)
   */
  public pingServer(_URLName: string): boolean {
    return false;
  }

  /**
   * Send result to database and update each player's statistics.
   * @java DatabaseFunctionsPublic.sendResultToDatabase(Manager, Context)
   */
  public sendResultToDatabase(_manager: ManagerShape, _context: Context): void {
    // Do nothing.
  }

  /**
   * Log out of the server.
   * @java DatabaseFunctionsPublic.logout(Manager)
   */
  public logout(_manager: ManagerShape): void {
    // Do nothing.
  }

  /**
   * Updates network player number if a swap action is made.
   * @java DatabaseFunctionsPublic.checkNetworkSwap(Manager, Move)
   */
  public checkNetworkSwap(_manager: ManagerShape, _move: Move): void {
    // Do nothing.
  }

  /**
   * Location on server where remote scripts are stored.
   * @java DatabaseFunctionsPublic.appFolderLocation()
   */
  public appFolderLocation(): string {
    return "";
  }

  /**
   * Secret network number used for validating network actions.
   * @java DatabaseFunctionsPublic.getSecretNetworkNumber(Manager)
   */
  public getSecretNetworkNumber(_manager: ManagerShape): number {
    return 0.0;
  }

  // -------------------------------------------------------------------------
}
