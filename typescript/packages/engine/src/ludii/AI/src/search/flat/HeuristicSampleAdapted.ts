// @java AI/src/search/flat/HeuristicSampleAdapted.java

/**
 * Include the visualisation of weightings and wait out the thinking time.
 *
 * @java search/flat/HeuristicSampleAdapted.java
 * @author Markus
 */

import {
  HeuristicSampling,
} from "./HeuristicSampling.js";
import type {
  Context,
  FastArrayList,
  Game,
  Heuristics,
  HeuristicTerm,
  Move,
  MoveScore,
} from "./HeuristicSampling.js";
import type {
  HeuristicProportionViewInterface,
} from "./HeuristicSampleAdaptedUtils/HeuristicProportionViewInterface.js";

//-------------------------------------------------------------------------
// Escape-hatch interfaces

/** @java main.collections.FVector */
export interface FVector {
  dim(): number;
  get(i: number): number;
  set(i: number, v: number): void;
}

/** @java other.AI.AIVisualisationData */
export interface AIVisualisationData {
  aiDistribution: FVector;
  valueEstimates: FVector;
  moves: FastArrayList<Move>;
}

// Internal MoveScore helper
function makeMoveScore(move: Move, score: number): MoveScore {
  return {
    move: (): Move => move,
    score: (): number => score,
  };
}

// Simple FVector implementation for internal use
class SimpleFVector implements FVector {
  private data: number[];
  constructor(size: number) {
    this.data = new Array(size).fill(0);
  }
  public dim(): number { return this.data.length; }
  public get(i: number): number { return this.data[i] ?? 0; }
  public set(i: number, v: number): void { this.data[i] = v; }
}

//-------------------------------------------------------------------------

/**
 * MoveHeuristicEvaluation — nested class of HeuristicSampleAdapted.
 *
 * @java search.flat.HeuristicSampleAdapted.MoveHeuristicEvaluation
 */
export class MoveHeuristicEvaluation {

  //-------------------------------------------------------------------------

  /** @java MoveHeuristicEvaluation.floatNames */
  public static readonly floatNames: string[] = [
    "finalWeighted", "finalWeightless", "score1Weighted",
    "score1Weightless", "scoreOpponentWeighted", "scoreOpponentWeightLess"
  ];

  private readonly moves: FastArrayList<Move>;
  private readonly context: Context;
  private readonly heuristicFunction: Heuristics;
  private readonly mover: number;
  private readonly opponents: number[];
  private readonly game: Game;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java MoveHeuristicEvaluation(Game, FastArrayList, Context, Heuristics, int, int[])
   */
  public constructor(
    game: Game,
    moves: FastArrayList<Move>,
    context: Context,
    heuristicFunction: Heuristics,
    mover: number,
    opponents: number[]
  ) {
    this.moves = MoveHeuristicEvaluation.addNullMoveAndSort(moves);
    this.context = context;
    this.heuristicFunction = heuristicFunction;
    this.mover = mover;
    this.opponents = opponents;
    this.game = game;
  }

  //-------------------------------------------------------------------------

  /**
   * @java MoveHeuristicEvaluation.addNullMoveAndSort(FastArrayList)
   */
  private static addNullMoveAndSort(moves: FastArrayList<Move>): FastArrayList<Move> {
    const arr: Move[] = [];

    // Collect existing moves
    for (let i = 0; i < moves.size(); ++i)
      arr.push(moves.get(i));

    // Add a null/empty move at index 0
    const nullMove: Move = { toString: (): string => "" } as Move;
    arr.unshift(nullMove);

    // Sort by toString
    arr.sort((a, b) => {
      const sa = a.toString();
      const sb = b.toString();
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    });

    return {
      size: (): number => arr.length,
      get: (i: number): Move => arr[i] as Move,
      add: (item: Move): void => { arr.push(item); },
      removeSwap: (_i: number): void => { /* not needed */ },
      [Symbol.iterator]: (): Iterator<Move> => arr[Symbol.iterator](),
      toArray: (): Move[] => arr.slice(),
    };
  }

  //-------------------------------------------------------------------------

  /** @java MoveHeuristicEvaluation.getHeuristicFunction() */
  public getHeuristicFunction(): Heuristics {
    return this.heuristicFunction;
  }

  //-------------------------------------------------------------------------

