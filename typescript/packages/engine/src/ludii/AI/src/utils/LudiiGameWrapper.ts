// @java AI/src/utils/LudiiGameWrapper.java

/**
 * Wrapper around a Ludii game, with various extra methods required for
 * other frameworks that like to wrap around Ludii (e.g. OpenSpiel, Polygames).
 *
 * @java utils/LudiiGameWrapper.java
 * @author Dennis Soemers
 */

// Escape-hatch types for not-yet-ported Java dependencies

/** @java game.Game */
type Game = {
  name(): string;
  isAlternatingMoveGame(): boolean;
  isStochasticGame(): boolean;
  hiddenInformation(): boolean;
  players(): { count(): number };
  gameFlags(): bigint;
  isStacking(): boolean;
  requiresCount(): boolean;
  requiresBet(): boolean;
  requiresLocalState(): boolean;
  metaRules(): { usesSwapRule(): boolean };
  equipment(): Equipment;
  graphPlayElements(): TopologyElement[];
  numContainers(): number;
  hasSubgames(): boolean;
  getMaxMoveLimit(): number;
  usesVote(): boolean;
  numVoteStrings(): number;
};

type Equipment = {
  containers(): Container[];
  components(): Component[];
  totalDefaultSites(): number;
  sitesFrom(): number[];
};

type Container = {
  numSites(): number;
  name(): string;
};

type Component = {
  name(): string;
  owner(): number;
  generator(): unknown;
};

type TopologyElement = {
  index(): number;
  centroid(): { getX(): number; getY(): number };
};

type Move = {
  isPropose(): boolean;
  isVote(): boolean;
  isPass(): boolean;
  isSwap(): boolean;
  isOtherMove(): boolean;
  actions(): Action[];
  fromNonDecision(): number;
  toNonDecision(): number;
  levelMinNonDecision(): number;
  levelMaxNonDecision(): number;
  mover(): number;
};

type Action = {
  isDecision(): boolean;
  propositionInt?(): number;
  voteInt?(): number;
};

// Escape-hatch singletons
const GameLoader = null as unknown as {
  loadGameFromName(name: string): Game;
  loadGameFromName(name: string, options: string[]): Game;
  loadGameFromFile(file: unknown): Game;
  loadGameFromFile(file: unknown, options: string[]): Game;
};

const MathRoutines = null as unknown as {
  clip(val: number, min: number, max: number): number;
};

const Constants = null as unknown as {
  OFF: number;
  LUDEME_VERSION: string;
};

const FileHandling = null as unknown as {
  listGames(): string[];
};

const LudemeTreeUtils = null as unknown as {
  buildLudemeZhangShashaTree(generator: unknown): Tree;
};

const Tree = null as unknown as {
  ZhangShasha(a: Tree, b: Tree): number;
};

type Tree = object;

/** @java game.types.state.GameType.UsesFromPositions */
const UsesFromPositions: bigint = BigInt(1) << BigInt(10); // approximate

/**
 * Wrapper class for keys used to index into map of already-compiled game wrappers.
 * @java utils.LudiiGameWrapper.GameWrapperCacheKey
 */
class GameWrapperCacheKey {
  /** @java GameWrapperCacheKey.gameName */
  private readonly gameName: string;
  /** @java GameWrapperCacheKey.options */
  private readonly options: string[];

  /**
   * @java GameWrapperCacheKey(String, List)
   */
  public constructor(gameName: string, options: string[]) {
    this.gameName = gameName;
    this.options = options;
  }

  public hashCode(): string {
    return JSON.stringify({ gameName: this.gameName, options: this.options });
  }

  public equals(other: GameWrapperCacheKey): boolean {
    return this.gameName === other.gameName &&
      JSON.stringify(this.options) === JSON.stringify(other.options);
  }
}

/** Cache of already-instantiated LudiiGameWrapper objects */
const gameWrappersCache: Map<string, LudiiGameWrapper> = new Map();

//-------------------------------------------------------------------------

/**
 * Wrapper around a Ludii game.
 *
 * @java utils.LudiiGameWrapper
 */
export class LudiiGameWrapper {

  //-------------------------------------------------------------------------

  /** @java LudiiGameWrapper.EPSILON */
  protected static readonly EPSILON: number = 0.00001;

  /** @java LudiiGameWrapper.NUM_STACK_CHANNELS */
  protected static readonly NUM_STACK_CHANNELS: number = 10;

