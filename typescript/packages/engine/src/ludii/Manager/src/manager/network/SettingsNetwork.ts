// @java Manager/src/manager/network/SettingsNetwork.java

/** @java main.Constants.MAX_PLAYERS */
const MAX_PLAYERS = 16;

// Forward reference — resolved at runtime to avoid circular imports.
// AIDetails is in manager/ai/AIDetails.ts
type AIDetailsShape = { object: Record<string, unknown> | null; name(): string; thinkTime(): number; menuItemName(): string; } | null;

/**
 * Network settings.
 *
 * @java manager.network.SettingsNetwork
 * @author Matthew.Stephenson
 */
export class SettingsNetwork {

  // -------------------------------------------------------------------------
  // Database function parameters

  /** @java SettingsNetwork.repeatNetworkActionsThread */
  private repeatNetworkActionsThreadVal: unknown = null; // Thread — no direct TS equivalent

  /**
   * Number of refreshes where the local state doesn't match that stored in the DB.
   * @java SettingsNetwork.localStateMatchesDB
   */
  private localStateMatchesDBVal: number = 0;

  // -------------------------------------------------------------------------
  // Network game parameters

  /** @java SettingsNetwork.networkPlayerNumber */
  private networkPlayerNumberVal: number = 0;

  /** @java SettingsNetwork.numberConnectedPlayers */
  private numberConnectedPlayersVal: number = 0;

  /** @java SettingsNetwork.activeGameId */
  private activeGameIdVal: number = 0;

  /** @java SettingsNetwork.tournamentId */
  private tournamentIdVal: number = 0;

  /** @java SettingsNetwork.secretPlayerNetworkNumber */
  private secretPlayerNetworkNumberVal: number = 0;

  /** @java SettingsNetwork.onlineAIAllowed */
  private onlineAIAllowedVal: boolean = false;

  /** @java SettingsNetwork.lastServerTime */
  private lastServerTimeVal: number = -1;

  // -------------------------------------------------------------------------
  // Login settings

  /** @java SettingsNetwork.loginId */
  private loginIdVal: number = 0;

  /** @java SettingsNetwork.loginUsername */
  private loginUsernameVal: string = "";

  /** @java SettingsNetwork.rememberDetails */
  private rememberDetailsVal: boolean = false;

  // -------------------------------------------------------------------------
  // Remote Dialog Settings

  /** @java SettingsNetwork.tabSelected */
  private tabSelectedVal: number = 0;

  /** @java SettingsNetwork.remoteDialogPosition — java.awt.Rectangle */
  private remoteDialogPositionVal: { x: number; y: number; width: number; height: number } | null = null;

  /** @java SettingsNetwork.onlineBackupAiPlayers */
  private onlineBackupAiPlayersVal: (AIDetailsShape)[] = new Array(MAX_PLAYERS + 1).fill(null);

  /** @java SettingsNetwork.playerTimeRemaining */
  private playerTimeRemainingVal: number[] = new Array(MAX_PLAYERS).fill(0);

  /** @java SettingsNetwork.loadingNetworkGame */
  private loadingNetworkGameVal: boolean = false;

  // -------------------------------------------------------------------------
  // Network player parameters

  /** @java SettingsNetwork.activePlayers */
  private activePlayersVal: boolean[] = new Array(MAX_PLAYERS + 1).fill(false);

  /** @java SettingsNetwork.onlinePlayers */
  private onlinePlayersVal: boolean[] = new Array(MAX_PLAYERS + 1).fill(false);

  /** @java SettingsNetwork.drawProposedPlayers */
  private drawProposedPlayersVal: boolean[] = new Array(MAX_PLAYERS + 1).fill(false);

  // -------------------------------------------------------------------------
  // Other

  /** @java SettingsNetwork.longerNetworkPolling */
  private longerNetworkPollingVal: boolean = false;

  /** @java SettingsNetwork.noNetworkRefresh */
  private noNetworkRefreshVal: boolean = false;

  // -------------------------------------------------------------------------

  /**
   * Constructor.
   * @java SettingsNetwork()
   */
  public constructor() {
    this.resetNetworkPlayers();
  }

  // -------------------------------------------------------------------------

