// @java Common/src/main/DaemonThreadFactory.java

/**
 * Thread factory that produces daemon threads.
 *
 * In TypeScript there is no equivalent of Java daemon threads; this class is
 * retained as a structural port.  The {@link newThread} method accepts a
 * {@link Runnable}-equivalent callback and returns a minimal thread descriptor.
 *
 * @java main/DaemonThreadFactory.java
 * @author Dennis Soemers
 */

/**
 * Minimal shim for a Java Thread.
 * @java java.lang.Thread
 */
export interface ThreadHandle {
  /** @java Thread.isDaemon() */
  isDaemon(): boolean;
  /** Start (run) the thread. @java Thread.start() */
  start(): void;
}

/**
 * Minimal shim for java.util.concurrent.ThreadFactory.
 * @java java.util.concurrent.ThreadFactory
 */
export interface ThreadFactory {
  /** @java ThreadFactory.newThread(Runnable) */
  newThread(r: () => void): ThreadHandle;
}

export class DaemonThreadFactory implements ThreadFactory {
  // --------------------------------------------------------------------------

  /** Singleton. @java DaemonThreadFactory.INSTANCE */
  public static readonly INSTANCE: ThreadFactory = new DaemonThreadFactory();

  // --------------------------------------------------------------------------

  /** @java DaemonThreadFactory() (private constructor) */
  private constructor() {
    // Do nothing
  }

  // --------------------------------------------------------------------------

  /**
   * @java DaemonThreadFactory.newThread(Runnable)
   */
  public newThread(r: () => void): ThreadHandle {
    let started = false;
    return {
      isDaemon(): boolean { return true; },
      start(): void {
        if (!started) {
          started = true;
          // Best-effort async execution in JS environments
          if (typeof Promise !== "undefined") {
            Promise.resolve().then(r);
          } else {
            r();
          }
        }
      },
    };
  }

  // --------------------------------------------------------------------------
}
