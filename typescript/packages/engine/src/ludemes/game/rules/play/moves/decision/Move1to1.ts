/**
 * Move1to1.ts
 *
 * @java game/rules/play/moves/decision/Move.java
 *
 * The polymorphic decision-move dispatcher. In Java, Move.construct() is a
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
 *   public final class Move extends Decision
 *   public static Moves construct(...) { ... }  // many overloads
 *   public Moves eval(Context context) { ... }   // delegates to sub-ludeme
 *
 * @java game/rules/play/moves/decision/Move.java — eval(Context)
 */

import type { Context } from "../../../../../../context.js";
import { Move as LudiiMove } from "../../../../../../move.js";
import type { Move } from "../../../../../../move.js";
import { ActionBet } from "../../../../../../action/action-bet.js";
import type { SiteType } from "../../../../../../action/site-type.js";
import type {
  BooleanFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
} from "../../../../../base.js";
import type { RangeFunction1to1 } from "../../../../functions/range/Range1to1.js";
import type { From1to1 } from "../../../../util/moves/From1to1.js";
import type { Piece1to1 } from "../../../../util/moves/Piece1to1.js";
import type { Player1to1 } from "../../../../util/moves/Player1to1.js";
import type { To1to1 } from "../../../../util/moves/To1to1.js";
import type { Between1to1 } from "../../../../util/moves/Between1to1.js";
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import type { ThenLike } from "../Moves.js";
import type { DirectionArg } from "../nonDecision/effect/EffectCtorAdapters.js";
import { AddFaithful } from "../nonDecision/effect/AddFaithful.js";
import { Claim1to1 } from "../nonDecision/effect/Claim1to1.js";
import { FromToFaithful } from "../nonDecision/effect/FromToFaithful.js";
import { HopFaithful } from "../nonDecision/effect/HopFaithful.js";
import { LeapFaithful } from "../nonDecision/effect/LeapFaithful.js";
import { Pass1to1 } from "../nonDecision/effect/Pass1to1.js";
import { PlayCard } from "../nonDecision/effect/PlayCard.js";
import { PromoteFaithful } from "../nonDecision/effect/PromoteFaithful.js";
import { Propose } from "../nonDecision/effect/Propose.js";
import { RemoveFaithful } from "../nonDecision/effect/RemoveFaithful.js";
import { Select } from "../nonDecision/effect/Select.js";
import { ShootFaithful } from "../nonDecision/effect/ShootFaithful.js";
import { SlideFaithful } from "../nonDecision/effect/SlideFaithful.js";
import { StepFaithful } from "../nonDecision/effect/StepFaithful.js";
import type { Then } from "../nonDecision/effect/Then.js";
import { Vote } from "../nonDecision/effect/Vote.js";
import { SetNextPlayer } from "../nonDecision/effect/set/nextPlayer/SetNextPlayer.js";
import { SetRotation } from "../nonDecision/effect/set/direction/SetRotation.js";
import { SetTrumpSuit } from "../nonDecision/effect/set/suit/SetTrumpSuit.js";
import { SwapPlayers } from "../nonDecision/effect/state/swap/players/SwapPlayers.js";
import { SwapPieces } from "../nonDecision/effect/state/swap/sites/SwapPieces.js";
import { Decision1to1 } from "./Decision1to1.js";

/**
 * @java game/rules/play/moves/decision/Move.java
 *
 * Structural marker class for the polymorphic decision-move dispatcher.
 * The actual dispatch is performed by the inline compiler.
 *
 * This class is NOT registered — the inline compileMoves1to1Impl handles
 * all (move ...) patterns directly.
 */
export class Move1to1 extends Decision1to1 {
  /**
   * The compiled sub-move generator (the delegated effect ludeme).
   * @java Move.java — the resolved ludeme (Add, Step, Hop, Slide, etc.)
   */
  private readonly delegate: { eval(ctx: Context): Move[] };