  /**
   * Keep a backup of the AI players.
   * @java SettingsNetwork.backupAiPlayers(Manager)
   */
  public backupAiPlayers(manager: { aiSelected(): AIDetailsShape[]; settingsNetwork(): SettingsNetwork }): void {
    if (this.activeGameIdVal === 0) {
      const selected = manager.aiSelected();
      for (let i = 0; i < selected.length; i++) {
        // AIDetails.getCopyOf — escape-hatch: store reference only (full copy requires AIDetails import)
        this.onlineBackupAiPlayersVal[i] = selected[i] ?? null;
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Restore the AI players from the saved backup.
   * @java SettingsNetwork.restoreAiPlayers(Manager)
   */
  public restoreAiPlayers(manager: { aiSelected(): AIDetailsShape[] }): void {
    const selected = manager.aiSelected();
    for (let i = 0; i < this.onlineBackupAiPlayersVal.length; i++) {
      selected[i] = this.onlineBackupAiPlayersVal[i] ?? null;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Reset the network players, after a game is restarted.
   * @java SettingsNetwork.resetNetworkPlayers()
   */
  public resetNetworkPlayers(): void {
    this.activePlayersVal.fill(true);
    this.onlinePlayersVal.fill(false);
    this.drawProposedPlayersVal.fill(false);
  }

  // -------------------------------------------------------------------------

  /** @java SettingsNetwork.getNetworkPlayerNumber() */
  public getNetworkPlayerNumber(): number {
    return this.networkPlayerNumberVal;
  }

  /** @java SettingsNetwork.setNetworkPlayerNumber(int) */
  public setNetworkPlayerNumber(networkPlayerNumber: number): void {
    this.networkPlayerNumberVal = networkPlayerNumber;
  }

  /** @java SettingsNetwork.getNumberConnectedPlayers() */
  public getNumberConnectedPlayers(): number {
    return this.numberConnectedPlayersVal;
  }

  /** @java SettingsNetwork.setNumberConnectedPlayers(int) */
  public setNumberConnectedPlayers(numberConnectedPlayers: number): void {
    this.numberConnectedPlayersVal = numberConnectedPlayers;
  }

  /** @java SettingsNetwork.getLoginId() */
  public getLoginId(): number {
    return this.loginIdVal;
  }

  /** @java SettingsNetwork.setLoginId(int) */
  public setLoginId(loginId: number): void {
    this.loginIdVal = loginId;
  }

  /** @java SettingsNetwork.loginUsername() */
  public loginUsername(): string {
    return this.loginUsernameVal;
  }

  /** @java SettingsNetwork.setLoginUsername(String) */
  public setLoginUsername(loginUsername: string): void {
    this.loginUsernameVal = loginUsername;
  }

  /** @java SettingsNetwork.rememberDetails() */
  public rememberDetails(): boolean {
    return this.rememberDetailsVal;
  }

  /** @java SettingsNetwork.setRememberDetails(boolean) */
  public setRememberDetails(rememberDetails: boolean): void {
    this.rememberDetailsVal = rememberDetails;
  }

  /** @java SettingsNetwork.getActiveGameId() */
  public getActiveGameId(): number {
    return this.activeGameIdVal;
  }

  /** @java SettingsNetwork.setActiveGameId(int) */
  public setActiveGameId(activeGameId: number): void {
    this.activeGameIdVal = activeGameId;
  }

  /** @java SettingsNetwork.tabSelected() */
  public tabSelected(): number {
    return this.tabSelectedVal;
  }

  /** @java SettingsNetwork.setTabSelected(int) */
  public setTabSelected(tabSelected: number): void {
    this.tabSelectedVal = tabSelected;
  }

  /** @java SettingsNetwork.remoteDialogPosition() — java.awt.Rectangle */
  public remoteDialogPosition(): { x: number; y: number; width: number; height: number } | null {
    return this.remoteDialogPositionVal;
  }

  /** @java SettingsNetwork.setRemoteDialogPosition(Rectangle) */
  public setRemoteDialogPosition(remoteDialogPosition: { x: number; y: number; width: number; height: number } | null): void {
    this.remoteDialogPositionVal = remoteDialogPosition;
  }

  /** @java SettingsNetwork.getTournamentId() */
  public getTournamentId(): number {
    return this.tournamentIdVal;
  }

  /** @java SettingsNetwork.setTournamentId(int) */
  public setTournamentId(tournamentId: number): void {
    this.tournamentIdVal = tournamentId;
  }

  /** @java SettingsNetwork.setSecretNetworkNumber(int) — delegates to setSecretPlayerNetworkNumber */
  public setSecretNetworkNumber(secretNetworkNumber: number): void {
    this.setSecretPlayerNetworkNumber(secretNetworkNumber);
  }

  /** @java SettingsNetwork.getOnlineAIAllowed() */
  public getOnlineAIAllowed(): boolean {
    return this.onlineAIAllowedVal;
  }

  /** @java SettingsNetwork.setOnlineAIAllowed(boolean) */
  public setOnlineAIAllowed(onlineAIAllowed: boolean): void {
    this.onlineAIAllowedVal = onlineAIAllowed;
  }

  /** @java SettingsNetwork.repeatNetworkActionsThread() */
  public repeatNetworkActionsThread(): unknown {
    return this.repeatNetworkActionsThreadVal;
  }

  /** @java SettingsNetwork.setRepeatNetworkActionsThread(Thread) */
  public setRepeatNetworkActionsThread(repeatNetworkActionsThread: unknown): void {
    this.repeatNetworkActionsThreadVal = repeatNetworkActionsThread;
  }

  /** @java SettingsNetwork.localStateMatchesDB() */
  public localStateMatchesDB(): number {
    return this.localStateMatchesDBVal;
  }

  /** @java SettingsNetwork.setLocalStateMatchesDB(int) */
  public setLocalStateMatchesDB(localStateMatchesDB: number): void {
    this.localStateMatchesDBVal = localStateMatchesDB;
  }

  /** @java SettingsNetwork.onlineBackupAiPlayers() */
  public onlineBackupAiPlayers(): (AIDetailsShape)[] {
    return this.onlineBackupAiPlayersVal;
  }

  /** @java SettingsNetwork.setOnlineBackupAiPlayers(AIDetails[]) */
  public setOnlineBackupAiPlayers(onlineBackupAiPlayers: (AIDetailsShape)[]): void {
    this.onlineBackupAiPlayersVal = onlineBackupAiPlayers;
  }

  /** @java SettingsNetwork.playerTimeRemaining() */
  public playerTimeRemaining(): number[] {
    return this.playerTimeRemainingVal;
  }

  /** @java SettingsNetwork.setPlayerTimeRemaining(int[]) */
  public setPlayerTimeRemaining(playerTimeRemaining: number[]): void {
    this.playerTimeRemainingVal = playerTimeRemaining;
  }

  /** @java SettingsNetwork.loadingNetworkGame() */
  public loadingNetworkGame(): boolean {
    return this.loadingNetworkGameVal;
  }

  /** @java SettingsNetwork.setLoadingNetworkGame(boolean) */
  public setLoadingNetworkGame(loadingNetworkGame: boolean): void {
    this.loadingNetworkGameVal = loadingNetworkGame;
  }

  /** @java SettingsNetwork.activePlayers() */
  public activePlayers(): boolean[] {
    return this.activePlayersVal;
  }

  /** @java SettingsNetwork.setActivePlayers(boolean[]) */
  public setActivePlayers(activePlayers: boolean[]): void {
    this.activePlayersVal = activePlayers;
  }

  /** @java SettingsNetwork.onlinePlayers() */
  public onlinePlayers(): boolean[] {
    return this.onlinePlayersVal;
  }

  /** @java SettingsNetwork.setOnlinePlayers(boolean[]) */
  public setOnlinePlayers(onlinePlayers: boolean[]): void {
    this.onlinePlayersVal = onlinePlayers;
  }

  /** @java SettingsNetwork.drawProposedPlayers() */
  public drawProposedPlayers(): boolean[] {
    return this.drawProposedPlayersVal;
  }

  /** @java SettingsNetwork.setDrawProposedPlayers(boolean[]) */
  public setDrawProposedPlayers(drawProposedPlayers: boolean[]): void {
    this.drawProposedPlayersVal = drawProposedPlayers;
  }

  /** @java SettingsNetwork.longerNetworkPolling() */
  public longerNetworkPolling(): boolean {
    return this.longerNetworkPollingVal;
  }

  /** @java SettingsNetwork.setLongerNetworkPolling(boolean) */
  public setLongerNetworkPolling(longer: boolean): void {
    this.longerNetworkPollingVal = longer;
  }

  /** @java SettingsNetwork.noNetworkRefresh() */
  public noNetworkRefresh(): boolean {
    return this.noNetworkRefreshVal;
  }

  /** @java SettingsNetwork.setNoNetworkRefresh(boolean) */
  public setNoNetworkRefresh(no: boolean): void {
    this.noNetworkRefreshVal = no;
  }

  /** @java SettingsNetwork.lastServerTime() */
  public lastServerTime(): number {
    return this.lastServerTimeVal;
  }

  /** @java SettingsNetwork.setLastServerTime(int) */
  public setLastServerTime(lastServerTime: number): void {
    this.lastServerTimeVal = lastServerTime;
  }

  /** @java SettingsNetwork.secretPlayerNetworkNumber() */
  public secretPlayerNetworkNumber(): number {
    return this.secretPlayerNetworkNumberVal;
  }

  /** @java SettingsNetwork.setSecretPlayerNetworkNumber(int) */
  public setSecretPlayerNetworkNumber(secretPlayerNetworkNumber: number): void {
    this.secretPlayerNetworkNumberVal = secretPlayerNetworkNumber;
  }

  // -------------------------------------------------------------------------
}
