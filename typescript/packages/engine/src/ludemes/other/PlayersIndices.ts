// @java Core/src/other/PlayersIndices.java
/**
 * Faithful 1:1 transliteration of other.PlayersIndices.
 *
 * Utility class to get the indices of players.
 *
 * Deferrals:
 *  - Context / Game / State: represented by minimal local interfaces that
 *    expose only the surface called in this class.
 *  - RoleType: represented by the RoleTypeFull union type from the existing
 *    TS translation of game/types/play/RoleType.ts.
 *  - TIntArrayList (Trove): replaced by a plain number[] array with an
 *    equivalent push() interface.
 *
 * Java parity: other/PlayersIndices.java
 *
 * @author Eric.Piette (Java), ported to TS
 */

import type { RoleTypeFull } from "../game/types/play/RoleType.js";

// ---------------------------------------------------------------------------
// Minimal opaque interfaces for types that live in other engine modules.
// ---------------------------------------------------------------------------

interface IState {
  mover(): number;
  next(): number;
  prev(): number;
  getTeam(pid: number): number;
  playerInTeam(pid: number, team: number): boolean;
}

interface IPlayers {
  size(): number;
}

interface IGame {
  players(): IPlayers;
  requiresTeams(): boolean;
}

interface IContext {
  game(): IGame;
  state(): IState;
  player(): number;
}

// ---------------------------------------------------------------------------

/**
 * Utility class to get the indices of players.
 *
 * @java other/PlayersIndices.java — class PlayersIndices
 */
export class PlayersIndices {
  // Private constructor — utility class, not instantiated.
  private constructor() {
    // Do not instantiate
  }

  // -------------------------------------------------------------------------

  /**
   * @param context The context.
   * @param role    The role of the player.
   *
   * @return The ids of the real players (between 1 and n) corresponding to the
   *         roleType.
   * @java other/PlayersIndices.java — getIdRealPlayers(Context, RoleType)
   */
  static getIdRealPlayers(context: IContext, role: RoleTypeFull): number[] {
    const idPlayers: number[] = [];

    switch (role) {
      case "All":
        for (let pid = 1; pid < context.game().players().size(); ++pid) {
          idPlayers.push(pid);
        }
        break;

      case "Enemy":
        if (context.game().requiresTeams()) {
          const teamMoverE = context.state().getTeam(context.state().mover());
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (
              pid !== context.state().mover() &&
              !context.state().playerInTeam(pid, teamMoverE)
            ) {
              idPlayers.push(pid);
            }
          }
        } else {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (pid !== context.state().mover()) {
              idPlayers.push(pid);
            }
          }
        }
        break;

