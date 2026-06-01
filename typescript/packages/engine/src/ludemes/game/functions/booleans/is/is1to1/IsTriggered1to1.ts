// @java Core/src/game/functions/booleans/is/triggered/IsTriggered.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, isString, type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Triggered "<event>" <roleOrPlayer>)
 * Checks if a player was triggered before (event string is cosmetic; only
 * the player bit is tested, matching Java's isTriggered(event, pid) behaviour).
 * @java game/functions/booleans/is/triggered/IsTriggered.java
 */
export class IsTriggered1to1 implements BooleanFunction {
  /** @java IsTriggered.playerId */
  private readonly playerId: IntFunction;

  public constructor(playerId: IntFunction) {
    this.playerId = playerId;
  }

  /**
   * @java IsTriggered.eval(Context):
   *   context.active(pid) && context.state().isTriggered(event, pid)
   *   Event string ignored — only player bit tested (Java parity).
   */
  public eval(ctx: Context): boolean {
    const pid = this.playerId.eval(ctx);
    if (pid < 1) return false;
    // Java: context.active(pid) — player must be active
    const active = ctx.state.activePlayer(pid);
    if (!active) return false;
    // Java: state.isTriggered(event, pid) — tests bit (pid-1)
    return ctx.state.isTriggered(pid);
  }
}

registerBool1to1("is:triggered", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  // (is Triggered "event" <roleOrIntFn>)
  // positional[0] = "Triggered", positional[1] = event string (skip), positional[2] = player
  const { positional } = parseArgs1to1((node as LudList).items);
  // Find the first non-string, non-"Triggered" positional (skip event string)
  let playerNode: LudNode | undefined;
  for (let i = 1; i < positional.length; i++) {
    const p = positional[i]!;
    if (isString(p)) continue; // event string — skip
    playerNode = p;
    break;
  }
  if (!playerNode) {
    // (is Triggered "event") with no player — check mover
    return new IsTriggered1to1({ eval(ctx: Context): number { return ctx.state.mover; } });
  }
  // Could be a role ident (Mover, Next, P1, ...) or an int fn
  if (isIdent(playerNode)) {
    const name = playerNode.name.toLowerCase();
    if (name === "mover") return new IsTriggered1to1({ eval(ctx: Context): number { return ctx.state.mover; } });
    if (name === "next") return new IsTriggered1to1({ eval(ctx: Context): number { return (ctx.state.mover % ctx.game.numPlayers) + 1; } });
    if (name.startsWith("p") && !isNaN(parseInt(name.slice(1), 10))) {
      const pid = parseInt(name.slice(1), 10);
      return new IsTriggered1to1({ eval(_ctx: Context): number { return pid; } });
    }
  }
  const playerFn = compileInt1to1(playerNode);
  return new IsTriggered1to1(playerFn);
});
