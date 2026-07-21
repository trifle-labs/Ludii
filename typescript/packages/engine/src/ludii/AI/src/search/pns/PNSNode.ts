// @java AI/src/search/pns/PNSNode.java

/**
 * Node for search trees in PNS.
 *
 * @java search/pns/PNSNode.java
 * @author Dennis Soemers
 */

// Escape-hatch interfaces for not-yet-ported dependencies

/** @java other.move.Move */
export interface Move {
  toString(): string;
}

/** @java main.collections.FastArrayList */
export interface FastArrayList<T> {
  size(): number;
  get(i: number): T;
  toArray(arr?: T[]): T[];
}

/** @java other.context.Context */
export interface Context {
  state(): { mover(): number };
  trial(): { over(): boolean };
  game(): {
    moves(ctx: Context): { moves(): FastArrayList<Move> };
    apply(ctx: Context, move: Move): void;
  };
}

//-------------------------------------------------------------------------
// ProofGoals — defined here to avoid circular import with ProofNumberSearch.
// ProofNumberSearch re-exports this enum.

/**
 * Different goals that we can try to prove with PNS.
 *
 * @java search.pns.ProofNumberSearch.ProofGoals
 */
export enum ProofGoals {
  /** If we want to prove that a position is a win for current mover */
  PROVE_WIN,
  /** If we want to prove that a position is a loss for current mover */
  PROVE_LOSS
}

//-------------------------------------------------------------------------

/**
 * Nodes types in search trees in PNS.
 *
 * @java search.pns.PNSNode.PNSNodeTypes
 */
export enum PNSNodeTypes {
  /** An OR node */
  OR_NODE,
  /** An AND node */
  AND_NODE
}

/**
 * Values of nodes in search trees in PNS.
 *
 * @java search.pns.PNSNode.PNSNodeValues
 */
export enum PNSNodeValues {
  /** A proven node */
  TRUE,
  /** A disproven node */
  FALSE,
  /** Unknown node (yet to prove or disprove) */
  UNKNOWN
}

//-------------------------------------------------------------------------

/**
 * Node for search trees in PNS.
 *
 * @java search.pns.PNSNode
 */
export class PNSNode {

  //-------------------------------------------------------------------------

  /** Our parent node
   * @java PNSNode.parent */
  public readonly parent: PNSNode | null;

  /** Our node type
   * @java PNSNode.nodeType */
  protected readonly _nodeType: PNSNodeTypes;

  /** Context for this node (contains game state)
   * @java PNSNode.context */
  protected readonly _context: Context;

  /** Array of child nodes.
   * @java PNSNode.children */
  protected readonly _children: Array<PNSNode | null>;

  /** Array of legal moves in this node's state
   * @java PNSNode.legalMoves */
  public readonly legalMoves: Move[];

  /** Whether we have expanded (generated child nodes)
   * @java PNSNode.expanded */
  private _expanded: boolean = false;

  /** Our proof number
   * @java PNSNode.proofNumber */
  private _proofNumber: number = -1;

  /** Our disproof number
   * @java PNSNode.disproofNumber */
  private _disproofNumber: number = -1;

  /** Our node's value
   * @java PNSNode.value */
  private _value: PNSNodeValues = PNSNodeValues.UNKNOWN;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param parent
   * @param context
   * @param proofGoal
   * @param proofPlayer
   * @java PNSNode(PNSNode, Context, ProofGoals, int)
   */
  public constructor(
    parent: PNSNode | null,
    context: Context,
    proofGoal: ProofGoals,
    proofPlayer: number
  ) {
    this.parent = parent;
    this._context = context;

    const mover: number = context.state().mover();

    if (mover === proofPlayer) {
      if (proofGoal === ProofGoals.PROVE_WIN)
        this._nodeType = PNSNodeTypes.OR_NODE;
      else
        this._nodeType = PNSNodeTypes.AND_NODE;
    } else {
      if (proofGoal === ProofGoals.PROVE_WIN)
        this._nodeType = PNSNodeTypes.AND_NODE;
      else
        this._nodeType = PNSNodeTypes.OR_NODE;
    }

    if (context.trial().over()) {
      // terminal game state — create empty list of actions
      this.legalMoves = [];
    } else {
      // non-terminal game state — figure out list of actions we can still take
      const actions: FastArrayList<Move> = context.game().moves(context).moves();
      this.legalMoves = new Array(actions.size());
      for (let i = 0; i < actions.size(); ++i)
        this.legalMoves[i] = actions.get(i);
    }

    this._children = new Array(this.legalMoves.length).fill(null);
  }

  //-------------------------------------------------------------------------

  /**
   * @return Array of child nodes (contains null entries if not expanded)
   * @java PNSNode.children()
   */
  public children(): Array<PNSNode | null> {
    return this._children;
  }

  /**
   * @return Context in this node
   * @java PNSNode.context()
   */
  public context(): Context {
    return this._context;
  }

  /**
   * Deletes subtree below this node
   * @java PNSNode.deleteSubtree()
   */
  public deleteSubtree(): void {
    this._children.fill(null);
  }

  /**
   * @return Our disproof number
   * @java PNSNode.disproofNumber()
   */
  public disproofNumber(): number {
    if (this._disproofNumber < 0)
      throw new Error("disproofNumber not yet set");
    return this._disproofNumber;
  }

  /**
   * @return True if and only if this node has been expanded
   * @java PNSNode.isExpanded()
   */
  public isExpanded(): boolean {
    return this._expanded;
  }

  /**
   * @return Our node type
   * @java PNSNode.nodeType()
   */
  public nodeType(): PNSNodeTypes {
    return this._nodeType;
  }

  /**
   * @return Our proof number
   * @java PNSNode.proofNumber()
   */
  public proofNumber(): number {
    if (this._proofNumber < 0)
      throw new Error("proofNumber not yet set");
    return this._proofNumber;
  }

  /**
   * Sets our disproof number
   * @param disproofNumber
   * @java PNSNode.setDisproofNumber(int)
   */
  public setDisproofNumber(disproofNumber: number): void {
    this._disproofNumber = disproofNumber;
  }

  /**
   * Sets whether or not we're expanded
   * @param expanded
   * @java PNSNode.setExpanded(boolean)
   */
  public setExpanded(expanded: boolean): void {
    this._expanded = expanded;
  }

  /**
   * Sets our proof number
   * @param proofNumber
   * @java PNSNode.setProofNumber(int)
   */
  public setProofNumber(proofNumber: number): void {
    this._proofNumber = proofNumber;
  }

  /**
   * Sets our node's value
   * @param value
   * @java PNSNode.setValue(PNSNodeValues)
   */
  public setValue(value: PNSNodeValues): void {
    this._value = value;
  }

  /**
   * @return Our node's value
   * @java PNSNode.value()
   */
  public value(): PNSNodeValues {
    return this._value;
  }

  //-------------------------------------------------------------------------
}
