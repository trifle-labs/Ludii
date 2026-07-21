// @java Manager/src/manager/PlayerInterface.java

import type { Context } from "../../../../context.js";
import type { Move } from "../../../../move.js";

/**
 * Interface for specifying functions within the PlayerApp, which can be called
 * from within the Manager project.
 *
 * @java manager.PlayerInterface
 * @author Matthew.Stephenson
 */
export interface PlayerInterface {
  /** @java PlayerInterface.getNameFromJar() */
  getNameFromJar(): Record<string, unknown> | null;

  /** @java PlayerInterface.getNameFromJson() */
  getNameFromJson(): Record<string, unknown> | null;

  /** @java PlayerInterface.getNameFromAiDef() */
  getNameFromAiDef(): Record<string, unknown> | null;

  /** @java PlayerInterface.loadGameFromName(String, List, boolean) */
  loadGameFromName(name: string, options: string[], debug: boolean): void;

  /** @java PlayerInterface.addTextToStatusPanel(String) */
  addTextToStatusPanel(text: string): void;

  /** @java PlayerInterface.addTextToAnalysisPanel(String) */
  addTextToAnalysisPanel(text: string): void;

  /** @java PlayerInterface.selectAnalysisTab() */
  selectAnalysisTab(): void;

  /** @java PlayerInterface.repaint() */
  repaint(): void;

  /** @java PlayerInterface.reportForfeit(int) */
  reportForfeit(playerForfeitNumber: number): void;

  /** @java PlayerInterface.reportTimeout(int) */
  reportTimeout(playerForfeitNumber: number): void;

  /** @java PlayerInterface.reportDrawAgreed() */
  reportDrawAgreed(): void;

  /** @java PlayerInterface.updateFrameTitle(boolean) */
  updateFrameTitle(alsoUpdateMenu: boolean): void;

  /** @java PlayerInterface.updateTabs(Context) */
  updateTabs(context: Context): void;

  /** @java PlayerInterface.restartGame() */
  restartGame(): void;

  /** @java PlayerInterface.repaintTimerForPlayer(int) */
  repaintTimerForPlayer(playerId: number): void;

  /** @java PlayerInterface.setTemporaryMessage(String) */
  setTemporaryMessage(text: string): void;

  /** @java PlayerInterface.refreshNetworkDialog() */
  refreshNetworkDialog(): void;

  /** @java PlayerInterface.postMoveUpdates(Move, boolean) */
  postMoveUpdates(move: Move, noAnimation: boolean): void;
}
