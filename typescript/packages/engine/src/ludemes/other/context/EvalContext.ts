// @java Core/src/other/context/EvalContext.java EvalContext
/**
 * Faithful 1:1 transliteration of other.context.EvalContext.
 *
 * Stores all per-eval scratch variables threaded through ludeme eval()
 * calls. These are mutable scratchpad values that must NEVER be used
 * outside of eval methods.
 *
 * Java parity: other/context/EvalContext.java
 */

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Region placeholder – the full Region class (game.util.equipment.Region)
 * lives in the main engine runtime. We represent it as an opaque object
 * here so this file compiles without importing runtime classes.
 */
export type Region = { sites(): number[] };

/**
 * RegionFunction placeholder – game.functions.region.RegionFunction.
 * Deferred: depends on the full ludeme eval() subsystem.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RegionFunction = any;

export class EvalContext {
  // @java private int from = Constants.OFF;
  private _from: number = OFF;

  // @java private int level = Constants.OFF;
  private _level: number = OFF;

  // @java private int to = Constants.OFF;
  private _to: number = OFF;

  // @java private int between = Constants.OFF;
  private _between: number = OFF;

  // @java private int pipCount = Constants.OFF;
  private _pipCount: number = OFF;

  // @java private int player = Constants.OFF;
  private _player: number = OFF;

  // @java private int track = Constants.OFF;
  private _track: number = OFF;

  // @java private int site = Constants.OFF;
  private _site: number = OFF;

  // @java private int value = Constants.OFF;
  private _value: number = OFF;

  // @java private Region region = null;
  private _region: Region | null = null;

  // @java private RegionFunction hintRegion = null;
  private _hintRegion: RegionFunction | null = null;

  // @java private int hint = Constants.OFF;
  private _hint: number = OFF;

  // @java private int edge = Constants.OFF;
  private _edge: number = OFF;

  // @java private int[] team = null;
  private _team: number[] | null = null;

  // -------------------------------------------------------------------------

  /** Default constructor. */
  constructor();

  /** Copy constructor. */
  constructor(other: EvalContext);

  constructor(other?: EvalContext) {
    if (other !== undefined) {
      this._from      = other.from();
      this._to        = other.to();
      this._level     = other.level();
      this._between   = other.between();
      this._pipCount  = other.pipCount();
      this._player    = other.player();
      this._track     = other.track();
      this._site      = other._site;
      this._value     = other._value;
      this._region    = other._region;
      this._team      = other._team !== null ? [...other._team] : null;
      this._hint      = other.hint();
      this._edge      = other.edge();
      this._hintRegion = other._hintRegion;
    }
  }

  // -------------------------------------------------------------------------

  from():    number { return this._from;     }
  setFrom(v: number): void { this._from = v; }

  track():   number { return this._track;    }
  setTrack(v: number): void { this._track = v; }

  to():      number { return this._to;       }
  setTo(v: number): void { this._to = v; }

  between(): number { return this._between;  }
  setBetween(v: number): void { this._between = v; }

  player():  number { return this._player;   }
  setPlayer(v: number): void { this._player = v; }

  pipCount(): number { return this._pipCount; }
  setPipCount(v: number): void { this._pipCount = v; }

  level():   number { return this._level;    }
  setLevel(v: number): void { this._level = v; }

  hint():    number { return this._hint;     }
  setHint(v: number): void { this._hint = v; }

  edge():    number { return this._edge;     }
  setEdge(v: number): void { this._edge = v; }

  site():    number { return this._site;     }
  setSite(v: number): void { this._site = v; }

  value():   number { return this._value;    }
  setValue(v: number): void { this._value = v; }

  region():  Region | null { return this._region; }
  setRegion(r: Region | null): void { this._region = r; }

  hintRegion(): RegionFunction | null { return this._hintRegion; }
  setHintRegion(r: RegionFunction | null): void { this._hintRegion = r; }

  team():    number[] | null { return this._team; }
  setTeam(t: number[] | null): void { this._team = t; }
}
