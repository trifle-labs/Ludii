// @java Common/src/main/FileHandling.java

/**
 * Common file handling routines.
 *
 * @java main/FileHandling.java
 * @author cambolbro and Dennis Soemers and Matthew.Stephenson
 */
export class FileHandling {

  //-------------------------------------------------------------------------

  /** Only need to compute this once, afterwards we can just return it immediately. @java FileHandling.gamesList */
  private static gamesList: string[] | null = null;

  //-------------------------------------------------------------------------

  /**
   * @return List of all the games that we can automatically find (i.e. the built-in games).
   * @java FileHandling.listGames()
   */
  public static listGames(): string[] {
    if (FileHandling.gamesList === null) {
      // In the TypeScript/browser environment, JAR/classpath scanning is not available.
      // Return empty list as fallback; consumers may inject a game list externally.
      FileHandling.gamesList = [];
    }

    // To protect against users accidentally modifying this array, we return a copy
    return FileHandling.gamesList.filter(s => !FileHandling.shouldIgnoreLud(s));
  }

  //-------------------------------------------------------------------------

  /**
   * @param lud
   * @return True if we wish to ignore the given lud
   * @java FileHandling.shouldIgnoreLud(String)
   */
  public static shouldIgnoreLud(lud: string): boolean {
    return (
      lud.includes("lud/bad/") ||
      lud.includes("lud/bad_playout/") ||
      lud.includes("lud/wishlist/")
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @param lud
   * @return True if we wish to ignore the given lud (release version)
   * @java FileHandling.shouldIgnoreLudRelease(String)
   */
  public static shouldIgnoreLudRelease(lud: string): boolean {
    return (
      FileHandling.shouldIgnoreLudAnalysis(lud) ||
      lud.includes("/proprietary/")
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @param lud
   * @return True if we wish to ignore the given lud (thumbnail version)
   * @java FileHandling.shouldIgnoreLudThumbnails(String)
   */
  public static shouldIgnoreLudThumbnails(lud: string): boolean {
    return (
      FileHandling.shouldIgnoreLud(lud) ||
      lud.includes("/proprietary/") ||
      lud.includes("/subgame/") ||
      lud.includes("/test/") ||
      lud.includes("/wip/")
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @param lud
   * @return True if we wish to ignore the given lud (remote version)
   * @java FileHandling.shouldIgnoreLudRemote(String)
   */
  public static shouldIgnoreLudRemote(lud: string): boolean {
    return (
      FileHandling.shouldIgnoreLudRelease(lud) ||
      lud.includes("/puzzle/") ||
      lud.includes("/simulation/")
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @param lud
   * @return True if we wish to ignore the given lud (evaluation version)
   * @java FileHandling.shouldIgnoreLudEvaluation(String)
   */
  public static shouldIgnoreLudEvaluation(lud: string): boolean {
    return (
      FileHandling.shouldIgnoreLudRelease(lud) ||
      lud.includes("/puzzle/") ||
      lud.includes("/simulation/")
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @param lud
   * @return True if we wish to ignore the given lud (analysis version)
   * @java FileHandling.shouldIgnoreLudAnalysis(String)
   */
  public static shouldIgnoreLudAnalysis(lud: string): boolean {
    return (
      FileHandling.shouldIgnoreLud(lud) ||
      lud.includes("/subgame/") ||
      lud.includes("/test/") ||
      lud.includes("/wip/") ||
      lud.includes("/WishlistDLP/") ||
      lud.includes("/simulation/") ||
      lud.includes("/reconstruction/pending/") ||
      lud.includes("/reconstruction/validation/")
    );
  }

  //-------------------------------------------------------------------------

  /**
   * Recursively visit a directory path and collect .lud file paths.
   * In the TypeScript environment, file system access is not available by default.
   * This is a no-op stub; populate via listGames() injection instead.
   *
   * @java FileHandling.visit(String, List<String>)
   */
  static visit(_path: string, _names: string[]): void {
    // No-op in TypeScript/browser environment.
    // Java implementation uses java.io.File to walk directories.
  }

  //-------------------------------------------------------------------------

  /**
   * @param filePath
   * @return Whether this file contains a game description (not tested).
   * @java FileHandling.containsGame(String)
   */
  public static containsGame(_filePath: string): boolean {
    // In the TypeScript environment, file access is not available by default.
    // Escape hatch: always returns false; override via subclass or injection.
    return false;
  }

  //-------------------------------------------------------------------------

  /**
   * @param filePath
   * @return Text contents from file.
   * @java FileHandling.loadTextContentsFromFile(String)
   */
  public static loadTextContentsFromFile(_filePath: string): string {
    // In the TypeScript environment, file system access is not available by default.
    throw new Error("FileHandling.loadTextContentsFromFile: not supported in TypeScript environment");
  }

  //-------------------------------------------------------------------------

  /**
   * Recursively lists directory contents for a resource folder.
   * Works for regular files and also JARs (Java only).
   * In the TypeScript environment, returns null.
   *
   * @java FileHandling.getResourceListing(Class, String, String)
   */
  public static getResourceListing(
    _cls: unknown,
    _path: string,
    _filter: string
  ): string[] | null {
    // No-op in TypeScript/browser environment.
    return null;
  }

  //-------------------------------------------------------------------------

  /**
   * Optimised version of getResourceListing() for cases where we expect to find only
   * a single entry in the returned array.
   *
   * @java FileHandling.getResourceListingSingle(Class, String, String)
   */
  public static getResourceListingSingle(
    _cls: unknown,
    _path: string,
    _filter: string
  ): string[] | null {
    // No-op in TypeScript/browser environment.
    return null;
  }

  //-------------------------------------------------------------------------

  /**
   * @java FileHandling.listFilesOfType(String, String)
   */
  public static listFilesOfType(_path: string, _extension: string): string[] {
    // No-op in TypeScript/browser environment.
    return [];
  }

  /**
   * @java FileHandling.walk(String, List<String>, String)
   */
  static walk(_path: string, _files: string[], _extension: string): void {
    // No-op in TypeScript/browser environment.
  }

  //-------------------------------------------------------------------------

  /**
   * @java FileHandling.findMissingConstructors()
   */
  public static findMissingConstructors(): void {
    // No-op in TypeScript environment (Java IDE utility only).
  }

  //-------------------------------------------------------------------------

  /**
   * @java FileHandling.findEmptyRulesets()
   */
  public static findEmptyRulesets(): void {
    // No-op in TypeScript environment (Java IDE utility only).
  }

  //-------------------------------------------------------------------------

  /**
   * Print game options per .lud to file.
   * @param fileName
   * @java FileHandling.printOptionsToFile(String)
   */
  public static printOptionsToFile(_fileName: string): void {
    // No-op in TypeScript environment.
  }

  //-------------------------------------------------------------------------

  /**
   * Print game options per .lud to file.
   * @java FileHandling.saveReconstruction(String, String)
   */
  public static saveReconstruction(_name: string, _content: string): void {
    // No-op in TypeScript environment.
  }

  //-------------------------------------------------------------------------

  /**
   * @param name Path of game file (.lud) with name.
   * @return Contents of specified .lud file as string.
   * @java FileHandling.gameAsString(String)
   */
  public static gameAsString(_name: string): string {
    // In the TypeScript/browser environment, classpath resource loading is not available.
    // Return empty string as fallback.
    return "";
  }

  //-------------------------------------------------------------------------

  /**
   * @param fileContents The contents of the file.
   * @param filePath     The path of the file.
   * @param fileName     The name of the file.
   * @java FileHandling.saveStringToFile(String, String, String)
   */
  public static saveStringToFile(
    _fileContents: string,
    _filePath: string,
    _fileName: string
  ): void {
    // No-op in TypeScript environment.
  }

  //-------------------------------------------------------------------------

  /**
   * @return Whether cambolbro is compiling this project.
   * @java FileHandling.isCambolbro()
   */
  public static isCambolbro(): boolean {
    return FileHandling.isUser("/Users/cambolbro/eclipse/Ludii/dev/Player");
  }

  /**
   * @return Whether the specified person is compiling this project.
   * @java FileHandling.isUser(String)
   */
  public static isUser(_userName: string): boolean {
    // In TypeScript environment, user.dir is not available.
    return false;
  }

  //-------------------------------------------------------------------------
}
