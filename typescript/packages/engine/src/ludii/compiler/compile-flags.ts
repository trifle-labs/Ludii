// @java game/types/state/GameType.Stacking — Java accumulates game flags from
// the compiled ludeme tree (Hop/Step/Slide/Move gameFlags() OR in Stacking
// when stack:True). The reflection path mirrors that with a compile-scoped
// accumulator: play1to1 resets it before compiling and harvests it into the
// Game afterwards.
export const compileFlags = {
  /** Any stacking signal: stack:True move ludemes OR (place Stack ...). */
  usesStacking: false,
  /** stack:True MOVE ludemes only (Hop/Step/Slide/...): per-level moves. */
  usesStackMoves: false,
  /**
   * @java GameType.NotAllPass via Pass.gameFlags (Pass.java:78-79) — the (move Pass)
   * ludeme sets NotAllPass ONLY when game.players().count() == 1. play1to1 therefore
   * gates this flag on numPlayers === 1; a multiplayer game with (move Pass) (e.g.
   * Maleys's multi-capture continuation) MUST still all-pass-draw.
   */
  usesExplicitPass: false,
  /**
   * @java GameType.NotAllPass via AllPassed.gameFlags (AllPassed.java:71) and
   * PassEnd.gameFlags (PassEnd.java:49, type == NoEnd) — these set NotAllPass
   * UNCONDITIONALLY (no player-count check), so the engine's all-pass-draw
   * fallback must never fire for such games regardless of player count.
   */
  usesUnconditionalNotAllPass: false,
  /**
   * @java GameType.Count — OR'd in by SetCount (start), PlaceItem (count>1),
   * Add (count: not the constant 1), Sow, HandSite, and CountNumber
   * ((count at:…)). Feeds Game.requiresCount(): Java Game.java:893 —
   * `!isStacking() && (anyHandContainer || (gameFlags & Count))`. ActionAdd's
   * occupied-site branch uses it to decide between accumulating the count and
   * forcing 1 (ActionAdd.java:310).
   */
  usesCount: false,
};

export function resetCompileFlags(): void {
  compileFlags.usesStacking = false;
  compileFlags.usesStackMoves = false;
  compileFlags.usesExplicitPass = false;
  compileFlags.usesUnconditionalNotAllPass = false;
  compileFlags.usesCount = false;
}
