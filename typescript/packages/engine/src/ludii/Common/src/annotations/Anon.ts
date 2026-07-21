// @java Common/src/annotations/Anon.java

/**
 * Anonymous parameter in the grammar, i.e. parameter name is not shown or
 * bracketed.
 *
 * @java annotations/Anon.java
 * @author cambolbro
 *
 * Java: @Retention(RetentionPolicy.RUNTIME) @interface Anon {}
 * TypeScript: represented as a unique symbol marker.
 */
export const Anon: unique symbol = Symbol("Anon");
export type Anon = typeof Anon;