  /** @java MoveHeuristicEvaluation.getHashMap() */
  public getHashMap(): Map<Move, Map<HeuristicTerm, number[]>> {
    const finalMap: Map<Move, Map<HeuristicTerm, number[]>> = new Map();

    for (let i = 0; i < this.moves.size(); ++i) {
      const move = this.moves.get(i);
      const termsToValueMap = this.calculateMove(move);
      finalMap.set(move, termsToValueMap);
    }

    return finalMap;
  }

  //-------------------------------------------------------------------------

  /** @java MoveHeuristicEvaluation.calculateMove(Move) */
  private calculateMove(move: Move): Map<HeuristicTerm, number[]> {
    // TempContext clone via escape hatch
    const contextCopy = (
      this.context as unknown as { _cloneAsTemp(): Context }
    )._cloneAsTemp?.() ?? this.context;

    this.game.apply(contextCopy as unknown, move);
    return this.getHeuristicTermsToValueMap(contextCopy);
  }

  //-------------------------------------------------------------------------

  /** @java MoveHeuristicEvaluation.getHeuristicTermsToValueMap(Context) */
  private getHeuristicTermsToValueMap(contextCopy: Context): Map<HeuristicTerm, number[]> {
    const termsToValueMap: Map<HeuristicTerm, number[]> = new Map();
    const threshold = HeuristicSampling.ABS_HEURISTIC_WEIGHT_THRESHOLD;
    const paranoidScore = 10000.0;

    for (const ht of this.heuristicFunction.heuristicTerms()) {
      const score1 = ht.computeValue(contextCopy, this.mover, threshold);
      let score2 = 0;
      for (const opp of this.opponents) {
        if (contextCopy.active(opp))
          score2 -= ht.computeValue(contextCopy, opp, threshold);
        else if (contextCopy.winners().contains(opp))
          score2 -= paranoidScore;
      }
      const scoreCombined = score1 + score2;
      const scores: number[] = [
        ht.weight() * scoreCombined,
        score1 + score2,
        ht.weight() * score1,
        score1,
        ht.weight() * score2,
        score2,
      ];
      termsToValueMap.set(ht, scores);
    }
    return termsToValueMap;
  }

  //-------------------------------------------------------------------------

  /** @java MoveHeuristicEvaluation.getMover() */
  public getMover(): number {
    return this.mover;
  }

  /** @java MoveHeuristicEvaluation.getMove(int) */
  public getMove(selectedIndex: number): Move {
    return this.moves.get(selectedIndex);
  }

  /** @java MoveHeuristicEvaluation.recalcMove(int) — no-op in Java, kept as stub */
  public recalcMove(_selectedRow: number): void {
    // no-op
  }

  /** @java MoveHeuristicEvaluation.getJTable(String) — JTable not available in TS */
  public getJTableByName(_valueType: string): null {
    // JTable not available in TypeScript
    return null;
  }

  /** @java MoveHeuristicEvaluation.getJTable(int) — JTable not available in TS */
  public getJTable(_valueType: number): null {
    // JTable not available in TypeScript
    return null;
  }

  //-------------------------------------------------------------------------
}

//-------------------------------------------------------------------------

/**
 * HeuristicSampleAdapted — extends HeuristicSampling with visualisation and
 * user-driven move selection.
 *
 * @java search.flat.HeuristicSampleAdapted
 */
export class HeuristicSampleAdapted extends HeuristicSampling {

  //-------------------------------------------------------------------------

  /** @java HeuristicSampleAdapted.moves (suppressed via @SuppressWarnings("unused")) */
  private _moves: FastArrayList<Move> | null = null;

  /** @java HeuristicSampleAdapted.moveScores */
  private moveScores: FastArrayList<MoveScore> | null = null;

  /** @java HeuristicSampleAdapted.waitForUserAction */
  private waitForUserAction: boolean = false;

  /** @java HeuristicSampleAdapted.autoSelect */
  private autoSelect: boolean = false;

  /** @java HeuristicSampleAdapted.heuristicChanged */
  private heuristicChanged: boolean = false;

  /** @java HeuristicSampleAdapted.randomizingTerm */
  private randomizingTerm: boolean = false;

  /** @java HeuristicSampleAdapted.latestMoveHeuristicEvaluation */
  private latestMoveHeuristicEvaluation: MoveHeuristicEvaluation | null = null;

