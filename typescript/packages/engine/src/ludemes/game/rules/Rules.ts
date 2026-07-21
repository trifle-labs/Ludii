/**
 * @java game/rules/Rules.java Rules
 *
 * 1:1-port rules holder.
 *
 * Holds either:
 *   (a) a bare play rule + end rule wrapped in Java's default phase, or
 *   (b) an array of Phase objects + end rule (phases game).
 *
 * When phases are present, `play` is the shared play rule if supplied,
 * otherwise phases[0].play (for backward-compat accessors); Game uses
 * `phases` directly.
 *
 * @java game/rules/Rules.java — phases()/play()/end()
 */

import type { Play } from "./play/Play.js";
import type { End } from "./end/End.js";
import type { Phase } from "./phase/Phase.js";
import type { Meta } from "./meta/Meta.js";
import type { Start } from "./start/Start.js";
import { Phase as PhaseCtor } from "./phase/Phase.js";
import { Play as PlayCtor } from "./play/Play.js";
import { Or } from "./play/moves/nonDecision/operators/logical/Or.js";

export class Rules {
  /** Metarules defined before play. @java Rules.meta() */
  public readonly meta: Meta | null;
  /** Starting instructions. @java Rules.start() */
  public readonly start: Start | null;
  /** The play rules (bare form, shared phase play, or phases[0].play). */
  public readonly play: Play;
  /** The end rules. @java Rules.end() */
  public end: End | null;
  /**
   * Phase list.
   * @java game/rules/Rules.java — phases field
   */
  public readonly phases: readonly Phase[];

  /**
   * For defining the rules with start, play and end.
   * @java Rules(@Opt Meta meta, @Opt Start start, Play play, End end)
   */
  public constructor(meta: Meta | null | undefined, start: Start | null | undefined, play: Play, end: End);

  /**
   * For defining the rules with some phases.
   * @java Rules(@Opt Meta meta, @Opt Start start, @Opt Play play, @Name Phase[] phases, @Opt End end)
   */
  public constructor(
    meta: Meta | null | undefined,
    start: Start | null | undefined,
    play: Play | null | undefined,
    phases: readonly Phase[],
    end?: End | null,
  );

  public constructor(
    meta: Meta | null | undefined,
    start: Start | null | undefined,
    play: Play | null | undefined,
    phasesOrEnd: readonly Phase[] | End,
    end: End | null = null,
  ) {
    this.meta = meta ?? null;
    this.start = start ?? null;

    if (isPhaseArray(phasesOrEnd)) {
      this.phases = phasesOrEnd;
      for (const phase of this.phases) {
        if (phase.play == null) {
          if (play == null) throw new Error("Rules: phase is missing play and no shared play was provided.");
          phase.setPlay(play);
        } else if (play != null) {
          phase.setPlay(new PlayCtor(new Or(phase.play.moves, play.moves, null)));
        }
      }
      const firstPlay = play ?? this.phases[0]?.play;
      if (firstPlay == null) throw new Error("Rules: missing play.");
      this.play = firstPlay;
      this.end = end ?? null;
    } else {
      if (play == null) throw new Error("Rules: missing play.");
      this.play = play;
      this.phases = [new PhaseCtor("Default Phase", "Shared", null, play, null, null, null)];
      this.end = phasesOrEnd;
    }
  }

  /** @java Rules.setEnd(End) */
  public setEnd(end: End | null): void {
    this.end = end;
  }
}

function isPhaseArray(value: readonly Phase[] | End): value is readonly Phase[] {
  return Array.isArray(value);
}
