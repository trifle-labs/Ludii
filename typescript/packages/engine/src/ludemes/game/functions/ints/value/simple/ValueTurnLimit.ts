// @java Core/src/game/functions/ints/value/simple/ValueTurnLimit.java

// TODO: needs value-subtype dispatch for `(value TurnLimit)`.
// Java `Value.construct(ValueSimpleType)` routes TurnLimit to this class
// (Value.java:73-80), but the TS registry currently dispatches only the outer
// `value` head. Registering this file under bare `value` would intercept
// `(value Player ...)`, `(value Piece ...)`, and bare `(value)`.
