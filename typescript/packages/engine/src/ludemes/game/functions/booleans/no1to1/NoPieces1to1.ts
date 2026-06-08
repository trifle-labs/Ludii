/**
 * NoPieces1to1.ts
 *
 * Registration bridge for the already-faithful NoPieces1to1 class.
 * @java Core/src/game/functions/booleans/no/pieces/NoPieces.java
 */

import { NoPieces1to1 } from "./NoPieces.js";
import type { BooleanFunction, RoleType } from "../../../../base.js";
import type { Context } from "../../../../../context.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { parseArgs1to1, compileRegion1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import type { Game1to1 } from "../../../../Game1to1.js";

registerBool1to1("no:pieces", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional, named } = parseArgs1to1((node as LudList).items);
  // positional[0] = "Pieces", positional[1] = optional role

  // (no Pieces in:<region>) — check if there are no pieces (countAt > 0) at any
  // site in the given region. Java NoPieces.eval with in: uses whereFn to filter
  // the owned-position list. For Shared/mancala pieces, this checks countAt > 0.
  // @java game/functions/booleans/no/pieces/NoPieces.java — whereFn / in: parameter
  const inNode = named.get("in");
  if (inNode) {
    try {
      const regionFn = compileRegion1to1(inNode);
      // Determine role for ownership check (if given)
      const roleNode2 = positional[1];
      const role2 = (roleNode2 && isIdent(roleNode2)) ? roleNode2.name.toLowerCase() : null;
      return {
        eval(ctx: Context): boolean {
          const sites = regionFn.eval(ctx);
          const state = ctx.state;
          const g = ctx.game as unknown as Game1to1;
          const boardSize = g.equipment?.board?.numSites ?? state.cells.length;
          for (const s of sites) {
            if (s < 0 || s >= boardSize) continue;
            // For Shared/mancala: check countAt > 0 (pieces present)
            if ((state.countAt[s] ?? 0) > 0) return false;
            // For player-owned games: also check cells ownership
            if (role2 && role2 !== "all") {
              let pid = state.mover;
              if (role2 === "next") pid = (state.mover % ctx.game.numPlayers) + 1;
              else if (role2.startsWith("p") && !isNaN(parseInt(role2.slice(1), 10))) {
                pid = parseInt(role2.slice(1), 10);
              }
              if ((state.cells[s] ?? 0) === pid) return false;
            }
          }
          return true;
        }
      };
    } catch { /* fall through to default */ }
  }

  // positional[0] = "Pieces", positional[1] = optional role
  const roleNode = positional[1];
  const role: RoleType = (roleNode && isIdent(roleNode)) ? (roleNode.name as RoleType) : "Mover";
  return new NoPieces1to1(undefined, role);
});
