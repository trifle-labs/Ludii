// @java Core/src/game/functions/ints/size/Size.java

// Root grammar dispatcher only. Do not register `int:size`: compileInt routes
// concrete subtypes through compound keys such as `size:Array`, `size:Stack`,
// `size:Group`, `size:LargePiece`, and `size:Territory`.
// Java Size.construct(...) delegates to subtype classes (Core/src/game/functions/ints/size/Size.java:43-220).
