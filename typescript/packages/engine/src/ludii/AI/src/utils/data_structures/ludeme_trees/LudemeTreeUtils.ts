// @java AI/src/utils/data_structures/ludeme_trees/LudemeTreeUtils.java

/**
 * Utils for building trees of Ludemes for AI purposes.
 *
 * @java utils.data_structures.ludeme_trees.LudemeTreeUtils
 * @author Dennis Soemers
 */

import { Node } from "../support/zhang_shasha/Node.js";
import { Tree } from "../support/zhang_shasha/Tree.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java other.Ludeme (opaque) */
type Ludeme = {
  getClass(): { getName(): string; [key: string]: unknown };
  [key: string]: unknown;
};

/** @java main.ReflectionUtils (deferred) */
type ReflectionUtils = {
  getAllFields(clazz: { getName(): string; [key: string]: unknown }): Field[];
  castArray(value: unknown): unknown[];
};

/** @java java.lang.reflect.Field */
type Field = {
  getName(): string;
  getModifiers(): number;
  setAccessible(val: boolean): void;
  get(obj: unknown): unknown;
  getType(): { isPrimitive(): boolean };
};

/** Modifier.STATIC = 8 */
const MODIFIER_STATIC = 8;

/** Deferred: not-yet-ported ReflectionUtils */
const ReflectionUtilsDeferred = {
  getAllFields(_clazz: unknown): Field[] {
    // DEFERRED: ReflectionUtils is in batch Common#10; use empty list as stub
    return [];
  },
  castArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    return [];
  },
} as unknown as ReflectionUtils;

// ---------------------------------------------------------------------------

/**
 * @java utils.data_structures.ludeme_trees.LudemeTreeUtils
 */
export class LudemeTreeUtils {

  /**
   * Builds a Zhang-Shasha tree (for tree edit distance computations) for the given
   * root ludeme.
   *
   * @param rootLudeme
   * @return Tree that can be used for Zhang-Shasha tree edit distance computations
   * @java LudemeTreeUtils.buildLudemeZhangShashaTree(Ludeme)
   */
  static buildLudemeZhangShashaTree(rootLudeme: Ludeme | null): Tree {
    if (rootLudeme === null || rootLudeme === undefined) {
      return new Tree(new Node(""));
    } else {
      const root = LudemeTreeUtils._buildTree(rootLudeme, new Map<object, Set<string>>());
      return new Tree(root);
    }
  }

  /**
   * Recursively builds tree for given ludeme.
   * @param ludeme Root of ludemes-subtree to traverse
   * @param visited Map of fields we've already visited, to avoid cycles
   * @return Root node for the subtree rooted in given ludeme
   * @java LudemeTreeUtils.buildTree(Ludeme, Map)
   */
  private static _buildTree(
    ludeme: Ludeme,
    visited: Map<object, Set<string>>
  ): Node {
    const clazz = ludeme.getClass();
    const fields = ReflectionUtilsDeferred.getAllFields(clazz);
    const node = new Node(clazz.getName());

    try {
      for (const field of fields) {
        if (field.getName().includes("$")) continue;

        field.setAccessible(true);

        if ((field.getModifiers() & MODIFIER_STATIC) !== 0) continue;

        if (visited.has(ludeme as object) && (visited.get(ludeme as object) as Set<string>).has(field.getName())) {
          continue; // avoid stack overflow
        }

        const value = field.get(ludeme);

        if (!visited.has(ludeme as object)) {
          visited.set(ludeme as object, new Set<string>());
        }

        (visited.get(ludeme as object) as Set<string>).add(field.getName());

        if (value !== null && value !== undefined) {
          const valueClass = (value as Ludeme).getClass?.();

          if (valueClass !== undefined) {
            // It's a Ludeme (has getClass method like Ludeme)
            const innerLudeme = value as Ludeme;
            const child = LudemeTreeUtils._buildTree(innerLudeme, visited);
            node.children.push(child);
          } else if (Array.isArray(value)) {
            const array = value as unknown[];
            for (const element of array) {
              if (element !== null && element !== undefined) {
                const elemLudeme = element as Ludeme;
                if (typeof elemLudeme.getClass === "function") {
                  const child = LudemeTreeUtils._buildTree(elemLudeme, visited);
                  node.children.push(child);
                }
              }
            }
          } else if (typeof (value as Iterable<unknown>)[Symbol.iterator] === "function" && typeof value !== "string") {
            const iterable = value as Iterable<unknown>;
            for (const element of iterable) {
              if (element !== null && element !== undefined) {
                const elemLudeme = element as Ludeme;
                if (typeof elemLudeme.getClass === "function") {
                  const child = LudemeTreeUtils._buildTree(elemLudeme, visited);
                  node.children.push(child);
                }
              }
            }
          } else if (field.getType().isPrimitive() || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            node.children.push(new Node(String(value)));
          }
        } else {
          node.children.push(new Node("null"));
        }

        // Remove again, to avoid excessively shortening the subtree if we encounter
        // this object again later
        (visited.get(ludeme as object) as Set<string>).delete(field.getName());
      }
    } catch (e) {
      console.error(e);
    }

    return node;
  }
}
