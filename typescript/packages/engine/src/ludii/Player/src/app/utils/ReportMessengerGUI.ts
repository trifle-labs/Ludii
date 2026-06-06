// @java Player/src/app/utils/ReportMessengerGUI.java

import type { ReportMessenger } from "../../../../Common/src/main/grammar/Report.js";

/**
 * Minimal structural type for app.PlayerApp (not yet ported in this batch).
 * @java app.PlayerApp
 */
interface PlayerApp {
  addTextToStatusPanel(s: string): void;
  addTextToAnalysisPanel(s: string): void;
}

// -------------------------------------------------------------------------

/**
 * Report Messenger implementation for the GUI.
 *
 * Faithful 1:1 port of app.utils.ReportMessengerGUI.
 * Java uses EventQueue.invokeLater to dispatch to the Swing EDT; in TypeScript
 * we simply schedule via Promise.resolve() (microtask) which is the closest
 * idiomatic equivalent in the browser / Node event loop.
 *
 * @author Matthew.Stephenson (Java original)
 * @java app.utils.ReportMessengerGUI
 */
export class ReportMessengerGUI implements ReportMessenger {

  private readonly _app: PlayerApp;

  // -------------------------------------------------------------------------

  /** @java ReportMessengerGUI(PlayerApp) */
  constructor(app: PlayerApp) {
    this._app = app;
  }

  // -------------------------------------------------------------------------

  /**
   * @java ReportMessengerGUI#printMessageInStatusPanel(String)
   */
  printMessageInStatusPanel(s: string): void {
    try {
      // EventQueue.invokeLater equivalent — schedule as microtask
      Promise.resolve().then(() => {
        this._app.addTextToStatusPanel(s);
      }).catch((_e: unknown) => {
        // ignore
      });
    } catch (_e) {
      // ignore
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java ReportMessengerGUI#printMessageInAnalysisPanel(String)
   */
  printMessageInAnalysisPanel(s: string): void {
    try {
      Promise.resolve().then(() => {
        this._app.addTextToAnalysisPanel(s);
      }).catch((_e: unknown) => {
        // ignore
      });
    } catch (_e) {
      // ignore
    }
  }

  // -------------------------------------------------------------------------
}