      case "Ally":
        if (context.game().requiresTeams()) {
          const teamMoverAl = context.state().getTeam(context.state().mover());
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (
              pid !== context.state().mover() &&
              context.state().playerInTeam(pid, teamMoverAl)
            ) {
              idPlayers.push(pid);
            }
          }
        }
        break;

      case "Friend":
        if (context.game().requiresTeams()) {
          const teamMoverFr = context.state().getTeam(context.state().mover());
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, teamMoverFr)) {
              idPlayers.push(pid);
            }
          }
        } else {
          idPlayers.push(context.state().mover());
        }
        break;

      case "NonMover":
        for (let pid = 1; pid < context.game().players().size(); ++pid) {
          if (pid !== context.state().mover()) {
            idPlayers.push(pid);
          }
        }
        break;

      case "Mover":
        idPlayers.push(context.state().mover());
        break;

      case "Next":
        idPlayers.push(context.state().next());
        break;

      case "Prev":
        idPlayers.push(context.state().prev());
        break;

      case "P1":  idPlayers.push(1);  break;
      case "P2":  idPlayers.push(2);  break;
      case "P3":  idPlayers.push(3);  break;
      case "P4":  idPlayers.push(4);  break;
      case "P5":  idPlayers.push(5);  break;
      case "P6":  idPlayers.push(6);  break;
      case "P7":  idPlayers.push(7);  break;
      case "P8":  idPlayers.push(8);  break;
      case "P9":  idPlayers.push(9);  break;
      case "P10": idPlayers.push(0);  break; // Java source uses 0 for P10
      case "P11": idPlayers.push(11); break;
      case "P12": idPlayers.push(12); break;
      case "P13": idPlayers.push(13); break;
      case "P14": idPlayers.push(14); break;
      case "P15": idPlayers.push(15); break;
      case "P16": idPlayers.push(16); break;

      case "Player":
        idPlayers.push(context.player());
        break;

      case "Team1":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 1)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(1);
        }
        break;

      case "Team2":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 2)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(2);
        }
        break;

      case "Team3":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 3)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(3);
        }
        break;

      case "Team4":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 4)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(4);
        }
        break;

      case "Team5":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 5)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(5);
        }
        break;

      case "Team6":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 6)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(6);
        }
        break;

      case "Team7":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 7)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(7);
        }
        break;

      case "Team8":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 8)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(8);
        }
        break;

      case "Team9":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 9)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(9);
        }
        break;

      case "Team10":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 10)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(10);
        }
        break;

      case "Team11":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 11)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(11);
        }
        break;

      case "Team12":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 12)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(12);
        }
        break;

      case "Team13":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 13)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(13);
        }
        break;

      case "Team14":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 14)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(14);
        }
        break;

      case "Team15":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 15)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(15);
        }
        break;

      case "Team16":
        if (context.game().requiresTeams()) {
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, 16)) idPlayers.push(pid);
          }
        } else {
          idPlayers.push(16);
        }
        break;

      case "TeamMover":
        if (context.game().requiresTeams()) {
          const teamMoverTM = context.state().getTeam(context.state().mover());
          for (let pid = 1; pid < context.game().players().size(); ++pid) {
            if (context.state().playerInTeam(pid, teamMoverTM)) {
              idPlayers.push(pid);
            }
          }
        } else {
          idPlayers.push(context.state().mover());
        }
        break;

      default:
        break;
    }

    return idPlayers;
  }

  // -------------------------------------------------------------------------

  /**
   * @param context        The context.
   * @param occupiedByRole The role of the player.
   * @param occupiedbyId   The specific player in entry.
   *
   * @return The ids of the players corresponding to the roleTypes.
   * @java other/PlayersIndices.java — getIdPlayers(Context, RoleType, int)
   */
  static getIdPlayers(
    context: IContext,
    occupiedByRole: RoleTypeFull | null,
    occupiedbyId: number,
  ): number[] {
    const idPlayers: number[] = [];

    if (occupiedByRole !== null) {
      switch (occupiedByRole) {
        case "All":
          for (let pid = 0; pid <= context.game().players().size(); ++pid) {
            idPlayers.push(pid);
          }
          break;

        case "Enemy":
          if (context.game().requiresTeams()) {
            const teamMoverE = context.state().getTeam(context.state().mover());
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (
                pid !== context.state().mover() &&
                !context.state().playerInTeam(pid, teamMoverE)
              ) {
                idPlayers.push(pid);
              }
            }
          } else {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (pid !== context.state().mover()) {
                idPlayers.push(pid);
              }
            }
          }
          break;

        case "Ally":
          if (context.game().requiresTeams()) {
            const teamMoverAl = context.state().getTeam(context.state().mover());
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (
                pid !== context.state().mover() &&
                context.state().playerInTeam(pid, teamMoverAl)
              ) {
                idPlayers.push(pid);
              }
            }
          }
          break;

        case "Friend":
          if (context.game().requiresTeams()) {
            const teamMoverFr = context.state().getTeam(context.state().mover());
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, teamMoverFr)) {
                idPlayers.push(pid);
              }
            }
          } else {
            idPlayers.push(context.state().mover());
          }
          break;

        case "Mover":
          idPlayers.push(context.state().mover());
          break;

        case "Next":
          idPlayers.push(context.state().next());
          break;

        case "Prev":
          idPlayers.push(context.state().prev());
          break;

        case "NonMover":
          for (let pid = 0; pid < context.game().players().size(); ++pid) {
            if (pid !== context.state().mover()) {
              idPlayers.push(pid);
            }
          }
          break;

        case "Team1":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 1)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(1);
          }
          break;

        case "Team2":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 2)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(2);
          }
          break;

        case "Team3":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 3)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(3);
          }
          break;

        case "Team4":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 4)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(4);
          }
          break;

        case "Team5":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 5)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(5);
          }
          break;

        case "Team6":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 6)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(6);
          }
          break;

        case "Team7":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 7)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(7);
          }
          break;

        case "Team8":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 8)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(8);
          }
          break;

        case "Team9":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 9)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(9);
          }
          break;

        case "Team10":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 10)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(10);
          }
          break;

        case "Team11":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 11)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(11);
          }
          break;

        case "Team12":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 12)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(12);
          }
          break;

        case "Team13":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 13)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(13);
          }
          break;

        case "Team14":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 14)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(14);
          }
          break;

        case "Team15":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 15)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(15);
          }
          break;

        case "Team16":
          if (context.game().requiresTeams()) {
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, 16)) idPlayers.push(pid);
            }
          } else {
            idPlayers.push(16);
          }
          break;

        case "TeamMover":
          if (context.game().requiresTeams()) {
            const teamMoverTM = context.state().getTeam(context.state().mover());
            for (let pid = 1; pid < context.game().players().size(); ++pid) {
              if (context.state().playerInTeam(pid, teamMoverTM)) {
                idPlayers.push(pid);
              }
            }
          } else {
            idPlayers.push(context.state().mover());
          }
          break;

        default:
          idPlayers.push(occupiedbyId);
          break;
      }
    } else {
      idPlayers.push(occupiedbyId);
    }

    return idPlayers;
  }
}