  /** @java HeuristicSampleAdapted.heuristicProportionView */
  private heuristicProportionView: HeuristicProportionViewInterface | null = null;

  /** @java HeuristicSampleAdapted.userSelectedMove */
  private userSelectedMove: Move | null = null;

  /** @java AI.wantsInterrupt */
  protected wantsInterrupt: boolean = false;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java HeuristicSampleAdapted(Heuristics)
   * @java HeuristicSampleAdapted()
   * @java HeuristicSampleAdapted(Heuristics, int)
   * @java HeuristicSampleAdapted(int)
   */
  public constructor(heuristicOrFraction?: Heuristics | number, fraction?: number) {
    if (heuristicOrFraction === undefined) {
      super();
    } else if (typeof heuristicOrFraction === "number") {
      super(heuristicOrFraction);
    } else if (fraction === undefined) {
      super(heuristicOrFraction);
      super.setHeuristics(heuristicOrFraction);
    } else {
      super(heuristicOrFraction as Heuristics, fraction as number);
      super.setHeuristics(heuristicOrFraction as Heuristics);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java HeuristicSampleAdapted.setHeuristics(Heuristics)
   */
  public override setHeuristics(heuristics: Heuristics): void {
    super.setHeuristics(heuristics);
    this.heuristicChanged = true;
  }

  /**
   * Called when playout sampling is turned off or on.
   * @java HeuristicSampleAdapted.recalculateHeuristics()
   */
  public recalculateHeuristics(): void {
    this.heuristicChanged = true;
  }

  /** @java HeuristicSampleAdapted.setAutoSelect(boolean) */
  public setAutoSelect(autoSelect: boolean): void {
    this.autoSelect = autoSelect;
  }

  /** @java HeuristicSampleAdapted.getLatestMoveHeuristicEvaluation() */
  public getLatestMoveHeuristicEvaluation(): MoveHeuristicEvaluation | null {
    return this.latestMoveHeuristicEvaluation;
  }

  /** @java HeuristicSampleAdapted.getMoveHeuristicEvaluation() */
  public getMoveHeuristicEvaluation(): MoveHeuristicEvaluation | null {
    return this.latestMoveHeuristicEvaluation;
  }

  //-------------------------------------------------------------------------

  /**
   * @java HeuristicSampleAdapted.selectAction(Game, Context, double, int, int)
   */
  public override selectAction(
    game: Game,
    context: Context,
    maxSeconds: number,
    _maxIterations: number,
    _maxDepth: number
  ): Move | null {
    const startTime = Date.now();
    this.waitForUserAction = true;
    this.userSelectedMove = null;
    let move: Move | null = null;
    let repeatCondition: boolean;

    do {
      this.heuristicChanged = false;
      const moveScore = this.evaluateMoves(game, context, 1);

      move = moveScore.move();
      if (move === null)
        console.log("** No best move.");

      let waitingCondition: boolean;
      do {
        if (this.wantsInterrupt)
          return null;

        if (!(this.autoSelect && !this.heuristicChanged)) {
          // Thread.sleep(16) equivalent — non-blocking spin in JS; just break out
          // In a real async environment this would be awaited
        }

        const remainingTime =
          maxSeconds * 1000 - (Date.now() - startTime);
        waitingCondition =
          (!this.heuristicChanged && !this.autoSelect && this.waitForUserAction) ||
          (this.autoSelect && remainingTime > 0 && !this.heuristicChanged);

        // In TypeScript there's no Thread.sleep — break immediately to avoid infinite loop
        break;
      } while (waitingCondition);

      const remainingTime2 = maxSeconds * 1000 - (Date.now() - startTime);
      repeatCondition =
        (this.autoSelect && this.heuristicChanged && remainingTime2 > 0) ||
        (!this.autoSelect && this.heuristicChanged && this.waitForUserAction);
    } while (repeatCondition);

    if (this.userSelectedMove !== null) return this.userSelectedMove;
    return move;
  }

  //-------------------------------------------------------------------------

  /**
   * @java HeuristicSampleAdapted.aiVisualisationData()
   */
  public aiVisualisationData(): AIVisualisationData | null {
    if (this.moveScores === null) return null;

    const n = this.moveScores.size();
    const aiDistribution = new SimpleFVector(n);
    const valueEstimates = new SimpleFVector(n);
    const movesList: Move[] = [];

    let minNegative = 0;
    let maxNegative = Number.MIN_SAFE_INTEGER;
    let minPositive = Number.MAX_SAFE_INTEGER;
    let maxPositive = 0;
    let noPositive = true;
    let noNegative = true;

    for (let j = 0; j < n; ++j) {
      const ms = this.moveScores.get(j);
      aiDistribution.set(j, 1.0);
      valueEstimates.set(j, ms.score());
      movesList.push(ms.move());

      const score = ms.score();
      if (score >= 0) {
        noPositive = false;
        if (score < minPositive) minPositive = score;
        if (score > maxPositive) maxPositive = score;
      }
      if (score < 0) {
        noNegative = false;
        if (score < minNegative) minNegative = score;
        if (score > maxNegative) maxNegative = score;
      }
    }

    let deltaNegative = maxNegative - minNegative;
    let deltaPositive = maxPositive - minPositive;

    if (noPositive) {
      minPositive = 0; maxPositive = 0; deltaPositive = 0;
    }
    if (noNegative) {
      minNegative = 0; maxNegative = 0; deltaNegative = 0;
    }

    for (let i = 0; i < n; ++i) {
      let newVal = valueEstimates.get(i);
      if (newVal === 0) continue;
      if (newVal < 0 && deltaNegative !== 0) {
        newVal = 0.0 - ((maxNegative - newVal) / deltaNegative);
      } else if (newVal < 0 && deltaNegative === 0) {
        newVal = -1;
      }
      if (newVal > 0 && deltaPositive !== 0) {
        newVal = 0.0 + ((newVal - minPositive) / deltaPositive);
      } else if (newVal > 0 && deltaPositive === 0) {
        newVal = 1;
      }
      valueEstimates.set(i, newVal);
    }

    // Sort entries by value descending and assign proportional aiDistribution scores
    const entries: Array<{ value: number; index: number }> = [];
    for (let i = 0; i < n; ++i) {
      entries.push({ value: valueEstimates.get(i), index: i });
    }
    entries.sort((a, b) => b.value - a.value);

    if (entries.length === 0) return null;

    const firstEntry = entries[0]!;
    aiDistribution.set(
      firstEntry.index,
      ((n - 0) * 1.0) / n * 1.0
    );

    let lastEntry: { value: number; index: number } = firstEntry;
    for (let i = 1; i < entries.length; ++i) {
      const entry = entries[i]!;
      if (lastEntry.value === entry.value) {
        aiDistribution.set(entry.index, aiDistribution.get(lastEntry.index));
      } else {
        const newValLoop = ((n - i) * 1.0) / n * 1.0;
        aiDistribution.set(entry.index, newValLoop);
      }
      lastEntry = entry;
    }

    const movesListFal: FastArrayList<Move> = {
      size: (): number => movesList.length,
      get: (i: number): Move => movesList[i] as Move,
      add: (m: Move): void => { movesList.push(m); },
      removeSwap: (_i: number): void => { /* not needed */ },
      [Symbol.iterator]: (): Iterator<Move> => movesList[Symbol.iterator](),
      toArray: (): Move[] => movesList.slice(),
    };

    return { aiDistribution, valueEstimates, moves: movesListFal };
  }

  //-------------------------------------------------------------------------

  /**
   * @java HeuristicSampleAdapted.evaluateMoves(Game, Context, int)
   */
  override evaluateMoves(game: Game, context: Context, depth: number): MoveScore {
    if (this.randomizingTerm) {
      this.evaluateMovesInternal(game, context, depth, false);
    }
    return this.evaluateMovesInternal(game, context, depth, this.randomizingTerm);
  }

  //-------------------------------------------------------------------------

  /**
   * @java HeuristicSampleAdapted.evaluateMoves(Game, Context, int, boolean)
   */
  private evaluateMovesInternal(
    game: Game,
    context: Context,
    depth: number,
    useRandomisingTerm: boolean
  ): MoveScore {
    const movesLocal = HeuristicSampling.selectMoves(game, context, this.threshold(), depth);
    const moveScoresLocal: MoveScore[] = [];

    if (!useRandomisingTerm) {
      this._moves = movesLocal;
      this.moveScores = {
        size: (): number => moveScoresLocal.length,
        get: (i: number): MoveScore => moveScoresLocal[i] as MoveScore,
        add: (ms: MoveScore): void => { moveScoresLocal.push(ms); },
        removeSwap: (_i: number): void => { /* not needed */ },
        [Symbol.iterator]: (): Iterator<MoveScore> => moveScoresLocal[Symbol.iterator](),
        toArray: (): MoveScore[] => moveScoresLocal.slice(),
      };
    }

    let bestScore: number = -Infinity;
    let bestMove: Move = movesLocal.get(0);

    const mover: number = context.state().mover();
    const threshold = HeuristicSampling.ABS_HEURISTIC_WEIGHT_THRESHOLD;
    const winScore = 10000.0;
    const paranoidScore = 10000.0;

    for (let mi = 0; mi < movesLocal.size(); ++mi) {
      const move = movesLocal.get(mi);

      // TempContext clone via escape hatch
      const contextCopy = (
        context as unknown as { _cloneAsTemp(): Context }
      )._cloneAsTemp?.() ?? context;

      game.apply(contextCopy as unknown, move);

      if (!contextCopy.active(mover)) {
        if (contextCopy.winners().contains(mover)) {
          const ms = makeMoveScore(move, winScore);
          moveScoresLocal.push(ms);
          if (winScore > bestScore) {
            bestScore = winScore;
            bestMove = move;
          }
          continue;
        } else if (contextCopy.losers().contains(mover)) {
          moveScoresLocal.push(makeMoveScore(move, -winScore));
          continue; // Skip losing move
        }
      }

      let score: number = 0;
      if (this.continuation() && contextCopy.state().mover() === mover && depth <= 10) {
        return makeMoveScore(
          move,
          this.evaluateMovesInternal(game, contextCopy, depth + 1, useRandomisingTerm).score()
        );
      } else {
        score = this.heuristicValueFunction!.computeValue(contextCopy, mover, threshold);
        for (const opp of this.opponents(mover)) {
          if (contextCopy.active(opp))
            score -= this.heuristicValueFunction!.computeValue(contextCopy, opp, threshold);
          else if (contextCopy.winners().contains(opp))
            score -= paranoidScore;
        }
        if (useRandomisingTerm)
          score += Math.floor(Math.random() * 1000) / 1000000.0;
      }

      moveScoresLocal.push(makeMoveScore(move, score));
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    if (!useRandomisingTerm) {
      this.latestMoveHeuristicEvaluation = new MoveHeuristicEvaluation(
        game, movesLocal, context, this.heuristicValueFunction!, mover, this.opponents(mover)
      );
      if (this.heuristicProportionView !== null) {
        this.heuristicProportionView.update(
          this.latestMoveHeuristicEvaluation as unknown as import("./HeuristicSampleAdaptedUtils/HeuristicProportionViewInterface.js").MoveHeuristicEvaluation,
          game,
          context
        );
      }
    }

    return makeMoveScore(bestMove, bestScore);
  }

  //-------------------------------------------------------------------------

  /**
   * Signal that the human user wants to commit the current best move.
   * @java HeuristicSampleAdapted.makeMove()
   */
  public makeMove(): void {
    this.waitForUserAction = false;
  }

  /**
   * Signal that the user has selected a specific move.
   * @java HeuristicSampleAdapted.makeMove(Move)
   */
  public makeMoveSelected(m: Move): void {
    this.userSelectedMove = m;
    this.waitForUserAction = false;
  }

  /** @java HeuristicSampleAdapted.useRandomTerm(boolean) */
  public useRandomTerm(useRandomTerm: boolean): void {
    this.randomizingTerm = useRandomTerm;
  }

  /** @java HeuristicSampleAdapted.setHeuristicProportionView(HeuristicProportionViewInterface) */
  public setHeuristicProportionView(
    heuristicProportionView: HeuristicProportionViewInterface
  ): void {
    this.heuristicProportionView = heuristicProportionView;
    this.heuristicProportionView.addObserver(
      this as unknown as import("./HeuristicSampleAdaptedUtils/HeuristicProportionViewInterface.js").HeuristicSampleAdapted
    );
  }

  //-------------------------------------------------------------------------
}

// SimpleFVector is already defined above as a class — re-alias for export clarity
export { SimpleFVector };
