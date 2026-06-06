// @java Common/src/annotations/Opt.java

/**
 * Named parameter in the grammar.
 *
 * @java annotations/Opt.java
 * @author cambolbro
 *
 * Java: @Retention(RetentionPolicy.RUNTIME) @interface Opt {}
 * TypeScript: represented as a unique symbol marker.
 */
export const Opt: unique symbol = Symbol("Opt");
export type Opt = typeof Opt;
