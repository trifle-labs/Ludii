// @java Generation/test/RandomGameTester.java

/**
 * Random game tester.
 *
 * @java RandomGameTester
 * @author cambolbro
 */

import { Generator } from "../src/approaches/random/Generator.js";

export class RandomGameTester {

  /**
   * @java RandomGameTester.main(String[])
   */
  public static main(_arg: string[]): void {
    Generator.testGames(10, true, false, false, false);
  }
}
