// @java Language/src/parser/KnownDefines.java

/**
 * Record of known defines from Common/res/def and below.
 *
 * @java parser/KnownDefines.java
 * @author cambolbro
 */

import { Report } from "../../../Common/src/main/grammar/Report.js";

// ---------------------------------------------------------------------------
// Escape-hatch interface for main.grammar.Define (not yet ported).

/** Minimal interface mirroring main.grammar.Define. */
export interface Define_ {
  tag(): string;
  formatted(): string;
}

// ---------------------------------------------------------------------------

/**
 * Record of known defines from Common/res/def and below.
 *
 * @java parser.KnownDefines
 */
export class KnownDefines {
  /** @java KnownDefines.knownDefines */
  private readonly knownDefines: Map<string, Define_> = new Map<string, Define_>();

  // -------------------------------------------------------------------------

  /**
   * Singleton provider pattern (mirrors Java's static inner class pattern).
   * @java KnownDefines.KnownDefinesProvider
   */
  private static readonly KNOWN_DEFINES: KnownDefines = (() => {
    const kd = new KnownDefines();
    return kd;
  })();

  // -------------------------------------------------------------------------

  /**
   * Private constructor: access class as singleton through getKnownDefines().
   *
   * @java KnownDefines()
   */
  constructor() {
    const report = new Report();
    this.loadKnownDefines(report);
    if (report.isError())
      console.warn(report.toString());
  }

  // -------------------------------------------------------------------------

  /**
   * Access point for getting known defines.
   *
   * @java KnownDefines.getKnownDefines()
   */
  public static getKnownDefines(): KnownDefines {
    return KnownDefines.KNOWN_DEFINES;
  }

  /**
   * @java KnownDefines.knownDefines()
   */
  public getKnownDefinesMap(): Map<string, Define_> {
    return this.knownDefines;
  }

  // -------------------------------------------------------------------------

  /**
   * Load known defines from file.
   *
   * @java KnownDefines.loadKnownDefines(Report)
   */
  loadKnownDefines(_report: Report): void {
    this.knownDefines.clear();
    // Java implementation loads .def files from the classpath (JAR or filesystem).
    // In a TS/browser environment, file-system access is not available.
    // Faithful stub: no defines loaded.
  }

  // -------------------------------------------------------------------------

  /**
   * Recurse through a directory of .def files and load them.
   *
   * @java KnownDefines.recurseKnownDefines(String, Report)
   */
  recurseKnownDefines(_path: string, _report: Report): void {
    // File-system recursion not available in TS environment; faithful stub.
  }

  // -------------------------------------------------------------------------

  /**
   * Processes a potential define file.
   *
   * @java KnownDefines.processDefFile(String, String, Report)
   */
  public static processDefFile(
    _defFilePath: string,
    _defRoot: string,
    _report: Report,
  ): Define_ | null {
    // InputStream / file reading not available in TS environment; returns null.
    return null;
  }

  // -------------------------------------------------------------------------
}
