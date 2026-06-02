// @java Core/src/other/context/InformationContext.java InformationContext
/**
 * Faithful 1:1 transliteration of other.context.InformationContext.
 *
 * Returns the context as seen by a specific player in a hidden-information
 * game. The constructor masks all hidden fields in the copied state.
 *
 * Deferrals (depend on absent subsystems):
 *  - Full hidden-information masking (ContainerState.isHidden* / setSite /
 *    insertCell / insertVertex / insertEdge): the loop bodies reference
 *    detailed ContainerState methods not in the minimal IState interface.
 *    The constructor skeleton is present but the masking loops are deferred.
 *  - ActionUpdateDice detection in dice-state initialisation: deferred.
 *  - moves() override: correctly returns empty Moves when it is not the
 *    POV player's turn; otherwise delegates to originalContext.
 *
 * Java parity: other/context/InformationContext.java
 */

import { Context, type IMove, type IMoves } from "./Context.js";

/** Minimal BaseMoves (empty legal-move list) */
function makeEmptyMoves(): IMoves {
  return {
    moves() {
      return {
        size():             number  { return 0; },
        get(_i: number):    IMove   { throw new Error("empty moves list"); },
        removeSwap(_i: number): void { void _i; },
        isEmpty():          boolean { return true; },
        add(_m: IMove):     void    { void _m; },
      };
    }
  };
}

export class InformationContext extends Context {

  // @java final int playerPointOfView;
  private readonly _playerPointOfView: number;

  // @java final Context originalContext;
  private readonly _originalContext: Context;

  /**
   * @java public InformationContext(final Context context, final int player)
   */
  constructor(context: Context, player: number) {
    // The Java super(context) calls the Context copy-constructor.
    // We pass a dummy game/trial, then overwrite via _assignCopyFields.
    super(context.game(), context.trial(), context.rng(), context.parentContext());
    Context._assignCopyFields(this, context);

    this._playerPointOfView = player;
    this._originalContext   = Context.copyOf(context);

    // -----------------------------------------------------------------------
    // Dice state initialisation
    // (Java: scan legal moves for ActionUpdateDice to populate diceSiteStates)
    // DEFERRED: requires ActionUpdateDice type + ContainerState detail
    // -----------------------------------------------------------------------

    // -----------------------------------------------------------------------
    // Hidden-information masking
    // (Java: for each cell/vertex/edge hidden for `player`, clear it in state)
    // DEFERRED: requires ContainerState.isHidden*/setSite/insertCell etc.
    // -----------------------------------------------------------------------
  }

  // -------------------------------------------------------------------------

  /**
   * @java public Moves moves(final Context context)
   * Returns legal moves only when the original mover equals the POV player.
   */
  override moves(context: Context): IMoves {
    if (this._originalContext.state()?.mover() === this._playerPointOfView) {
      return this._originalContext.game().moves(this._originalContext);
    }
    return makeEmptyMoves();
  }

  /**
   * @java public int pointofView()
   */
  override pointofView(): number {
    return this._playerPointOfView;
  }
}
