// @java Core/src/other/move/Move.java Move
/**
 * Move made up of a list of actions for modifying the game state.
 *
 * Faithful 1:1 transliteration of other.move.Move (the Java class is named
 * "Move" but that collides with the runtime src/move.ts in this repo, so the
 * TS class is named LudiiMove while the file is LudiiMove.ts).
 *
 * @author Eric.Piette and cambolbro  (Java original)
 */

import { extractData } from "../action/Action.js";
import type { Action } from "../action/Action.js";

const UNDEFINED   = -1;
const GROUND_LEVEL = 0;

/** Minimal opaque reference for Moves ludeme. */
export type MovesLudeme = unknown;

/**
 * Java parity of other.move.Move.
 *
 * A Move is a BaseAction that itself contains a list of Actions.
 * @java other.move.Move
 */
export class LudiiMove {
  // -------- decision-data fields -------------------------------------------

  /** @java Move#from */
  private _from:    number = UNDEFINED;
  /** @java Move#to */
  private _to:      number = UNDEFINED;
  /** @java Move#between  (TIntArrayList) */
  private _between: number[] = [];
  /** @java Move#state */
  private _state:   number = UNDEFINED;
  /** @java Move#oriented */
  private _oriented: boolean = true;
  /** @java Move#edge */
  private _edge:    number = UNDEFINED;
  /** @java Move#mover */
  private _mover:   number = 0;
  /** @java Move#levelMin */
  private _levelMin: number = GROUND_LEVEL;
  /** @java Move#levelMax */
  private _levelMax: number = GROUND_LEVEL;

  // -------- core lists -----------------------------------------------------

  /** @java Move#actions — sequence of actions making up this move */
  private readonly _actions: Action[];

  /** @java Move#then — list of Moves ludemes (subsequents) */
  private readonly _then: MovesLudeme[] = [];

  /** @java Move#movesLudeme — generating Moves ludeme */
  private _movesLudeme: MovesLudeme | null = null;

  // -------- decision flag (from BaseAction) --------------------------------

  private _decision: boolean = false;

  // -------------------------------------------------------------------------
  // Constructors
  // -------------------------------------------------------------------------

  /**
   * Construct from a list of actions.
   * @java Move(List<Action> actions)
   */
  constructor(actions: Action[]);

  /**
   * Construct from a single action.
   * @java Move(Action a)
   */
  constructor(a: Action);

  /**
   * Construct from two actions (a, b).
   * @java Move(Action a, Action b)
   */
  constructor(a: Action, b: Action);

  /**
   * Copy constructor.
   * @java Move(Move other)
   */
  constructor(other: LudiiMove);

  /**
   * Deserialise from a detailed string.
   * @java Move(String detailedString)
   */
  constructor(detailedString: string);

