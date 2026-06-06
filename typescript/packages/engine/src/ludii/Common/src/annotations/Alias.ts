// @java Common/src/annotations/Alias.java

/**
 * Alias to use for keyword in grammar instead of class.
 *
 * @java annotations/Alias.java
 * @author cambolbro
 *
 * Java: @Retention(RetentionPolicy.RUNTIME) @interface Alias { String alias() default ""; }
 * TypeScript: represented as a value-carrying marker object.
 */
export interface AliasAnnotation {
  /** @java Alias.alias() */
  readonly alias: string;
}

/**
 * Create an Alias annotation value.
 * @java @Alias(alias = "...")
 */
export function Alias(alias: string = ""): AliasAnnotation {
  return { alias };
}
