// @java Language/src/grammar/ClassEnumerator.java

/**
 * Routines for enumerating classes.
 *
 * @java grammar/ClassEnumerator.java
 * @author Dennis Soemers and cambolbro
 *
 * NOTE: In TypeScript/JS there is no runtime class enumeration from the
 * classpath.  This module provides stub implementations that mirror the
 * Java API surface so that call-sites compile; actual class discovery is
 * not feasible in a JS runtime and always returns an empty list.
 */

// ---------------------------------------------------------------------------

/** Minimal mirror of java.lang.Package. */
export interface JavaPackage {
  /** @java Package.getName() */
  getName(): string;
}

/** Minimal mirror of a Java Class object. */
export interface JavaClass {
  /** @java Class.getName() */
  getName(): string;
  /** @java Class.getPackage() */
  getPackage(): JavaPackage;
}

// ---------------------------------------------------------------------------

/**
 * Routines for enumerating classes.
 *
 * @java grammar.ClassEnumerator
 */
export class ClassEnumerator {
  // In Java this loads a class by name from the classloader.
  // Not applicable in TS – always throws.
  /** @java ClassEnumerator.loadClass(String) */
  private static loadClass(_className: string): JavaClass {
    throw new Error(`ClassEnumerator.loadClass: not supported in TS runtime.`);
  }

  /**
   * Given a package name and a directory returns all classes within that
   * directory.
   *
   * @java ClassEnumerator.processDirectory(File, String)
   */
  public static processDirectory(
    _directory: unknown,
    _pkgname: string,
  ): JavaClass[] {
    // File-system class scanning is not available in a JS runtime.
    return [];
  }

  /**
   * Given a jar file and a package name returns all classes within jar file.
   *
   * @java ClassEnumerator.processJarfile(JarFile, String)
   */
  public static processJarfile(
    _jarFile: unknown,
    _pkgname: string,
  ): JavaClass[] {
    // JAR reading is not available in a JS runtime.
    return [];
  }

  /**
   * Return all classes contained in a given package.
   *
   * @java ClassEnumerator.getClassesForPackage(Package)
   */
  public static getClassesForPackage(_pkg: JavaPackage): JavaClass[] {
    // Java reflection-based package enumeration is not available in TS.
    return [];
  }
}