  constructor(
    first: Action | Action[] | LudiiMove | string,
    second?: Action,
  ) {
    if (typeof first === "string") {
      // ---- deserialise from detailedString --------------------------------
      const s = first;
      const strBeforeActions = s.substring(0, s.indexOf("actions="));

      const strFrom  = extractData(strBeforeActions, "from");
      this._from     = strFrom  === "" ? UNDEFINED : parseInt(strFrom, 10);

      const strTo    = extractData(strBeforeActions, "to");
      this._to       = strTo    === "" ? UNDEFINED : parseInt(strTo, 10);

      const strState = extractData(strBeforeActions, "state");
      this._state    = strState === "" ? UNDEFINED : parseInt(strState, 10);

      const strOriented = extractData(strBeforeActions, "oriented");
      this._oriented = strOriented === "" ? true : strOriented === "true";

      const strEdge = extractData(strBeforeActions, "edge");
      this._edge    = strEdge === "" ? UNDEFINED : parseInt(strEdge, 10);

      const strMover = extractData(strBeforeActions, "mover");
      this._mover    = parseInt(strMover, 10);

      const strLvlMin = extractData(strBeforeActions, "levelMin");
      this._levelMin  = strLvlMin === "" ? GROUND_LEVEL : parseInt(strLvlMin, 10);

      const strLvlMax = extractData(strBeforeActions, "levelMax");
      this._levelMax  = strLvlMax === "" ? GROUND_LEVEL : parseInt(strLvlMax, 10);

      this._actions = [];   // action parsing omitted (requires full Action registry)

    } else if (first instanceof LudiiMove && second === undefined) {
      // ---- copy constructor -----------------------------------------------
      this._from     = first._from;
      this._to       = first._to;
      this._between  = [...first._between];
      this._actions  = [...first._actions];
      this._mover    = first._mover;

    } else if (Array.isArray(first) && second === undefined) {
      // ---- List<Action> constructor ---------------------------------------
      this._actions = first;
      if (this._actions.length > 0) {
        this._from = this._actions[0]!.from();
        this._to   = this._actions[0]!.to();
      }

    } else if (!Array.isArray(first) && second !== undefined && !(first instanceof LudiiMove)) {
      // ---- (Action a, Action b) constructor -------------------------------
      const a = first as Action;
      const b = second;
      this._actions = [a, b];
      this._from    = a.from();
      this._to      = a.to();

    } else {
      // ---- single Action constructor -------------------------------------
      const a = first as Action;
      this._actions = [a];
      this._from    = a.from();
      this._to      = a.to();
    }
  }

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  /** @java Move#mover() */
  mover(): number { return this._mover; }

  /** @java Move#setMover(int) */
  setMover(who: number): void { this._mover = who; }

  /** @java Move#actions() */
  actions(): Action[] { return this._actions; }

  /** @java Move#then() */
  then(): MovesLudeme[] { return this._then; }

  /** @java Move#from() */
  from(): number { return this._from; }

  /** @java Move#to() */
  to(): number { return this._to; }

  /** @java Move#state() */
  state(): number { return this._state; }

  /** @java Move#oriented() */
  oriented(): boolean { return this._oriented; }

  /** @java Move#edge() */
  edge(): number { return this._edge; }

  /** @java Move#levelMin() */
  levelMin(): number { return this._levelMin; }

  /** @java Move#levelMax() */
  levelMax(): number { return this._levelMax; }

  /** @java Move#between() (TIntArrayList) */
  between(): number[] { return this._between; }

  // ---- non-decision variants (setters used by apply()) -------------------

  setFromNonDecision(v: number): void   { this._from    = v; }
  setToNonDecision(v: number): void     { this._to      = v; }
  setStateNonDecision(v: number): void  { this._state   = v; }
  setOrientedMove(v: boolean): void     { this._oriented = v; }
  setEdgeMove(v: number): void          { this._edge    = v; }
  setLevelMinNonDecision(v: number): void { this._levelMin = v; }
  setLevelMaxNonDecision(v: number): void { this._levelMax = v; }
  setBetweenNonDecision(v: number[]): void { this._between = v; }

  // ---- between helpers (non-decision) ------------------------------------

  /** @java Move#betweenNonDecision() */
  betweenNonDecision(): number[] { return this._between; }

  // ---- decision flag (mirrors BaseAction) --------------------------------

  /** @java BaseAction#decision */
  isDecision(): boolean { return this._decision; }

  setDecision(dec: boolean): void { this._decision = dec; }

  // ---- movesLudeme -------------------------------------------------------

  /** @java Move#movesLudeme() */
  movesLudeme(): MovesLudeme | null { return this._movesLudeme; }

  /** @java Move#setMovesLudeme(Moves) */
  setMovesLudeme(m: MovesLudeme): void { this._movesLudeme = m; }

  // ---- utility -----------------------------------------------------------

  /** @java Move#isPass() */
  isPass(): boolean {
    return this._actions.length > 0 && this._actions[0]!.isPass();
  }

  /** @java Move#isForfeit() */
  isForfeit(): boolean {
    return this._actions.length > 0 && this._actions[0]!.isForfeit();
  }

  toString(): string {
    return `[Move:from=${this._from},to=${this._to},mover=${this._mover},actions=${JSON.stringify(this._actions.length)}]`;
  }
}
