// @java Core/src/other/GameLoader.java GameLoader
/**
 * Java parity:
 * - Core/src/game/util/GameLoader.java
 *
 * The Java loader resolves a game by name, reads the corresponding
 * `.lud` from the resource bundle, and compiles it through Ludeme
 * expansion. The TS port covers the deterministic part: given a
 * `.lud` source string (or an already-parsed AST) it returns a
 * compiled `Game`. Resolving by registered name is a thin wrapper.
 */

import type { Game } from "./game.js";
import { compileLudSource, LudCompileError } from "./lud-compiler.js";

export class GameLoader {
  private readonly registry: Map<string, string> = new Map();

  /** Register a `.lud` source under a canonical name. */
  public register(name: string, source: string): void {
    if (!name) {
      throw new Error("GameLoader.register: name must be non-empty.");
    }
    this.registry.set(name, source);
  }

  /** Compile a `.lud` source string directly. */
  public loadFromSource(source: string): Game {
    return compileLudSource(source);
  }

  /** Compile a previously-registered game by name. */
  public load(name: string): Game {
    const source = this.registry.get(name);
    if (source === undefined) {
      throw new LudCompileError(`No game registered under "${name}".`);
    }
    return compileLudSource(source);
  }

  /** Return the names registered with this loader. */
  public list(): readonly string[] {
    return Object.freeze([...this.registry.keys()]);
  }
}
