// @java Common/src/annotations/Name.java

/**
 * Named parameter in the grammar.
 *
 * @java annotations/Name.java
 * @author cambolbro
 *
 * Java: @Retention(RetentionPolicy.RUNTIME) @interface Name {}
 * TypeScript: represented as a unique symbol marker.
 */
export const Name: unique symbol = Symbol("Name");
export type Name = typeof Name;
