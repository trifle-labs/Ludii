// @java Language/src/grammar/ClassEnumeratorFindAll.java

/**
 * Routines for enumerating all classes without a package prefix.
 *
 * @java grammar/ClassEnumeratorFindAll.java
 *
 * NOTE: In TypeScript/JS there is no runtime class enumeration from the
 * classpath or from JAR files.  This module provides stub implementations
 * that mirror the Java API surface; all methods return empty arrays.
 */

import type { JavaClass } from "./ClassEnumerator.js";

// ---------------------------------------------------------------------------

/**
 * @java grammar.ClassEnumeratorFindAll
 */
export class ClassEnumeratorFindAll {
  /** @java ClassEnumeratorFindAll.loadClass(String) */
  private static loadClass(_className: string): JavaClass {
    throw new Error(`ClassEnumeratorFindAll.loadClass: not supported in TS runtime.`);
  }

  /**
   * Given a directory returns all classes within that directory.
   *
   * @java ClassEnumeratorFindAll.processDirectory(File)
   */
  public static processDirectory(_directory: unknown): JavaClass[] {
    return [];
  }

  /**
   * Given a jar file's path returns all classes within the jar file.
   *
   * @java ClassEnumeratorFindAll.processJarfile(String)
   */
  public static processJarfile(_jarPath: string): JavaClass[] {
    return [];
  }
}
