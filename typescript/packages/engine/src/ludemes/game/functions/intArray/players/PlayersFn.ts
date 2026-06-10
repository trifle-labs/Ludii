// @java Core/src/game/functions/intArray/players/Players.java

/**
 * Static factory for the (players …) int-array variants.
 *
 * @java game/functions/intArray/players/Players.java
 * @author Eric.Piette
 */

import { PlayersTeam } from "./team/PlayersTeam.js";
import { PlayersMany } from "./many/PlayersMany.js";

function wrapBool(v: unknown): never {
  if (typeof v === "boolean") return { eval: () => v } as never;
  return (v ?? { eval: () => true }) as never;
}

export class Players {
  private constructor() { /* static-factory-only, like Java */ }

  /** @java Players.construct(PlayersTeamType, @Opt @Name BooleanFunction If) */
  public static constructTeam(playerType: string, If: unknown = null): PlayersTeam {
    return new PlayersTeam(playerType as never, wrapBool(If));
  }

  /** @java Players.construct(PlayersManyType, @Opt @Name IntFunction of, @Opt @Name BooleanFunction If) */
  public static constructMany(playerType: string, of: unknown = null, If: unknown = null): PlayersMany {
    return new PlayersMany(playerType as never, (of ?? null) as never, wrapBool(If));
  }
}
