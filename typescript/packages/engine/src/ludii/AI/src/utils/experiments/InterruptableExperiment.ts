// @java AI/src/utils/experiments/InterruptableExperiment.java

/**
 * A wrapper around a (long) interruptible experiment. This class
 * provides a small, simple frame with a button that can be used to set a boolean
 * "interrupted" flag to true. An abstract method can be overridden by subclasses
 * to run an experiment. Inside that method, subclasses can periodically check the
 * flag, and cleanly interrupt the experiment (after performing any required
 * file saving etc.) if the button has been pressed.
 *
 * The complete GUI functionality can also be disabled (which allows the same experiment
 * code to run in headless mode on cluster for example).
 *
 * @java utils.experiments.InterruptableExperiment
 * @author Dennis Soemers
 */
export abstract class InterruptableExperiment {

  //-------------------------------------------------------------------------

  /** Flag which will be set to true if the interrupt button is pressed. @java InterruptableExperiment.interrupted */
  protected interrupted: boolean = false;

  /** Start time of experiment (in milliseconds). @java InterruptableExperiment.experimentStartTime */
  protected readonly experimentStartTime: number;

  /** Maximum wall time we're allowed to run for (in milliseconds). @java InterruptableExperiment.maxWallTimeMs */
  protected readonly maxWallTimeMs: number;

  //-------------------------------------------------------------------------

  /**
   * Creates an "interruptible" experiment (with button to interrupt
   * experiment if useGUI = True), which will then also immediately
   * start running.
   *
   * @param useGUI
   * @java InterruptableExperiment(boolean)
   */
  constructor(useGUI: boolean);

  /**
   * Creates an "interruptible" experiment (with button to interrupt
   * experiment if useGUI = True), which will then also immediately
   * start running.
   *
   * Using the checkWallTime() method, the experiment can also automatically
   * interrupt itself and exit cleanly before getting interrupted in a
   * not-clean manner due to exceeding wall time (e.g. on cluster)
   *
   * @param useGUI
   * @param maxWallTime Maximum wall time (in minutes)
   * @java InterruptableExperiment(boolean, int)
   */
  constructor(useGUI: boolean, maxWallTime: number);

  constructor(useGUI: boolean, maxWallTime: number = -1) {
    this.experimentStartTime = Date.now();
    this.maxWallTimeMs = 60 * 1000 * maxWallTime;

    if (useGUI) {
      // DEFERRED: GUI (JFrame / JButton) is not available in TypeScript.
      // In a browser/Electron environment, a UI element could be rendered here.
      // No-op in headless TypeScript environment.
    }

    try {
      this.runExperiment();
    } finally {
      // No frame to dispose in TypeScript
    }
  }

  //-------------------------------------------------------------------------

  /** Implement experiment code here. @java InterruptableExperiment.runExperiment() */
  abstract runExperiment(): void;

  //-------------------------------------------------------------------------

  /**
   * Checks if we're about to exceed maximum wall time, and automatically
   * sets the interrupted flag if we are.
   *
   * @param safetyBuffer Ratio of maximum wall time that we're willing to
   * throw away just to be safe (0.01 or 0.05 should be good values)
   * @java InterruptableExperiment.checkWallTime(double)
   */
  checkWallTime(safetyBuffer: number): void {
    if (this.maxWallTimeMs > 0) {
      const terminateAt = Math.trunc(
        this.experimentStartTime + (1.0 - safetyBuffer) * this.maxWallTimeMs
      );

      if (Date.now() >= terminateAt) {
        this.interrupted = true;
      }
    }
  }

  /**
   * Utility method that uses a given writer to print a single given
   * line to a log, but with the current time prepended.
   * @param logWriter
   * @param line
   * @java InterruptableExperiment.logLine(PrintWriter, String)
   */
  logLine(logWriter: { println(s: string): void } | null, line: string): void {
    if (logWriter !== null && logWriter !== undefined) {
      logWriter.println(
        `[${new Date().toISOString()}]: ${line}`
      );
    }
  }

  /**
   * @return Do we want to be interrupted?
   * @java InterruptableExperiment.wantsInterrupt()
   */
  wantsInterrupt(): boolean {
    return this.interrupted;
  }

  //-------------------------------------------------------------------------
}
