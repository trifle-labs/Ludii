// @java Core/src/other/WeaklyCachingGameLoader.java WeaklyCachingGameLoader
/**
 * Faithful 1:1 transliteration of other.WeaklyCachingGameLoader.
 *
 * This game loader:
 *  1) Blocks; will only compile and return one game at a time.
 *     (Java: synchronized method.  TS is single-threaded so there is no
 *     multi-thread race; the synchronisation semantics are preserved as a
 *     comment.  Callers that wrap this in workers must add their own locking.)
 *  2) Caches compiled game objects using weak references.
 *     (Java: WeakReference<Game>.  TS: WeakRef<IGame>, available in ES2021+.
 *     The WeakRef deref() call maps exactly to WeakReference.get().)
 *
 * Deferrals:
 *  - StringPair: replaced by a plain string key built from gameName + "||" + rulesetName.
 *  - GameLoader.loadGameFromName: declared as an injected dependency (IGameLoader)
 *    so this file compiles standalone without the live GameLoader module.
 *  - Game: replaced by the opaque IGame interface.
 *
 * @author Dennis Soemers (Java original)
 * @java other.WeaklyCachingGameLoader
 */

// ---------------------------------------------------------------------------
// Minimal opaque interfaces for types that live in other engine modules.
// ---------------------------------------------------------------------------

/** Minimal surface of game.Game */
export type IGame = unknown;

/**
 * Injectable stand-in for other.GameLoader.
 * The default implementation throws so that callers must supply a real loader.
 * This mirrors the Java pattern where GameLoader is a static utility class.
 */
export interface IGameLoader {
  loadGameFromName(gameName: string, rulesetName: string | null): IGame;
}

/** Default no-op loader that throws — replace with a real implementation. */
const defaultGameLoader: IGameLoader = {
  loadGameFromName(_gameName: string, _rulesetName: string | null): IGame {
    throw new Error(
      "WeaklyCachingGameLoader: no IGameLoader injected. " +
      "Call WeaklyCachingGameLoader.setGameLoader() before use."
    );
  },
};

// ---------------------------------------------------------------------------
// WeaklyCachingGameLoader
// ---------------------------------------------------------------------------

/**
 * A game loader object that can be useful for situations with lots of
 * multi-threading and partial overlap in games used between threads.
 *
 * This game loader:
 *  1) Blocks; will only compile and return one game at a time
 *  2) Caches compiled game objects using weak references
 *
 * If multiple threads want to compile and use the same Game object
 * simultaneously, they will only actually compile once and share the same
 * object.  This can save a lot of memory.  However, when no thread uses a Game
 * object anymore, it will not remain stuck in cache.
 *
 * @java other.WeaklyCachingGameLoader
 */
export class WeaklyCachingGameLoader {
  // -------------------------------------------------------------------------

  /** Singleton instance @java WeaklyCachingGameLoader#SINGLETON */
  static readonly SINGLETON: WeaklyCachingGameLoader = new WeaklyCachingGameLoader();

  /**
   * Our cache of weak references to compiled game objects.
   * Java: Map<StringPair, WeakReference<Game>>
   * TS:   Map<string, WeakRef<object>>
   * The key is built as `gameName + "||" + (rulesetName ?? "")` to mirror
   * Java's StringPair(gameName, rulesetName != null ? rulesetName : "").
   * @java WeaklyCachingGameLoader#gameCache
   */
  private readonly gameCache: Map<string, WeakRef<object>> = new Map();

  /** Injectable game loader; defaults to throwing stub. */
  private gameLoader: IGameLoader = defaultGameLoader;

  // -------------------------------------------------------------------------

  /**
   * Constructor; private in Java (singleton pattern).
   * @java WeaklyCachingGameLoader()
   */
  private constructor() {
    // Do nothing
  }

  // -------------------------------------------------------------------------

  /**
   * Inject a real IGameLoader implementation.
   * Not present in Java (GameLoader is a static class); provided here so the
   * TS port compiles and operates correctly without editing existing files.
   */
  setGameLoader(loader: IGameLoader): void {
    this.gameLoader = loader;
  }

  // -------------------------------------------------------------------------

  /**
   * @param gameName
   * @param rulesetName
   * @returns Game object for given game name and ruleset name
   * @java WeaklyCachingGameLoader#loadGameFromName (synchronized)
   */
  loadGameFromName(gameName: string, rulesetName: string | null): IGame {
    // Java: synchronized — single-threaded TS has no equivalent; noted here.
    let returnGame: IGame | null = null;

    // Java: new StringPair(gameName, rulesetName != null ? rulesetName : "")
    const key = `${gameName}||${rulesetName !== null && rulesetName !== undefined ? rulesetName : ""}`;

    // Java: final WeakReference<Game> gameRef = gameCache.get(key);
    const gameRef = this.gameCache.get(key);

    if (gameRef === undefined) {
      // Java: returnGame = GameLoader.loadGameFromName(gameName, rulesetName);
      returnGame = this.gameLoader.loadGameFromName(gameName, rulesetName);
      // Java: gameCache.put(key, new WeakReference<Game>(returnGame));
      this.gameCache.set(key, new WeakRef(returnGame as object));
    } else {
      // Java: returnGame = gameRef.get();
      returnGame = (gameRef.deref() as IGame) ?? null;

      if (returnGame === null || returnGame === undefined) {
        // Java: returnGame = GameLoader.loadGameFromName(gameName, rulesetName);
        returnGame = this.gameLoader.loadGameFromName(gameName, rulesetName);
        // Java: gameCache.put(key, new WeakReference<Game>(returnGame));
        this.gameCache.set(key, new WeakRef(returnGame as object));
      }
    }

    return returnGame as IGame;
  }

  // -------------------------------------------------------------------------
}
