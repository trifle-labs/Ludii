/**
 * @java game/rules/phase/Phase.java
 *
 * Defines one phase of a game.
 *
 * A Phase holds:
 *   - name:        string label for this phase
 *   - play:        the move generator (Play) for this phase
 *   - end:         optional per-phase end rule
 *   - nextPhases:  ordered list of NextPhase transition conditions
 *
 * @java game/rules/phase/Phase.java — Phase(name, role, mode, play, end, nextPhase, nextPhases)
 */

import type { Play } from "../play/Play.js";
import type { End } from "../end/End.js";
import type { NextPhase } from "./NextPhase.js";
import type { Mode } from "../../mode/Mode.js";
import type { Playout } from "../../../other/playout/Playout.js";
import type { RoleTypeFull } from "../../types/play/RoleType.js";

type PhaseRoleType = RoleTypeFull | string;

export class Phase {
  /** Name of the phase. @java Phase.name() */
  public readonly name: string;
  /** Owner role of this phase. @java Phase.owner() */
  public readonly role: PhaseRoleType;
  /** Move logic. @java Phase.play() */
  public play: Play;
  /** Per-phase end logic (optional). @java Phase.end() */
  public end: End | null;
  /** Conditions to transition to another phase. @java Phase.nextPhase() */
  public readonly nextPhases: readonly NextPhase[];
  /**
   * Owner role of this phase: 0=Shared (all players), N=player N only.
   * @java Phase.owner() — RoleType.owner() returns player id, or 0 for Shared
   * Used by State.initPhase() to assign initial phases to players.
   */
  public readonly ownerPlayerId: number;
  /** Mode for this phase. @java Phase.mode() */
  private readonly modeValue: Mode | null;
  /** Playout implementation to use inside this phase. @java Phase.playout() */
  private playoutValue: Playout | null;

  /**
   * @java game/rules/phase/Phase.java — Phase(name, role, mode, play, end, nextPhase, nextPhases)
   */
  public constructor(
    name: string,
    role: PhaseRoleType | null | undefined,
    mode: Mode | null | undefined,
    play: Play,
    end?: End | null,
    nextPhase?: NextPhase | null,
    nextPhases?: readonly NextPhase[] | null,
  ) {
    if (nextPhase != null && nextPhases != null) {
      throw new Error("Zero or one Or parameter must be non-null.");
    }

    this.name = name;
    this.role = role ?? "Shared";
    this.modeValue = mode ?? null;
    this.play = play;
    this.end = end ?? null;
    this.nextPhases = nextPhase != null ? [nextPhase] : nextPhases ?? [];
    this.ownerPlayerId = phaseRoleOwner(this.role);
    this.playoutValue = null;
  }

  /** @java Phase.mode() */
  public mode(): Mode | null {
    return this.modeValue;
  }

  /** @java Phase.nextPhase() */
  public nextPhase(): readonly NextPhase[] {
    return this.nextPhases;
  }

  /** @java Phase.owner() */
  public owner(): PhaseRoleType {
    return this.role;
  }

  /** @java Phase.setPlay(Play) */
  public setPlay(play: Play): void {
    this.play = play;
  }

  /** @java Phase.setEnd(End) */
  public setEnd(end: End | null): void {
    this.end = end;
  }

  /** @java Phase.playout() */
  public playout(): Playout | null {
    return this.playoutValue;
  }

  /** @java Phase.setPlayout(Playout) */
  public setPlayout(playout: Playout | null): void {
    this.playoutValue = playout;
  }
}

function phaseRoleOwner(role: PhaseRoleType): number {
  const player = /^P(\d+)$/.exec(role);
  if (player) return Number(player[1]);

  const team = /^Team(\d+)$/.exec(role);
  if (team) return Number(team[1]);

  return 0;
}
