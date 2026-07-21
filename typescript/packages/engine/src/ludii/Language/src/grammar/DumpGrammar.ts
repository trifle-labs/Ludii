// @java Language/src/grammar/DumpGrammar.java

/**
 * Entry point that generates and dumps the grammar to a file.
 *
 * @java grammar/DumpGrammar.java
 */

import { Grammar } from "./Grammar.js";

/**
 * @java grammar.DumpGrammar
 */
export class DumpGrammar {
  /**
   * @java DumpGrammar.main(String[])
   */
  public static main(_args: string[]): void {
    Grammar.grammar().execute();
  }
}
