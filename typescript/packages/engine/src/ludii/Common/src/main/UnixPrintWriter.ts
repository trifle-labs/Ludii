// @java Common/src/main/UnixPrintWriter.java

/**
 * Subclass for PrintWriter that will always print Unix line endings.
 *
 * See: https://stackoverflow.com/a/14749004/6735980
 *
 * @java main/UnixPrintWriter.java
 * @author Dennis Soemers
 */
export class UnixPrintWriter {
  /** Underlying output buffer. @java UnixPrintWriter.out (inherited from PrintWriter) */
  private _buffer: string = "";

  /** File path or encoding context (not used in TS but mirrors Java constructors). */
  private readonly _filePath: string;

  // -------------------------------------------------------------------------

  /**
   * Constructor.
   *
   * @java UnixPrintWriter(File)
   */
  public constructor(filePath: string) {
    this._filePath = filePath;
  }

  // -------------------------------------------------------------------------

  /**
   * Write a single character.
   *
   * @java UnixPrintWriter.write(int)
   */
  public write(ch: string | number): void {
    if (typeof ch === "number") {
      this._buffer += String.fromCharCode(ch);
    } else {
      this._buffer += ch;
    }
  }

  /**
   * Print a string.
   *
   * @java PrintWriter.print(String)
   */
  public print(str: string): void {
    this._buffer += str;
  }

  /**
   * Print a line ending with Unix '\n' (overrides PrintWriter.println()).
   *
   * @java UnixPrintWriter.println()
   */
  public println(): void {
    this.write('\n');
  }

  /**
   * Print a string followed by Unix '\n'.
   *
   * @java PrintWriter.println(String)
   */
  public printlnStr(str: string): void {
    this._buffer += str;
    this.println();
  }

  /**
   * Flush and return buffered content (mirrors close/flush semantics).
   *
   * @java PrintWriter.flush()
   */
  public flush(): string {
    return this._buffer;
  }

  /** @java UnixPrintWriter._filePath accessor (not in Java, TS-only) */
  public filePath(): string {
    return this._filePath;
  }
}
