// @java Core/src/game/functions/ints/value/simple/ValueMoveLimit.java

// TODO: needs value-subtype dispatch for `(value MoveLimit)`.
// Java `Value.construct(ValueSimpleType)` routes MoveLimit to this class
// (Value.java:73-80), but the TS registry currently dispatches only the outer
// `value` head. Registering this file under bare `value` would intercept
// `(value Player ...)`, `(value Piece ...)`, and bare `(value)`.