  /** @java LudiiGameWrapper.NUM_LOCAL_STATE_CHANNELS */
  protected static readonly NUM_LOCAL_STATE_CHANNELS: number = 6;

  /** @java LudiiGameWrapper.DEFAULT_MOVE_TENSOR_DIST_CLIP */
  protected static readonly DEFAULT_MOVE_TENSOR_DIST_CLIP: number = 3;

  /** @java LudiiGameWrapper.MOVE_TENSOR_LEVEL_CLIP */
  protected static readonly MOVE_TENSOR_LEVEL_CLIP: number = 2;

  //-------------------------------------------------------------------------

  /** @java LudiiGameWrapper.game */
  protected readonly game: Game;

  /** @java LudiiGameWrapper.xCoords */
  protected xCoords: number[] = [];

  /** @java LudiiGameWrapper.yCoords */
  protected yCoords: number[] = [];

  /** @java LudiiGameWrapper.tensorDimX */
  protected tensorDimX: number = 0;

  /** @java LudiiGameWrapper.tensorDimY */
  protected tensorDimY: number = 0;

  /** @java LudiiGameWrapper.stateTensorNumChannels */
  protected stateTensorNumChannels: number = 0;

  /** @java LudiiGameWrapper.stateTensorChannelNames */
  protected stateTensorChannelNames: string[] = [];

  /** @java LudiiGameWrapper.moveTensorDistClip */
  protected readonly moveTensorDistClip: number;

  /** @java LudiiGameWrapper.FIRST_PROPOSITION_CHANNEL_IDX */
  protected FIRST_PROPOSITION_CHANNEL_IDX: number = 0;

  /** @java LudiiGameWrapper.FIRST_VOTE_CHANNEL_IDX */
  protected FIRST_VOTE_CHANNEL_IDX: number = 0;

  /** @java LudiiGameWrapper.MOVE_PASS_CHANNEL_IDX */
  protected MOVE_PASS_CHANNEL_IDX: number = 0;

  /** @java LudiiGameWrapper.MOVE_SWAP_CHANNEL_IDX */
  protected MOVE_SWAP_CHANNEL_IDX: number = 0;

  /** @java LudiiGameWrapper.ALL_ONES_CHANNEL_FLAT */
  protected ALL_ONES_CHANNEL_FLAT: Float32Array = new Float32Array(0);

  /** @java LudiiGameWrapper.CONTAINER_POSITION_CHANNELS */
  protected CONTAINER_POSITION_CHANNELS: Float32Array = new Float32Array(0);

  //-------------------------------------------------------------------------

  /**
   * @param gameName
   * @return Returns LudiiGameWrapper for game name (default options)
   * @java LudiiGameWrapper.construct(String)
   */
  public static construct(gameName: string): LudiiGameWrapper {
    const key = new GameWrapperCacheKey(gameName, []);
    const cacheKey = key.hashCode();
    let wrapper = gameWrappersCache.get(cacheKey);

    if (wrapper === undefined) {
      wrapper = new LudiiGameWrapper(GameLoader.loadGameFromName(gameName));
      gameWrappersCache.set(cacheKey, wrapper);
    }

    return wrapper;
  }

  /**
   * @param gameName
   * @param gameOptions
   * @return Returns LudiiGameWrapper for give game name and options
   * @java LudiiGameWrapper.construct(String, String...)
   */
  public static constructWithOptions(gameName: string, ...gameOptions: string[]): LudiiGameWrapper {
    const key = new GameWrapperCacheKey(gameName, gameOptions);
    const cacheKey = key.hashCode();
    let wrapper = gameWrappersCache.get(cacheKey);

    if (wrapper === undefined) {
      wrapper = new LudiiGameWrapper(GameLoader.loadGameFromName(gameName, gameOptions));
      gameWrappersCache.set(cacheKey, wrapper);
    }

    return wrapper;
  }

  /**
   * @param file
   * @return Returns LudiiGameWrapper for .lud file
   * @java LudiiGameWrapper.construct(File)
   */
  public static constructFromFile(file: unknown): LudiiGameWrapper {
    const game = GameLoader.loadGameFromFile(file);
    return new LudiiGameWrapper(game);
  }