  /**
   * @java game/rules/play/moves/decision/Move.java — constructor
   * @param delegate The compiled effect ludeme to delegate eval() to.
   */
  public constructor(delegate: { eval(ctx: Context): Move[] }) {
    super();
    this.delegate = delegate;
  }

  /**
   * @java Move.construct(MoveSwapType, SwapPlayersType, IntFunction, RoleType, IntFunction, RoleType, Then)
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
        throw new Error(`Move(): MoveSwapType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveSwapType, SwapSitesType, IntFunction, IntFunction, Then)
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
        throw new Error(`Move(): MoveSwapType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveRemoveType, SiteType, IntFunction, RegionFunction, IntFunction, WhenType, IntFunction, Then)
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
        throw new Error(`Move(): MoveRemoveType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveSetType, SetTrumpType, IntFunction, Difference, Then)
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
        throw new Error(`Move(): SetTrumpType '${setType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveSetType, SetNextPlayerType, Player, IntArrayFunction, Then)
   */
  public static constructSetNextPlayer(
    moveType: string,
    setType: string,
    who: Player1to1 | null,
    nextPlayers: IntArrayFunction | null,
    then: Then | null
  ): MovesFunction {
    void moveType;
    switch (setType) {
      case "NextPlayer":
        return new SetNextPlayer(who, nextPlayers, then);
      default:
        throw new Error(`Move(): SetNextPlayerType '${setType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveSetType, SetRotationType, To, IntFunction[], IntFunction, BooleanFunction, BooleanFunction, Then)
   */
  public static constructSetRotation(
    moveType: string,
    setType: string,
    to: To1to1 | null,
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
        return new SetRotation(
          to?.locFn() ?? { eval: (ctx) => ctx._evalTo },
          to?.siteType() as SiteType | null,
          directionFns,
          previous,
          next,
          then,
        );
      }
      default:
        throw new Error(`Move(): SetRotationType '${setType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveStepType, From, Direction, To, Boolean, Then)
   */
  public static constructStep(
    moveType: string,
    from: From1to1 | null,
    directions: DirectionArg,
    to: To1to1,
    stack: boolean | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Step":
        return new StepFaithful(from, directions, to, stack, then as unknown as ThenLike | null);
      default:
        throw new Error(`Move(): MoveStepType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveSlideType, From, String, Direction, Between, To, Boolean, Then)
   */
  public static constructSlide(
    moveType: string,
    from: From1to1 | null,
    track: string | null,
    directions: DirectionArg,
    between: Between1to1 | null,
    to: To1to1 | null,
    stack: boolean | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Slide":
        return new SlideFaithful(from, track, directions, between, to, stack, then);
      default:
        throw new Error(`Move(): MoveSlideType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveShootType, Piece, From, AbsoluteDirection, Between, To, Then)
   */
  public static constructShoot(
    moveType: string,
    what: Piece1to1,
    from: From1to1 | null,
    dirn: string | null,
    between: Between1to1 | null,
    to: To1to1 | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Shoot":
        return new ShootFaithful(what, from, dirn, between, to, then);
      default:
        throw new Error(`Move(): MoveShootType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveSelectType, From, To, RoleType, Then)
   */
  public static constructSelect(
    moveType: string,
    from: From1to1,
    to: To1to1 | null,
    mover: RoleTypeFull | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Select":
        return new Select(from, to, mover, then as unknown as ThenLike | null);
      default:
        throw new Error(`Move(): MoveSelectType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveMessageType, String, String[], Then)
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
        throw new Error(`Move(): MoveMessageType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MovePromoteType, SiteType, IntFunction, Piece, Player, RoleType, Then)
   */
  public static constructPromote(
    moveType: string,
    type: string | null,
    locationFn: IntFunction | null,
    what: Piece1to1,
    who: Player1to1 | null,
    role: string | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Promote":
        return new PromoteFaithful(type, locationFn, what, who, role, then);
      default:
        throw new Error(`Move(): MovePromoteType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveSimpleType, Then)
   */
  public static constructSimple(
    moveType: string,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Pass":
        void then;
        return new Pass1to1();
      case "PlayCard":
        return new PlayCard(then);
      default:
        throw new Error(`Move(): MoveSimpleType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveLeapType, From, StepType[][], BooleanFunction, BooleanFunction, To, Then)
   */
  public static constructLeap(
    moveType: string,
    from: From1to1 | null,
    walk: RegionFunction | unknown[][],
    forward: BooleanFunction | null,
    rotations: BooleanFunction | null,
    to: To1to1,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Leap":
        return new LeapFaithful(from, walk, forward, rotations, to, then);
      default:
        throw new Error(`Move(): MoveLeapType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveHopType, From, Direction, Between, To, Boolean, Then)
   */
  public static constructHop(
    moveType: string,
    from: From1to1 | null,
    directions: DirectionArg,
    between: Between1to1 | null,
    to: To1to1,
    stack: boolean | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Hop":
        return new HopFaithful(from, directions, between, to, stack, then as unknown as ThenLike | null);
      default:
        throw new Error(`Move(): MoveHopType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(From, To, IntFunction, BooleanFunction, Boolean, RoleType, Then)
   */
  public static constructFromTo(
    from: From1to1,
    to: To1to1,
    count: IntFunction | null,
    copy: BooleanFunction | null,
    stack: boolean | null,
    mover: string | null,
    then: Then | null
  ): MovesFunction {
    return new FromToFaithful(from, to, count, copy, stack, mover, then);
  }

  /**
   * @java Move.construct(MoveBetType, Player, RoleType, RangeFunction, Then)
   */
  public static constructBet(
    moveType: string,
    who: Player1to1 | null,
    role: string | null,
    range: RangeFunction1to1,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Bet":
        return new BetDecision1to1(who, role, range, then);
      default:
        throw new Error(`Move(): MoveBetType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java Move.construct(MoveSiteType, Piece, To, IntFunction, Boolean, Then)
   */
  public static constructSite(
    moveType: string,
    what: Piece1to1 | null,
    to: To1to1,
    count: IntFunction | null,
    stack: boolean | null,
    then: Then | null
  ): MovesFunction {
    switch (moveType) {
      case "Add":
        return new AddFaithful(what, to, count, stack, then);
      case "Claim":
        return new Claim1to1(what, to, then);
      default:
        throw new Error(`Move(): MoveSiteType '${moveType}' is not implemented.`);
    }
  }

  /**
   * @java game/rules/play/moves/decision/Move.java — eval(Context)
   *
   * Delegates to the resolved effect ludeme.
   */
  public override eval(ctx: Context): Move[] {
    return this.delegate.eval(ctx);
  }
}

class BetDecision1to1 implements MovesFunction {
  private readonly playerFn: IntFunction;
  private readonly range: RangeFunction1to1;
  private readonly thenMoves: MovesFunction | null;

  public constructor(
    who: Player1to1 | null,
    role: string | null,
    range: RangeFunction1to1,
    then: Then | null
  ) {
    const numNonNull = (who !== null ? 1 : 0) + (role !== null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("Move(): With MoveBetType exactly one who or role parameter must be non-null.");
    }

    this.playerFn = role !== null ? roleToIntFunction(role) : who!.index();
    this.range = range;
    this.thenMoves = then;
  }

  public eval(ctx: Context): Move[] {
    const player = this.playerFn.eval(ctx);
    const min = this.range.minFn.eval(ctx);
    const max = this.range.maxFn.eval(ctx);
    const mover = betMover(ctx, player);
    const thenList = this.thenMoves?.eval(ctx) ?? [];
    const moves: Move[] = [];

    for (let amount = min; amount <= max; amount++) {
      moves.push(new LudiiMove({
        id: `bet:${player}:${amount}`,
        label: `Bet P${player} ${amount}`,
        siteIndices: [],
        mover,
        placedOwner: mover,
        actions: [new ActionBet(player, amount)],
        then: thenList,
        fromSite: -1,
        toSite: -1,
      }));
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
