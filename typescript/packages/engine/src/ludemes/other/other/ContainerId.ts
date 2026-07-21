// @java Core/src/other/ContainerId.java ContainerId
/**
 * Faithful 1:1 transliteration of other.ContainerId.
 *
 * Java parity: other/ContainerId.java
 *
 * Gets the index of a container from its index, name (optionally paired with
 * a RoleType / playerId), or from a site index.
 *
 * Deferrals:
 *  - IntFunction / IntConstant: represented as minimal local interfaces.
 *  - RoleType: represented as an opaque string enum.
 *  - Context: represented as a minimal opaque interface matching the surface
 *    used in eval() — containerId(), containers(), game().mapContainer().
 *  - Id ludeme eval: inlined as a stub that throws (deferred subsystem).
 *  - Constants.UNDEFINED: inlined as -1 (matches the Java value).
 *  - Container / Hand: represented as minimal interfaces.
 *
 * @author cambolbro and Eric Piette (Java)
 * TypeScript transliteration.
 */

// ---------------------------------------------------------------------------
// Minimal stand-ins for absent subsystems
// ---------------------------------------------------------------------------

/** @java main.Constants.UNDEFINED */
const UNDEFINED = -1;

/**
 * Minimal surface of game.functions.ints.IntFunction.
 * @java public interface IntFunction { int eval(Context context); }
 */
export interface IntFunction {
  eval(context: IContext): number;
}

/**
 * @java game.functions.ints.IntConstant
 * Wraps a literal integer as an IntFunction.
 */
export class IntConstant implements IntFunction {
  private readonly _value: number;
  constructor(value: number) { this._value = value; }
  eval(_context: IContext): number { return this._value; }
}

/**
 * @java game.types.play.RoleType
 * Represented as an opaque string to avoid pulling in the full enum.
 */
export type RoleType = string;

/** Minimal surface of game.equipment.container.Container */
export interface IContainer {
  isHand(): boolean;
  name(): string;
  index(): number;
  owner?(): number;
}

/** Minimal surface of game.equipment.container.other.Hand */
export interface IHand extends IContainer {
  owner(): number;
}

/** Minimal game surface used in eval() */
export interface IGameForContainerId {
  mapContainer(): { get(name: string): { index(): number } };
}

/** Minimal context surface used in eval() */
export interface IContext {
  containerId(): number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containers(): any;
  game(): IGameForContainerId;
}

// ---------------------------------------------------------------------------
// ContainerId
// ---------------------------------------------------------------------------

/**
 * Get index of a container from its index, name (with or without role type /
 * playerId), or from a site in a container.
 *
 * @author cambolbro and Eric Piette (Java)
 * TypeScript transliteration.
 */
export class ContainerId {

  // @java protected final IntFunction index;
  protected readonly _index: IntFunction | null;

  // @java protected final String name;
  protected readonly _name: string | null;

  // @java protected final RoleType role;
  protected readonly _role: RoleType | null;

  // @java protected final IntFunction playerId;
  protected readonly _playerId: IntFunction | null;

  // @java protected final IntFunction site;
  protected readonly _site: IntFunction | null;

  // -------------------------------------------------------------------------

  /**
   * Constructor.
   *
   * Exactly the same branching logic as the Java source: only one of the five
   * parameter combinations is legal; all others throw.
   *
   * @java public ContainerId(IntFunction index, String name, RoleType role, IntFunction playerId, IntFunction site)
   */
  constructor(
    index: IntFunction | null,
    name: string | null,
    role: RoleType | null,
    playerId: IntFunction | null,
    site: IntFunction | null,
  ) {
    if (index === null && name === null && role === null && playerId === null && site === null) {
      // All null → default to container 0
      this._index    = new IntConstant(0);
      this._name     = null;
      this._role     = null;
      this._playerId = null;
      this._site     = null;
    } else if (index !== null && name === null && role === null && playerId === null && site === null) {
      // Index only
      this._index    = index;
      this._name     = null;
      this._role     = null;
      this._playerId = null;
      this._site     = null;
    } else if (index === null && name !== null && role === null && playerId === null && site === null) {
      // Name only
      this._index    = null;
      this._name     = name;
      this._role     = null;
      this._playerId = null;
      this._site     = null;
    } else if (index === null && name !== null && role !== null && playerId === null && site === null) {
      // Name + role
      this._index    = null;
      this._name     = name;
      this._role     = role;
      this._playerId = null;
      this._site     = null;
    } else if (index === null && name !== null && role === null && playerId !== null && site === null) {
      // Name + playerId
      this._index    = null;
      this._name     = name;
      this._role     = null;
      this._playerId = playerId;
      this._site     = null;
    } else if (index === null && name === null && role === null && playerId === null && site !== null) {
      // Site only
      this._index    = null;
      this._name     = null;
      this._role     = null;
      this._playerId = null;
      this._site     = site;
    } else {
      throw new Error("ContainerId: Unexpected parameter combination.");
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Evaluate and return the index of the container matching these parameters.
   *
   * @param context The context.
   * @return The corresponding index of the container.
   * @java public int eval(final Context context)
   */
  eval(context: IContext): number {
    // Case 1: direct numeric index
    if (this._index !== null) {
      return this._index.eval(context);
    }

    // Case 2: look up by site
    if (this._site !== null) {
      const indexSite = this._site.eval(context);
      if (indexSite === UNDEFINED) return 0;
      return context.containerId()[indexSite] ?? 0;
    }

    // Case 3: name-only → look up in game's container map
    if (this._role === null && this._playerId === null) {
      return context.game().mapContainer().get(this._name!).index();
    }

    // Case 4: name + role or name + playerId → scan Hand containers
    // @java final int pid = (role != null) ? new Id(null, role).eval(context) : playerId.eval(context);
    // NOTE: Id ludeme is deferred. For role-based lookup we defer and throw;
    //       for playerId-based lookup we evaluate directly.
    let pid: number;
    if (this._role !== null) {
      // DEFERRED: requires Id ludeme subsystem
      throw new Error(
        "ContainerId.eval: role-based Id lookup is deferred – requires Id ludeme subsystem"
      );
    } else {
      pid = this._playerId!.eval(context);
    }

    // Scan containers for a Hand with matching name and owner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const containers: any[] = context.containers();
    for (let cid = 0; cid < containers.length; cid++) {
      const container = containers[cid] as IContainer;
      if (
        container.isHand() &&
        container.name().includes(this._name!) &&
        (container as IHand).owner() === pid
      ) {
        return cid;
      }
    }

    throw new Error("ContainerId.eval: Could not find specified container.");
  }

  // -------------------------------------------------------------------------
}