  /**
   * @param file
   * @param gameOptions
   * @return Returns LudiiGameWrapper for .lud file with game options
   * @java LudiiGameWrapper.construct(File, String...)
   */
  public static constructFromFileWithOptions(file: unknown, ...gameOptions: string[]): LudiiGameWrapper {
    const game = GameLoader.loadGameFromFile(file, gameOptions);
    return new LudiiGameWrapper(game);
  }

  /**
   * Constructor for already-instantiated game.
   * @param game
   * @java LudiiGameWrapper(Game)
   */
  public constructor(game: Game) {
    this.game = game;

    if ((game.gameFlags() & UsesFromPositions) === BigInt(0)) {
      this.moveTensorDistClip = 0;
    } else {
      this.moveTensorDistClip = LudiiGameWrapper.DEFAULT_MOVE_TENSOR_DIST_CLIP;
    }

    this.computeTensorCoords();
  }

  //-------------------------------------------------------------------------

  /**
   * @return The version of Ludii that we're using
   * @java LudiiGameWrapper.ludiiVersion()
   */
  public static ludiiVersion(): string {
    return Constants.LUDEME_VERSION;
  }

  /**
   * @return True if and only if the game is a simultaneous-move game
   * @java LudiiGameWrapper.isSimultaneousMoveGame()
   */
  public isSimultaneousMoveGame(): boolean {
    return !this.game.isAlternatingMoveGame();
  }

  /**
   * @return True if and only if the game is a stochastic game
   * @java LudiiGameWrapper.isStochasticGame()
   */
  public isStochasticGame(): boolean {
    return this.game.isStochasticGame();
  }

  /**
   * @return True if and only if the game is an imperfect-information game
   * @java LudiiGameWrapper.isImperfectInformationGame()
   */
  public isImperfectInformationGame(): boolean {
    return this.game.hiddenInformation();
  }

  /**
   * @return Game's name
   * @java LudiiGameWrapper.name()
   */
  public name(): string {
    return this.game.name();
  }

  /**
   * @return Number of players
   * @java LudiiGameWrapper.numPlayers()
   */
  public numPlayers(): number {
    return this.game.players().count();
  }

  /**
   * @return X coordinates in state tensors for all sites
   * @java LudiiGameWrapper.tensorCoordsX()
   */
  public tensorCoordsX(): number[] {
    return this.xCoords;
  }

  /**
   * @return Y coordinates in state tensors for all sites
   * @java LudiiGameWrapper.tensorCoordsY()
   */
  public tensorCoordsY(): number[] {
    return this.yCoords;
  }

  /**
   * @return Size of x-dimension for state tensors
   * @java LudiiGameWrapper.tensorDimX()
   */
  public tensorDimX_get(): number {
    return this.tensorDimX;
  }

  /**
   * @return Size of y-dimension for state tensors
   * @java LudiiGameWrapper.tensorDimY()
   */
  public tensorDimY_get(): number {
    return this.tensorDimY;
  }

  /**
   * @return Shape of tensors for moves: [numChannels, size(x dimension), size(y dimension)]
   * @java LudiiGameWrapper.moveTensorsShape()
   */
  public moveTensorsShape(): number[] {
    return [this.MOVE_SWAP_CHANNEL_IDX + 1, this.tensorDimX_get(), this.tensorDimY_get()];
  }

  /**
   * @return Shape of tensors for states: [numChannels, size(x dimension), size(y dimension)]
   * @java LudiiGameWrapper.stateTensorsShape()
   */
  public stateTensorsShape(): number[] {
    return [this.stateTensorNumChannels, this.tensorDimX_get(), this.tensorDimY_get()];
  }

  /**
   * @return Array of names for all the channels in our state tensors
   * @java LudiiGameWrapper.stateTensorChannelNames()
   */
  public stateTensorChannelNames_get(): string[] {
    return this.stateTensorChannelNames;
  }

