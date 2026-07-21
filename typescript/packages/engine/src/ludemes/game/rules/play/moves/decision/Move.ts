/**
 * Move.ts
 *
 * @java game/rules/play/moves/decision/Move.java
 *
 * The polymorphic decision-move dispatcher. In Java, LudiiMove.construct() is a
 * static factory with many overloads that delegates to the appropriate effect
 * ludeme (Add, Hop, Step, Slide, FromTo, Remove, Select, etc.) based on the
 * move type marker (MoveStepType, MoveHopType, MoveSiteType, etc.).
 *
 * In the 1:1 path, the dispatch is handled entirely by the inline
 * compileMoves1to1Impl switch in compiler1to1.ts (the "(move ...)") branches.
 * This class file is a structural coverage port only — it represents the
 * Java class hierarchy without re-implementing the full dispatch or registering
 * any keys (which would clobber the working inline logic).
 *
 * Java:
 *   public final class LudiiMove extends Decision
 *   public static Moves construct(...) { ... }  // many overloads
 *   public Moves eval(Context context) { ... }   // delegates to sub-ludeme
 *
 * @java game/rules/play/moves/decision/Move.java — eval(Context)
 */

import type { Context } from "../../../../../../context.js";
import { Move as LudiiMove } from "../../../../../../move.js";
import { ActionBet } from "../../../../../../action/action-bet.js";
import type { SiteType } from "../../../../../../action/site-type.js";
import type {
  BooleanFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
} from "../../../../../base.js";
import type { RangeFunction } from "../../../../functions/range/RangeFunction.js";
import type { From } from "../../../../util/moves/From.js";
import type { Piece } from "../../../../util/moves/Piece.js";
import type { Player } from "../../../../util/moves/Player.js";
import type { To } from "../../../../util/moves/To.js";
import type { Between } from "../../../../util/moves/Between.js";
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import type { ThenLike } from "../Moves.js";
import type { DirectionArg } from "../nonDecision/effect/EffectCtorAdapters.js";
import { AddFaithful } from "../nonDecision/effect/AddFaithful.js";
import { Claim } from "../nonDecision/effect/Claim.js";
import { FromToFaithful } from "../nonDecision/effect/FromToFaithful.js";
import { HopFaithful } from "../nonDecision/effect/HopFaithful.js";
import { LeapFaithful } from "../nonDecision/effect/LeapFaithful.js";
import { Pass } from "../nonDecision/effect/Pass.js";
import { PlayCard } from "../nonDecision/effect/PlayCard.js";
import { PromoteFaithful } from "../nonDecision/effect/PromoteFaithful.js";
import { Propose } from "../nonDecision/effect/Propose.js";
import { RemoveFaithful } from "../nonDecision/effect/RemoveFaithful.js";
import { Select } from "../nonDecision/effect/Select.js";
import { ShootFaithful } from "../nonDecision/effect/ShootFaithful.js";
import { SlideFaithful } from "../nonDecision/effect/SlideFaithful.js";
import { StepFaithful } from "../nonDecision/effect/StepFaithful.js";
import type { Then } from "../nonDecision/effect/Then.js";
import { applyPostStateThen } from "../nonDecision/effect/Then.js";
import { Vote } from "../nonDecision/effect/Vote.js";
import { SetNextPlayer } from "../nonDecision/effect/set/nextPlayer/SetNextPlayer.js";
import { SetRotation } from "../nonDecision/effect/set/direction/SetRotation.js";
import { SetTrumpSuit } from "../nonDecision/effect/set/suit/SetTrumpSuit.js";
import { SwapPlayers } from "../nonDecision/effect/state/swap/players/SwapPlayers.js";
import { SwapPieces } from "../nonDecision/effect/state/swap/sites/SwapPieces.js";
import { Decision } from "./Decision.js";

/**
 * @java game/rules/play/moves/decision/Move.java
 *
 * Structural marker class for the polymorphic decision-move dispatcher.
 * The actual dispatch is performed by the inline compiler.
 *
 * This class is NOT registered — the inline compileMoves1to1Impl handles
 * all (move ...) patterns directly.
 */
