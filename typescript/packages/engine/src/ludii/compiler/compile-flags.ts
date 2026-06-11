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
   * @java GameType.NotAllPass — set by Pass.gameFlags (Pass.java:79) and
   * AllPassed.gameFlags (AllPassed.java:71): a game with an explicit
   * (move Pass) / (all Passed) manages passing itself, so the engine's
   * all-pass-draw fallback must NOT fire (Bosh's between-rounds double
   * pass drew the game at ply 71 where Java plays 342).
   */
  usesExplicitPass: false,
};

export function resetCompileFlags(): void {
  compileFlags.usesStacking = false;
  compileFlags.usesStackMoves = false;
  compileFlags.usesExplicitPass = false;
}