  /**
   * @param move
   * @return A tensor representation of given move (shape = [3])
   * @java LudiiGameWrapper.moveToTensor(Move)
   */
  public moveToTensor(move: Move): number[] {
    if (move.isPropose()) {
      let offset = 0;

      for (const a of move.actions()) {
        if (typeof (a as unknown as { propositionInt?(): number }).propositionInt === "function" && a.isDecision()) {
          offset = (a as unknown as { propositionInt(): number }).propositionInt();
          break;
        }
      }

      return [this.FIRST_PROPOSITION_CHANNEL_IDX + offset, 0, 0];
    } else if (move.isVote()) {
      let offset = 0;

      for (const a of move.actions()) {
        if (typeof (a as unknown as { voteInt?(): number }).voteInt === "function" && a.isDecision()) {
          offset = (a as unknown as { voteInt(): number }).voteInt();
          break;
        }
      }

      return [this.FIRST_VOTE_CHANNEL_IDX + offset, 0, 0];
    } else if (move.isPass()) {
      return [this.MOVE_PASS_CHANNEL_IDX, 0, 0];
    } else if (move.isSwap()) {
      return [this.MOVE_SWAP_CHANNEL_IDX, 0, 0];
    } else if (move.isOtherMove()) {
      // TODO stop treating these all as passes
      return [this.MOVE_PASS_CHANNEL_IDX, 0, 0];
    } else {
      const from = move.fromNonDecision();
      const to = move.toNonDecision();
      const levelMin = move.levelMinNonDecision();
      const levelMax = move.levelMaxNonDecision();

      const fromX = from !== Constants.OFF ? this.xCoords[from]! : -1;
      const fromY = from !== Constants.OFF ? this.yCoords[from]! : -1;
      const toX = this.xCoords[to]!;
      const toY = this.yCoords[to]!;

      const diffX = from !== Constants.OFF ? toX - fromX : 0;
      const diffY = from !== Constants.OFF ? toY - fromY : 0;

      let channelIdx = MathRoutines.clip(diffX, -this.moveTensorDistClip, this.moveTensorDistClip) + this.moveTensorDistClip;

      channelIdx *= (this.moveTensorDistClip * 2 + 1);
      channelIdx += MathRoutines.clip(diffY, -this.moveTensorDistClip, this.moveTensorDistClip) + this.moveTensorDistClip;

      if (this.game.isStacking()) {
        channelIdx *= (LudiiGameWrapper.MOVE_TENSOR_LEVEL_CLIP + 1);
        channelIdx += MathRoutines.clip(levelMin, 0, LudiiGameWrapper.MOVE_TENSOR_LEVEL_CLIP);

        channelIdx *= (LudiiGameWrapper.MOVE_TENSOR_LEVEL_CLIP + 1);
        channelIdx += MathRoutines.clip(levelMax - levelMin, 0, LudiiGameWrapper.MOVE_TENSOR_LEVEL_CLIP);
      }

      return [channelIdx, toX, toY];
    }
  }

  /**
   * @param moveTensor
   * @return A single int representation of a move (converted from its tensor representation)
   * @java LudiiGameWrapper.moveTensorToInt(int[])
   */
  public moveTensorToInt(moveTensor: number[]): number {
    const moveTensorsShape = this.moveTensorsShape();
    return moveTensorsShape[1]! * moveTensorsShape[2]! * moveTensor[0]! +
      moveTensorsShape[2]! * moveTensor[1]! +
      moveTensor[2]!;
  }

  /**
   * @param move
   * @return A single int representation of a move
   * @java LudiiGameWrapper.moveToInt(Move)
   */
  public moveToInt(move: Move): number {
    return this.moveTensorToInt(this.moveToTensor(move));
  }

  /**
   * @return Number of distinct actions that we can represent in our tensor-based representations for this game.
   * @java LudiiGameWrapper.numDistinctActions()
   */
  public numDistinctActions(): number {
    const moveTensorsShape = this.moveTensorsShape();
    return moveTensorsShape[0]! * moveTensorsShape[1]! * moveTensorsShape[2]!;
  }

  /**
   * @return Max duration of game (measured in moves)
   * @java LudiiGameWrapper.maxGameLength()
   */
  public maxGameLength(): number {
    return this.game.getMaxMoveLimit();
  }

  /**
   * @return A flat representation of a channel fully filled with only 1s.
   * @java LudiiGameWrapper.allOnesChannelFlat()
   */
  public allOnesChannelFlat(): Float32Array {
    return this.ALL_ONES_CHANNEL_FLAT;
  }

  /**
   * @return A flat version of multiple concatenated channels (one per container),
   * indicating whether or not positions exist in containers
   * @java LudiiGameWrapper.containerPositionChannels()
   */
  public containerPositionChannels(): Float32Array {
    return this.CONTAINER_POSITION_CHANNELS;
  }

  //-------------------------------------------------------------------------