export class Move extends Decision {
  /**
   * The compiled sub-move generator (the delegated effect ludeme).
   * @java Move.java — the resolved ludeme (Add, Step, Hop, Slide, etc.)
   */
  private readonly delegate: { eval(ctx: Context): LudiiMove[] };

  /**
   * @java game/rules/play/moves/decision/Move.java — constructor
   * @param delegate The compiled effect ludeme to delegate eval() to.
   */
  public constructor(delegate: { eval(ctx: Context): LudiiMove[] }) {
    super();
    this.delegate = delegate;
  }

  /**
   * @java LudiiMove.construct(MoveSwapType, SwapPlayersType, IntFunction, RoleType, IntFunction, RoleType, Then)
   */
  public static constructSwapPlayers(
    moveType: string,
    swapType: string,
    player1: IntFunction | null,
    role1: string | null,
    player2: IntFunction | null,
    role2: string | null,
    then: Then | null
  ): MovesFunction {
    void swapType;
    switch (moveType) {
      case "Swap":
        return new SwapPlayers(player1, role1, player2, role2, then);
      default:
        throw new Error(`LudiiMove(): MoveSwapType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveSwapType, SwapSitesType, IntFunction, IntFunction, Then)
   */
  public static constructSwapPieces(
    moveType: string,
    swapType: string,
    locA: IntFunction | null,
    locB: IntFunction | null,
    then: Then | null
  ): MovesFunction {
    void swapType;
    switch (moveType) {
      case "Swap":
        return new SwapPieces(locA ?? { eval: (ctx) => ctx._evalFrom }, locB ?? { eval: (ctx) => ctx._evalTo }, then);
      default:
        throw new Error(`LudiiMove(): MoveSwapType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveRemoveType, SiteType, IntFunction, RegionFunction, IntFunction, WhenType, IntFunction, Then)
   */
  public static constructRemove(
    moveType: string,
    type: string | null,
    locationFunction: IntFunction | null,
    regionFunction: RegionFunction | null,
    level: IntFunction | null,
    at: string | null,
    count: IntFunction | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Remove":
        return new RemoveFaithful(type, locationFunction, regionFunction, level, at, count, then);
      default:
        throw new Error(`LudiiMove(): MoveRemoveType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveSetType, SetTrumpType, IntFunction, Difference, Then)
   */
  public static constructSetTrump(
    moveType: string,
    setType: string,
    suit: IntFunction | null,
    suits: IntArrayFunction | null,
    then: Then | null
  ): MovesFunction {
    void moveType;
    switch (setType) {
      case "TrumpSuit":
        return new SetTrumpSuit(suit, suits, then);
      default:
        throw new Error(`LudiiMove(): SetTrumpType '${setType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveSetType, SetNextPlayerType, Player, IntArrayFunction, Then)
   */
  public static constructSetNextPlayer(
    moveType: string,
    setType: string,
    who: Player | null,
    nextPlayers: IntArrayFunction | null,
    then: Then | null
  ): MovesFunction {
    void moveType;
    switch (setType) {
      case "NextPlayer":
        return new SetNextPlayer(who, nextPlayers, then);
      default:
        throw new Error(`LudiiMove(): SetNextPlayerType '${setType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveSetType, SetRotationType, To, IntFunction[], IntFunction, BooleanFunction, BooleanFunction, Then)
   */
  public static constructSetRotation(
    moveType: string,
    setType: string,
    to: To | null,
    directions: IntFunction[] | null,
    direction: IntFunction | null,
    previous: BooleanFunction | null,
    next: BooleanFunction | null,
    then: Then | null
  ): MovesFunction {
    void moveType;
    switch (setType) {
      case "Rotation": {
        const directionFns = directions ?? (direction != null ? [direction] : null);
        // @java SetRotation.java:86 — siteFn = (to == null) ? new From(null) :
        // …: the bare (move Set Rotation) rotates the piece at the FROM
        // iterator (forEach Piece binds it), not LastTo. Reading _evalTo left
        // the site OFF during move generation, so Ploy's per-piece
        // "…OrChangeDirection" arms produced NO rotation moves and the trial
        // mismatched on the recorded SetRotation at ply 0.
        return new SetRotation(
          to?.locFn() ?? { eval: (ctx) => ctx._evalFrom ?? -1 },
          to?.siteType() as SiteType | null,
          directionFns,
          previous,
          next,
          then,
        );
      }
      default:
        throw new Error(`LudiiMove(): SetRotationType '${setType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveStepType, From, Direction, To, Boolean, Then)
   */
  public static constructStep(
    moveType: string,
    from: From | null,
    directions: DirectionArg,
    to: To,
    stack: boolean | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Step":
        return new StepFaithful(from, directions, to, stack, then as unknown as ThenLike | null);
      default:
        throw new Error(`LudiiMove(): MoveStepType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveSlideType, From, String, Direction, Between, To, Boolean, Then)
   */
  public static constructSlide(
    moveType: string,
    from: From | null,
    track: string | null,
    directions: DirectionArg,
    between: Between | null,
    to: To | null,
    stack: boolean | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Slide":
        return new SlideFaithful(from, track, directions, between, to, stack, then);
      default:
        throw new Error(`LudiiMove(): MoveSlideType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveShootType, Piece, From, AbsoluteDirection, Between, To, Then)
   */
  public static constructShoot(
    moveType: string,
    what: Piece,
    from: From | null,
    dirn: string | null,
    between: Between | null,
    to: To | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Shoot":
        return new ShootFaithful(what, from, dirn, between, to, then);
      default:
        throw new Error(`LudiiMove(): MoveShootType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveSelectType, From, To, RoleType, Then)
   */
  public static constructSelect(
    moveType: string,
    from: From,
    to: To | null,
    mover: RoleTypeFull | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Select":
        return new Select(from, to, mover, then as unknown as ThenLike | null);
      default:
        throw new Error(`LudiiMove(): MoveSelectType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveMessageType, String, String[], Then)
   */
  public static constructMessage(
    moveType: string,
    message: string | null,
    messages: string[] | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Propose":
        return new Propose(message, messages, then);
      case "Vote":
        return new Vote(message, messages, then);
      default:
        throw new Error(`LudiiMove(): MoveMessageType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MovePromoteType, SiteType, IntFunction, Piece, Player, RoleType, Then)
   */
  public static constructPromote(
    moveType: string,
    type: string | null,
    locationFn: IntFunction | null,
    what: Piece,
    who: Player | null,
    role: string | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Promote":
        return new PromoteFaithful(type, locationFn, what, who, role, then);
      default:
        throw new Error(`LudiiMove(): MovePromoteType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveSimpleType, Then)
   */
  public static constructSimple(
    moveType: string,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Pass":
        // @java new Pass(then) — the consequence rides the pass (Ashtapada's
        // re-throw on pips=3 fires even when the player cannot move).
        return new Pass(then);
      case "PlayCard":
        return new PlayCard(then);
      default:
        throw new Error(`LudiiMove(): MoveSimpleType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveLeapType, From, StepType[][], BooleanFunction, BooleanFunction, To, Then)
   */
  public static constructLeap(
    moveType: string,
    from: From | null,
    walk: RegionFunction | unknown[][],
    forward: BooleanFunction | null,
    rotations: BooleanFunction | null,
    to: To,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Leap":
        return new LeapFaithful(from, walk, forward, rotations, to, then);
      default:
        throw new Error(`LudiiMove(): MoveLeapType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveHopType, From, Direction, Between, To, Boolean, Then)
   */
  public static constructHop(
    moveType: string,
    from: From | null,
    directions: DirectionArg,
    between: Between | null,
    to: To,
    stack: boolean | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Hop":
        return new HopFaithful(from, directions, between, to, stack, then as unknown as ThenLike | null);
      default:
        throw new Error(`LudiiMove(): MoveHopType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(From, To, IntFunction, BooleanFunction, Boolean, RoleType, Then)
   */
  public static constructFromTo(
    from: From,
    to: To,
    count: IntFunction | null,
    copy: BooleanFunction | null,
    stack: boolean | null,
    mover: string | null,
    then: Then | null
  ): MovesFunction {
    return new FromToFaithful(from, to, count, copy, stack, mover, then);
  }

  /**
   * @java LudiiMove.construct(MoveBetType, Player, RoleType, RangeFunction, Then)
   */
  public static constructBet(
    moveType: string,
    who: Player | null,
    role: string | null,
    range: RangeFunction,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Bet":
        return new BetDecision(who, role, range, then);
      default:
        throw new Error(`LudiiMove(): MoveBetType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java LudiiMove.construct(MoveSiteType, Piece, To, IntFunction, Boolean, Then)
   */
  public static constructSite(
    moveType: string,
    what: Piece | null,
    to: To,
    count: IntFunction | null,
    stack: boolean | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Add":
        return new AddFaithful(what, to, count, stack, then);
      case "Claim":
        return new Claim(what, to, then);
      default:
        throw new Error(`LudiiMove(): MoveSiteType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java game/rules/play/moves/decision/Move.java — eval(Context)
   *
   * Delegates to the resolved effect ludeme.
   */
  public override eval(ctx: Context): LudiiMove[] {
    return this.delegate.eval(ctx);
  }
}

class BetDecision implements MovesFunction {
  private readonly playerFn: IntFunction;
  private readonly range: RangeFunction;
  private readonly thenMoves: MovesFunction | null;

  public constructor(
    who: Player | null,
    role: string | null,
    range: RangeFunction,
    then: Then | null
  ) {
    const numNonNull = (who !== null ? 1 : 0) + (role !== null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("LudiiMove(): With MoveBetType exactly one who or role parameter must be non-null.");
    }

    this.playerFn = role !== null ? roleToIntFunction(role) : who!.index();
    this.range = range;
    this.thenMoves = then;
  }

  public eval(ctx: Context): LudiiMove[] {
    const player = this.playerFn.eval(ctx);
    const min = this.range.minFn.eval(ctx);
    const max = this.range.maxFn.eval(ctx);
    const mover = betMover(ctx, player);
    const moves: LudiiMove[] = [];

    for (let amount = min; amount <= max; amount++) {
      let move = new LudiiMove({
        id: `bet:${player}:${amount}`,
        label: `Bet P${player} ${amount}`,
        siteIndices: [],
        mover,
        placedOwner: mover,
        actions: [new ActionBet(player, amount)],
        fromSite: -1,
        toSite: -1,
      });
      // @java Bet.java:101-103 — `moves.get(j).then().add(then().moves())`:
      // the consequence is attached for APPLY-TIME evaluation. The old code
      // pre-evaluated the then at generation time, so Morra's `(set Pot
      // (+ (pot) (amount P1)))` read the PRE-bet amount/pot and baked stale
      // SetPot actions into every candidate move.
      move = applyPostStateThen(this.thenMoves, ctx, move);
      moves.push(move);
    }

    return moves;
  }
}

function roleToIntFunction(role: string): IntFunction {
  return {
    eval: (ctx: Context): number => {
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") return (ctx.state.mover % ctx.numPlayers()) + 1;
      const playerMatch = /^P(\d+)$/.exec(role);
      if (playerMatch) return Number(playerMatch[1]);
      return ctx.state.mover;
    },
  };
}

function betMover(ctx: Context, player: number): number {
  const modeName = (ctx.game as unknown as { mode?: () => { mode?: () => string; name?: string } }).mode?.();
  if (modeName?.mode?.() === "Simultaneous" || modeName?.name === "Simultaneous") return player;
  return ctx.state.mover;
}
