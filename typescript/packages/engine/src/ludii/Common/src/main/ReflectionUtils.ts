// @java Common/src/main/ReflectionUtils.java

/**
 * Some useful methods for Reflection.
 *
 * @java main/ReflectionUtils.java
 * @author Dennis Soemers
 */
export class ReflectionUtils {

  /**
   * Private constructor — should not be used.
   * @java ReflectionUtils()
   */
  private constructor() {
    // Should not be used
  }

  //-------------------------------------------------------------------------

  /**
   * Converts an object which should be an array according to reflection, into
   * an array.
   *
   * @param array
   * @return The given object, but as an array of Objects
   * @java ReflectionUtils.castArray(Object)
   */
  public static castArray(array: unknown): unknown[] {
    if (Array.isArray(array)) {
      return array as unknown[];
    }
    // Fallback: wrap single value
    return [array];
  }

  /**
   * Helper method to collect all declared fields of a class, including
   * fields inherited from superclasses.
   *
   * @param clazz
   * @return All fields of the given class (including inherited fields)
   * @java ReflectionUtils.getAllFields(Class)
   *
   * Note: In TypeScript/JS, there is no runtime Class reflection equivalent
   * to Java's getDeclaredFields(). This returns an empty array as an
   * escape-hatch; callers in the Ludii engine can inspect prototype chains
   * manually if needed.
   */
  public static getAllFields(clazz: unknown): string[] {
    // Java: uses clazz.getDeclaredFields() + recursion up superclass chain.
    // In JS there is no native equivalent. Return object's own property names
    // if the argument is an object/prototype, or empty array otherwise.
    const result: string[] = [];
    if (clazz !== null && typeof clazz === "object") {
      let proto: unknown = clazz;
      while (proto !== null && proto !== Object.prototype) {
        const keys = Object.getOwnPropertyNames(proto);
        for (const key of keys) {
          if (!result.includes(key)) {
            result.push(key);
          }
        }
        proto = Object.getPrototypeOf(proto as object);
      }
    }
    return result;
  }

  //-------------------------------------------------------------------------
}
