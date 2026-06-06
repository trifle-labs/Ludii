// @java Common/src/annotations/Hide.java

/**
 * Hides this class or constructor.
 *
 * 1. If applied to the class, then the class is not shown in the grammar.
 *    This is used for support classes for internal working, e.g. BaseMoves.
 *
 * 2. If applied to constructors, then the class shows in the grammar as a
 *    rule but the hidden constructors do not, e.g.
 *    <component> ::= <card> | <dice> | ...
 *
 * @java annotations/Hide.java
 * @author cambolbro
 *
 * Java: @Retention(RetentionPolicy.RUNTIME) @interface Hide {}
 * TypeScript: represented as a unique symbol marker.
 */
export const Hide: unique symbol = Symbol("Hide");
export type Hide = typeof Hide;