  /**
   * Computes x and y coordinates in state tensors for all sites in the game.
   * @java LudiiGameWrapper.computeTensorCoords()
   */
  private computeTensorCoords(): void {
    if (this.game.hasSubgames()) {
      console.error("Computing tensors for Matches is not yet supported.");
      return;
    }

    const containers = this.game.equipment().containers();
    const graphElements = this.game.graphPlayElements();
    this.xCoords = new Array(this.game.equipment().totalDefaultSites()).fill(0);
    this.yCoords = new Array(this.game.equipment().totalDefaultSites()).fill(0);
    const numBoardSites = graphElements.length;

    // first sort by X, to find x indices for vertices
    const sortedGraphElements = [...graphElements];
    sortedGraphElements.sort((o1, o2) => {
      if (o1.centroid().getX() < o2.centroid().getX()) return -1;
      else if (o1.centroid().getX() === o2.centroid().getX()) return 0;
      else return 1;
    });

    let currIdx = 0;
    let currXPos = sortedGraphElements[0]!.centroid().getX();
    for (const e of sortedGraphElements) {
      const xPos = e.centroid().getX();
      if (xPos - LudiiGameWrapper.EPSILON > currXPos) {
        ++currIdx;
        currXPos = xPos;
      }
      this.xCoords[e.index()] = currIdx;
    }

    const maxBoardIndexX = currIdx;

    // now the same, but for y indices
    sortedGraphElements.sort((o1, o2) => {
      if (o1.centroid().getY() < o2.centroid().getY()) return -1;
      else if (o1.centroid().getY() === o2.centroid().getY()) return 0;
      else return 1;
    });

    currIdx = 0;
    let currYPos = sortedGraphElements[0]!.centroid().getY();
    for (const e of sortedGraphElements) {
      const yPos = e.centroid().getY();
      if (yPos - LudiiGameWrapper.EPSILON > currYPos) {
        ++currIdx;
        currYPos = yPos;
      }
      this.yCoords[e.index()] = currIdx;
    }

    const maxBoardIndexY = currIdx;

    this.tensorDimX = maxBoardIndexX + 1;
    this.tensorDimY = maxBoardIndexY + 1;

    // Maybe need to extend the board a bit for hands / other containers
    const numContainers = this.game.numContainers();

    if (numContainers > 1) {
      let maxNonBoardContIdx = -1;
      for (let c = 1; c < numContainers; ++c) {
        maxNonBoardContIdx = Math.max(containers[c]!.numSites() - 1, maxNonBoardContIdx);
      }

      let handsAsRows = false;
      if (maxBoardIndexX < maxBoardIndexY && maxNonBoardContIdx <= maxBoardIndexX) {
        handsAsRows = true;
      } else if (maxNonBoardContIdx > maxBoardIndexX && maxBoardIndexX > maxBoardIndexY) {
        handsAsRows = true;
      }

      if (handsAsRows) {
        this.tensorDimY += 1;
        this.tensorDimY += (numContainers - 1);

        if (maxNonBoardContIdx > maxBoardIndexX) {
          this.tensorDimX += (maxNonBoardContIdx - maxBoardIndexX);
        }

        let nextContStartIdx = numBoardSites;

        for (let c = 1; c < numContainers; ++c) {
          const cont = containers[c]!;

          for (let site = 0; site < cont.numSites(); ++site) {
            this.xCoords[site + nextContStartIdx] = site;
            this.yCoords[site + nextContStartIdx] = maxBoardIndexY + 1 + c;
          }

          nextContStartIdx += cont.numSites();
        }
      } else {
        this.tensorDimX += 1;
        this.tensorDimX += (numContainers - 1);

        if (maxNonBoardContIdx > maxBoardIndexY) {
          this.tensorDimY += (maxNonBoardContIdx - maxBoardIndexY);
        }

        for (let c = 1; c < numContainers; ++c) {
          const cont = containers[c]!;
          let nextContStartIdx = numBoardSites;

          for (let site = 0; site < cont.numSites(); ++site) {
            this.xCoords[site + nextContStartIdx] = maxBoardIndexX + 1 + c;
            this.yCoords[site + nextContStartIdx] = site;
          }

          nextContStartIdx += cont.numSites();
        }
      }
    }

    const components = this.game.equipment().components();
    const numPlayers = this.game.players().count();
    const numPieceTypes = components.length - 1;
    const stacking = this.game.isStacking();
    const usesCount = this.game.requiresCount();
    const usesAmount = this.game.requiresBet();
    const usesState = this.game.requiresLocalState();
    const usesSwap = this.game.metaRules().usesSwapRule();

    const channelNames: string[] = [];

    // Number of channels required for piece types
    this.stateTensorNumChannels = stacking ? LudiiGameWrapper.NUM_STACK_CHANNELS * numPieceTypes : numPieceTypes;

    if (!stacking) {
      for (let e = 1; e <= numPieceTypes; ++e) {
        channelNames.push("Piece Type " + e + " (" + components[e]!.name() + ")");
      }
    } else {
      for (let e = 1; e <= numPieceTypes; ++e) {
        for (let i = 0; i < LudiiGameWrapper.NUM_STACK_CHANNELS / 2; ++i) {
          channelNames.push("Piece Type " + e + " (" + components[e]!.name() + ") at level " + i + " from stack bottom.");
        }

        for (let i = 0; i < LudiiGameWrapper.NUM_STACK_CHANNELS / 2; ++i) {
          channelNames.push("Piece Type " + e + " (" + components[e]!.name() + ") at level " + i + " from stack top.");
        }
      }
    }

    if (stacking) {
      this.stateTensorNumChannels += 1;
      channelNames.push("Stack sizes (non-binary channel!)");
    }

    if (usesCount) {
      this.stateTensorNumChannels += 1;
      channelNames.push("Counts (non-binary channel!)");
    }

    if (usesAmount) {
      this.stateTensorNumChannels += numPlayers;

      for (let p = 1; p <= numPlayers; ++p) {
        channelNames.push("Amount for Player " + p);
      }
    }

    if (numPlayers > 1) {
      this.stateTensorNumChannels += numPlayers;

      for (let p = 1; p <= numPlayers; ++p) {
        channelNames.push("Is Player " + p + " the current mover?");
      }
    }

    if (usesState) {
      this.stateTensorNumChannels += LudiiGameWrapper.NUM_LOCAL_STATE_CHANNELS;

      for (let i = 0; i < LudiiGameWrapper.NUM_LOCAL_STATE_CHANNELS; ++i) {
        if (i + 1 === LudiiGameWrapper.NUM_LOCAL_STATE_CHANNELS) {
          channelNames.push("Local state >= " + i);
        } else {
          channelNames.push("Local state == " + i);
        }
      }
    }

    if (usesSwap) {
      this.stateTensorNumChannels += 1;
      channelNames.push("Did Swap Occur?");
    }

    this.stateTensorNumChannels += numContainers;

    for (let c = 0; c < numContainers; ++c) {
      channelNames.push("Does position exist in container " + c + " (" + containers[c]!.name() + ")?");
    }

    this.stateTensorNumChannels += 4;

    channelNames.push("Last move's from-position");
    channelNames.push("Last move's to-position");
    channelNames.push("Second-to-last move's from-position");
    channelNames.push("Second-to-last move's to-position");

    this.stateTensorChannelNames = channelNames;

    const firstAuxilChannelIdx = this.computeFirstAuxilChannelIdx();

    if (this.game.usesVote()) {
      this.FIRST_PROPOSITION_CHANNEL_IDX = firstAuxilChannelIdx;
      this.FIRST_VOTE_CHANNEL_IDX = this.FIRST_PROPOSITION_CHANNEL_IDX + this.game.numVoteStrings();

      this.MOVE_PASS_CHANNEL_IDX = this.FIRST_VOTE_CHANNEL_IDX + this.game.numVoteStrings();
    } else {
      this.MOVE_PASS_CHANNEL_IDX = firstAuxilChannelIdx;
    }

    this.MOVE_SWAP_CHANNEL_IDX = this.MOVE_PASS_CHANNEL_IDX + 1;

    this.ALL_ONES_CHANNEL_FLAT = new Float32Array(this.tensorDimX * this.tensorDimY).fill(1.0);

    this.CONTAINER_POSITION_CHANNELS = new Float32Array(containers.length * this.tensorDimX * this.tensorDimY);
    const sitesFrom = this.game.equipment().sitesFrom();
    for (let c = 0; c < containers.length; ++c) {
      const cont = containers[c]!;
      const contStartSite = sitesFrom[c]!;

      for (let site = 0; site < cont.numSites(); ++site) {
        this.CONTAINER_POSITION_CHANNELS[
          this.yCoords[contStartSite + site]! + this.tensorDimY * (this.xCoords[contStartSite + site]! + (c * this.tensorDimX))
        ] = 1.0;
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @return First channel index for auxiliary in move-tensor-representation
   * @java LudiiGameWrapper.computeFirstAuxilChannelIdx()
   */
  private computeFirstAuxilChannelIdx(): number {
    // legal values for diff x = {-clip, ..., -2, -1, 0, 1, 2, ..., +clip}
    const numValsDiffX = 2 * this.moveTensorDistClip + 1;

    // legal values for diff y
    const numValsDiffY = numValsDiffX * (2 * this.moveTensorDistClip + 1);

    if (!this.game.isStacking()) {
      return numValsDiffY;
    } else {
      // legal values for clipped levelMin = {0, 1, 2, ..., clip} (mult with all the above)
      const numValsLevelMin = numValsDiffY * (LudiiGameWrapper.MOVE_TENSOR_LEVEL_CLIP + 1);

      // legal values for clipped levelMax - levelMin = {0, 1, 2, ..., clip} (mult with all the above)
      const numValsLevelMax = numValsLevelMin * (LudiiGameWrapper.MOVE_TENSOR_LEVEL_CLIP + 1);

      return numValsLevelMax;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Computes and returns array of indices of source channels that we should
   * transfer from, for move tensors.
   * @java LudiiGameWrapper.moveTensorSourceChannels(LudiiGameWrapper)
   */
  public moveTensorSourceChannels(sourceGame: LudiiGameWrapper): number[] {
    const sourceChannelIndices: number[] = new Array(this.moveTensorsShape()[0]);

    for (let targetChannel = 0; targetChannel < sourceChannelIndices.length; ++targetChannel) {
      if (targetChannel === this.MOVE_PASS_CHANNEL_IDX) {
        sourceChannelIndices[targetChannel] = sourceGame.MOVE_PASS_CHANNEL_IDX;
      } else if (targetChannel === this.MOVE_SWAP_CHANNEL_IDX) {
        sourceChannelIndices[targetChannel] = sourceGame.MOVE_SWAP_CHANNEL_IDX;
      } else {
        // TODO not handling stacking games yet in these cases

        if ((this.game.gameFlags() & UsesFromPositions) === BigInt(0)) {
          // Target domain is placement game
          if ((sourceGame.game.gameFlags() & UsesFromPositions) === BigInt(0)) {
            // Source domain is placement game
            sourceChannelIndices[targetChannel] = targetChannel;
          } else {
            // Source domain is movement game
            if (targetChannel !== 0) {
              throw new Error("LudiiGameWrapper::moveTensorSourceChannels() expected targetChannel == 0!");
            }

            let channelIdx = MathRoutines.clip(0, -sourceGame.moveTensorDistClip, sourceGame.moveTensorDistClip) + sourceGame.moveTensorDistClip;
            channelIdx *= (sourceGame.moveTensorDistClip * 2 + 1);
            channelIdx += MathRoutines.clip(0, -sourceGame.moveTensorDistClip, sourceGame.moveTensorDistClip) + sourceGame.moveTensorDistClip;

            sourceChannelIndices[targetChannel] = channelIdx;
          }
        } else {
          // Target domain is movement game
          if ((sourceGame.game.gameFlags() & UsesFromPositions) === BigInt(0)) {
            // Source domain is placement game
            sourceChannelIndices[targetChannel] = 0;
          } else {
            // Source domain is movement game
            sourceChannelIndices[targetChannel] = targetChannel;
          }
        }
      }
    }

    return sourceChannelIndices;
  }

  /**
   * Computes and returns array of indices of source channels that we should
   * transfer from, for state tensors.
   * @java LudiiGameWrapper.stateTensorSourceChannels(LudiiGameWrapper)
   */
  public stateTensorSourceChannels(sourceGame: LudiiGameWrapper): number[] {
    const sourceChannelNames = sourceGame.stateTensorChannelNames_get();
    const sourceChannelIndices: number[] = new Array(this.stateTensorsShape()[0]);

    const targetComps = this.game.equipment().components();
    const sourceComps = sourceGame.game.equipment().components();

    for (let targetChannel = 0; targetChannel < sourceChannelIndices.length; ++targetChannel) {
      const targetChannelName = this.stateTensorChannelNames[targetChannel]!;

      if (targetChannelName.startsWith("Piece Type ")) {
        if (targetChannelName.endsWith(" from stack bottom.") || targetChannelName.endsWith(" from stack top.")) {
          throw new Error("Stacking games not yet handled by stateTensorSourceChannels()!");
        } else {
          const pieceType = parseInt(
            targetChannelName.substring("Piece Type ".length).split(" ")[0]!
          );

          const targetPiece = targetComps[pieceType]!;
          const targetPieceName = targetPiece.name();
          const owner = targetPiece.owner();
          let bestMatch = -1;

          // First try to find a source piece with same name and same owner
          for (let i = 1; i < sourceComps.length; ++i) {
            const sourcePiece = sourceComps[i]!;
            if (sourcePiece.owner() === owner && sourcePiece.name() === targetPieceName) {
              bestMatch = i;
              break;
            }
          }

          if (bestMatch === -1) {
            // Try to find a source piece with similar ludeme tree
            const ludemeTree = LudemeTreeUtils.buildLudemeZhangShashaTree(targetPiece.generator());
            let lowestDist = Number.MAX_SAFE_INTEGER;

            for (let i = 1; i < sourceComps.length; ++i) {
              const sourcePiece = sourceComps[i]!;
              if (sourcePiece.owner() === owner) {
                const otherTree = LudemeTreeUtils.buildLudemeZhangShashaTree(sourcePiece.generator());
                const treeEditDist = Tree.ZhangShasha(ludemeTree, otherTree);

                if (treeEditDist < lowestDist) {
                  lowestDist = treeEditDist;
                  bestMatch = i;
                }
              }
            }
          }

          if (bestMatch >= 0) {
            let sourceChannelIdx = -1;
            for (let i = 0; i < sourceChannelNames.length; ++i) {
              if (sourceChannelNames[i] === ("Piece Type " + bestMatch + " (" + sourceComps[bestMatch]!.name() + ")")) {
                sourceChannelIdx = i;
                break;
              }
            }
            sourceChannelIndices[targetChannel] = sourceChannelIdx;
          } else {
            sourceChannelIndices[targetChannel] = -1;
          }
        }
      } else if (targetChannelName.startsWith("Does position exist in container ")) {
        const containerIdx = parseInt(
          targetChannelName.substring("Does position exist in container ".length).split(" ")[0]!
        );

        let idx = -1;
        for (let i = 0; i < sourceChannelNames.length; ++i) {
          const sourceChannelName = sourceChannelNames[i]!;
          if (sourceChannelName.startsWith("Does position exist in container ")) {
            const sourceContainerIdx = parseInt(
              sourceChannelName.substring("Does position exist in container ".length).split(" ")[0]!
            );

            if (containerIdx === sourceContainerIdx) {
              idx = i;
              break;
            }
          }
        }

        sourceChannelIndices[targetChannel] = idx;
      } else if (
        targetChannelName === "Stack sizes (non-binary channel!)" ||
        targetChannelName === "Counts (non-binary channel!)" ||
        targetChannelName.startsWith("Amount for Player ") ||
        (targetChannelName.startsWith("Is Player ") && targetChannelName.endsWith(" the current mover?")) ||
        targetChannelName.startsWith("Local state >= ") ||
        targetChannelName.startsWith("Local state == ") ||
        targetChannelName.startsWith("Did Swap Occur?") ||
        targetChannelName.startsWith("Last move's from-position") ||
        targetChannelName.startsWith("Last move's to-position") ||
        targetChannelName.startsWith("Second-to-last move's from-position") ||
        targetChannelName.startsWith("Second-to-last move's to-position")
      ) {
        sourceChannelIndices[targetChannel] = LudiiGameWrapper.identicalChannelIdx(targetChannelName, sourceChannelNames);
      } else {
        throw new Error("stateTensorSourceChannels() does not recognise channel name: " + targetChannelName);
      }
    }

    return sourceChannelIndices;
  }

  /**
   * @param targetChannel
   * @param sourceChannels
   * @return Index of source channel that is identical to given target channel.
   * @java LudiiGameWrapper.identicalChannelIdx(String, String[])
   */
  private static identicalChannelIdx(targetChannel: string, sourceChannels: string[]): number {
    let idx = -1;
    for (let i = 0; i < sourceChannels.length; ++i) {
      if (sourceChannels[i] === targetChannel) {
        idx = i;
        break;
      }
    }
    return idx;
  }

  //-------------------------------------------------------------------------
}
