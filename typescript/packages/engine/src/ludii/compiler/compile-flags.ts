// @java game/types/state/GameType.Stacking — Java accumulates game flags from
// the compiled ludeme tree (Hop/Step/Slide/Move gameFlags() OR in Stacking
// when stack:True). The reflection path mirrors that with a compile-scoped
// accumulator: play1to1 resets it before compiling and harvests it into the
// Game afterwards.
export const compileFlags = {
  usesStacking: false,
};

export function resetCompileFlags(): void {
  compileFlags.usesStacking = false;
}
