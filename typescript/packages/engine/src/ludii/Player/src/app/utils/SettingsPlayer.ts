// @java Player/src/app/utils/SettingsPlayer.java

import { Point, Rectangle } from "../../../../awt/index.js";
import { MoveFormat } from "../move/MoveFormat.js";
import { AnimationParameters } from "../move/animation/AnimationParameters.js";
import { MoveAnimation } from "../move/animation/MoveAnimation.js";
import { AnimationVisualsType } from "./AnimationVisualsType.js";
import { PuzzleSelectionType } from "./PuzzleSelectionType.js";
import type { Component } from "../../../../../ludemes/game/equipment/component/Component.js";
import type { Move } from "../../../../../move.js";
import { SoftmaxFromMetadataSelection } from "../../../../AI/src/policies/softmax/SoftmaxFromMetadataSelection.js";

// ---------------------------------------------------------------------------
// Escape-hatch types
// ---------------------------------------------------------------------------

/**
 * javax.swing.Timer escape-hatch — represented as an opaque timer handle.
 * @java java.util.Timer
 */
type TimerHandle = ReturnType<typeof setTimeout> | null;

/** @java java.util.Timer */
class JavaTimer {
  private _handle: TimerHandle = null;
  private _scheduled: (() => void) | null = null;
  private _intervalMs: number = 0;

  // No-op constructor (java.util.Timer equivalent).
  constructor() {}

  schedule(task: () => void, delayMs: number, intervalMs: number): void {
    this._scheduled = task;
    this._intervalMs = intervalMs;
    this._handle = setTimeout(() => {
      task();
      if (intervalMs > 0) {
        this._handle = setInterval(task, intervalMs) as unknown as ReturnType<typeof setTimeout>;
      }
    }, delayMs);
  }

  cancel(): void {
    if (this._handle !== null) {
      clearTimeout(this._handle as unknown as number);
      clearInterval(this._handle as unknown as number);
      this._handle = null;
    }
  }
}

// ---------------------------------------------------------------------------

/**
 * Settings for the current player.
 *
 * Faithful 1:1 port of app.utils.SettingsPlayer.
 *
 * @author Matthew and cambolbro (Java original)
 * @java app.utils.SettingsPlayer
 */
export class SettingsPlayer {

  // ---------------------------------------------------------------------------
  // Frame positioning

  /** Default X value for placing the frame (loaded from preferences). @java SettingsPlayer#defaultX */
  private _defaultX: number = -1;

  /** Default Y value for placing the frame (loaded from preferences). @java SettingsPlayer#defaultY */
  private _defaultY: number = -1;

  /** Whether the frame should be maximised (loaded from preferences). @java SettingsPlayer#frameMaximised */
  private _frameMaximised: boolean = false;

  // ---------------------------------------------------------------------------
  // Developer settings

  /** True if the Developer cursor tooltip is to be shown. @java SettingsPlayer#cursorTooltipDev */
  private _cursorTooltipDev: boolean = false;

  // ---------------------------------------------------------------------------
  // Sound

  /** True if we should play a sound effect after each move. @java SettingsPlayer#moveSoundEffect */
  private _moveSoundEffect: boolean = false;

  // ---------------------------------------------------------------------------
  // Font sizes

  /** Font size for the text area. @java SettingsPlayer#tabFontSize */
  private _tabFontSize: number = 13;

  /** Font size for the editor. @java SettingsPlayer#editorFontSize */
  private _editorFontSize: number = 13;

  /** @java SettingsPlayer#editorParseText */
  private _editorParseText: boolean = true;

  // ---------------------------------------------------------------------------
  // Move format

  /** Format for printing moves (Move, Full, Short). @java SettingsPlayer#moveFormat */
  private _moveFormat: MoveFormat = MoveFormat.Move;

  // ---------------------------------------------------------------------------
  // Test ludemes

  /** @java SettingsPlayer#testLudeme1 */
  private _testLudeme1: string = "";
  /** @java SettingsPlayer#testLudeme2 */
  private _testLudeme2: string = "";
  /** @java SettingsPlayer#testLudeme3 */
  private _testLudeme3: string = "";
  /** @java SettingsPlayer#testLudeme4 */
  private _testLudeme4: string = "";

  // ---------------------------------------------------------------------------
  // Zoom

  /** If the zoomBox (magnifying glass) should be shown. @java SettingsPlayer#showZoomBox */
  private _showZoomBox: boolean = false;

  // ---------------------------------------------------------------------------
  // Move display

  /** If we should display moves using coord rather than index. @java SettingsPlayer#moveCoord */
  private _moveCoord: boolean = true;

  // ---------------------------------------------------------------------------
  // Board display

  /** Number of walks to increment the drag piece image by when rotating. @java SettingsPlayer#currentWalkExtra */
  private _currentWalkExtra: number = 0;

  /** Show the board. @java SettingsPlayer#showBoard */
  private _showBoard: boolean = true;

  /** Show the pieces. @java SettingsPlayer#showPieces */
  private _showPieces: boolean = true;

  /** Show the graph. @java SettingsPlayer#showGraph */
  private _showGraph: boolean = false;

  /** Show the dual. @java SettingsPlayer#showConnections */
  private _showConnections: boolean = false;

  /** Show the board axes. @java SettingsPlayer#showAxes */
  private _showAxes: boolean = false;

  // ---------------------------------------------------------------------------
  // Tab selection

  /** Tab currently selected. @java SettingsPlayer#tabSelected */
  private _tabSelected: number = 0;

  // ---------------------------------------------------------------------------
  // Web player settings

  /** Store the results of this game in the DB. @java SettingsPlayer#webGameResultValid */
  private _webGameResultValid: boolean = true;

  /** If played index has always been an agent. @java SettingsPlayer#agentArray */
  private readonly _agentArray: boolean[] = new Array(20).fill(false);

  // ---------------------------------------------------------------------------
  // MYOG / Exhibition player settings

  /** If the exhibition app is being used. @java SettingsPlayer#usingExhibitionApp */
  private _usingExhibitionApp: boolean = false;

  /** Placement of the board. @java SettingsPlayer#boardPlacement */
  private _boardPlacement: Rectangle = new Rectangle();

  /** Placement of the board white margin. @java SettingsPlayer#boardMarginPlacement */
  private _boardMarginPlacement: Rectangle = new Rectangle();

  /** @java SettingsPlayer#lastGeneratedGameEnglishRules */
  private _lastGeneratedGameEnglishRules: string = "";

  // ---------------------------------------------------------------------------
  // User settings

  /** For puzzles whether to show the dialog, cycle through, or decide automatically. @java SettingsPlayer#puzzleDialogOption */
  private _puzzleDialogOption: PuzzleSelectionType = PuzzleSelectionType.Automatic;

  /** Visualize AI's distribution over moves on the game board. @java SettingsPlayer#showAIDistribution */
  private _showAIDistribution: boolean = false;

  /** Visualize the last move made on the game board. @java SettingsPlayer#showLastMove */
  private _showLastMove: boolean = false;

  /** Visualize any ending moves made on the game board. @java SettingsPlayer#showEndingMove */
  private _showEndingMove: boolean = true;

  /** @java SettingsPlayer#swapRule */
  private _swapRule: boolean = false;

  /** @java SettingsPlayer#noRepetition */
  private _noRepetition: boolean = false;

  /** @java SettingsPlayer#noRepetitionWithinTurn */
  private _noRepetitionWithinTurn: boolean = false;

  /**
   * Hide the moves of the AI if this is a hidden information game.
   * Only applied in games where just one of the players is a human.
   * @java SettingsPlayer#hideAiMoves
   */
  private _hideAiMoves: boolean = true;

  /** If true, whenever we save a trial, we also save a CSV file with heuristic evaluations. @java SettingsPlayer#saveHeuristics */
  private _saveHeuristics: boolean = false;

  /** If true, whenever the user clicks one or two sites, we print active features for matching moves. @java SettingsPlayer#printMoveFeatures */
  private _printMoveFeatures: boolean = false;

  /** If true, whenever the user clicks one or two sites, we print active feature instances for matching moves. @java SettingsPlayer#printMoveFeatureInstances */
  private _printMoveFeatureInstances: boolean = false;

  /** Object we can use to compute active features for printing purposes. @java SettingsPlayer#featurePrintingSoftmax */
  private readonly _featurePrintingSoftmax: SoftmaxFromMetadataSelection =
    new SoftmaxFromMetadataSelection(0.0);

  /** @java SettingsPlayer#devMode */
  private _devMode: boolean = false;

  /** @java SettingsPlayer#animationType */
  private _animationType: AnimationVisualsType = AnimationVisualsType.None;

  /** Shows the name of the phase in the frame title. @java SettingsPlayer#showPhaseInTitle */
  private _showPhaseInTitle: boolean = false;

  // ---------------------------------------------------------------------------
  // Editor settings

  /** Whether the editor should show possible autocomplete options. @java SettingsPlayer#editorAutocomplete */
  private _editorAutocomplete: boolean = true;

  // ---------------------------------------------------------------------------
  // Animation settings

  /** @java SettingsPlayer#animationParameters */
  private _animationParameters: AnimationParameters | null = null;

  /**
   * Timer object used for animating moves.
   * @java SettingsPlayer#animationTimer — java.util.Timer escape-hatch.
   */
  private _animationTimer: JavaTimer = new JavaTimer();

  /** The number of frames still to go for the current animation. @java SettingsPlayer#drawingMovingPieceTime */
  private _drawingMovingPieceTime: number = MoveAnimation.MOVE_PIECE_FRAMES;

  // ---------------------------------------------------------------------------
  // Drag state

  /** Component currently being dragged. @java SettingsPlayer#dragComponent */
  private _dragComponent: Component | null = null;

  /** State of the dragged component. @java SettingsPlayer#dragComponentState */
  private _dragComponentState: number = 1;

  /** Original mouse position at the start of the drag. @java SettingsPlayer#oldMousePoint */
  private _oldMousePoint: Point = new Point(0, 0);

  /** If a component is currently selected. @java SettingsPlayer#componentIsSelected */
  private _componentIsSelected: boolean = false;

  // ---------------------------------------------------------------------------
  // Tutorial visualisation

  /** @java SettingsPlayer#performingTutorialVisualisation */
  private _performingTutorialVisualisation: boolean = false;

  /** Only used for tutorial generation purposes. @java SettingsPlayer#tutorialVisualisationMoves */
  private _tutorialVisualisationMoves: Move[] = [];

  // ---------------------------------------------------------------------------
  // Other

  /** Whether illegal moves are allowed to be made. @java SettingsPlayer#illegalMovesValid */
  private _illegalMovesValid: boolean = false;

  /** The last error message that was reported. @java SettingsPlayer#lastErrorMessage */
  private _lastErrorMessage: string = "";

  /** If the trial should be saved after every move. @java SettingsPlayer#saveTrialAfterMove */
  private _saveTrialAfterMove: boolean = false;

  /** Whether or not the preferences have been loaded successfully. @java SettingsPlayer#preferencesLoaded */
  private _preferencesLoaded: boolean = false;

  /** Most recent games that have been loaded, used for menu option. @java SettingsPlayer#recentGames */
  private _recentGames: (string | null)[] = new Array(10).fill(null);

  /** If the last game was loaded from memory. @java SettingsPlayer#loadedFromMemory */
  private _loadedFromMemory: boolean = false;

  /** @java SettingsPlayer#savedStatusTabString */
  private _savedStatusTabString: string = "";

  /** @java SettingsPlayer#sandboxMode */
  private _sandboxMode: boolean = false;

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /** @java SettingsPlayer#isMoveCoord() */
  public isMoveCoord(): boolean { return this._moveCoord; }
  /** @java SettingsPlayer#setMoveCoord(boolean) */
  public setMoveCoord(moveCoord: boolean): void { this._moveCoord = moveCoord; }

  /** @java SettingsPlayer#defaultX() */
  public defaultX(): number { return this._defaultX; }
  /** @java SettingsPlayer#setDefaultX(int) */
  public setDefaultX(x: number): void { this._defaultX = x; }

  /** @java SettingsPlayer#defaultY() */
  public defaultY(): number { return this._defaultY; }
  /** @java SettingsPlayer#setDefaultY(int) */
  public setDefaultY(y: number): void { this._defaultY = y; }

  /** @java SettingsPlayer#frameMaximised() */
  public frameMaximised(): boolean { return this._frameMaximised; }
  /** @java SettingsPlayer#setFrameMaximised(boolean) */
  public setFrameMaximised(max: boolean): void { this._frameMaximised = max; }

  /** @java SettingsPlayer#cursorTooltipDev() */
  public cursorTooltipDev(): boolean { return this._cursorTooltipDev; }
  /** @java SettingsPlayer#setCursorTooltipDev(boolean) */
  public setCursorTooltipDev(value: boolean): void { this._cursorTooltipDev = value; }

  /** @java SettingsPlayer#tabFontSize() */
  public tabFontSize(): number { return this._tabFontSize; }
  /** @java SettingsPlayer#setTabFontSize(int) */
  public setTabFontSize(size: number): void { this._tabFontSize = size; }

  /** @java SettingsPlayer#editorFontSize() */
  public editorFontSize(): number { return this._editorFontSize; }
  /** @java SettingsPlayer#setEditorFontSize(int) */
  public setEditorFontSize(size: number): void { this._editorFontSize = size; }

  /** @java SettingsPlayer#moveFormat() */
  public moveFormat(): MoveFormat { return this._moveFormat; }
  /** @java SettingsPlayer#setMoveFormat(MoveFormat) */
  public setMoveFormat(format: MoveFormat): void { this._moveFormat = format; }

  /** @java SettingsPlayer#testLudeme1() */
  public testLudeme1(): string { return this._testLudeme1; }
  /** @java SettingsPlayer#setTestLudeme1(String) */
  public setTestLudeme1(test1: string): void { this._testLudeme1 = test1; }

  /** @java SettingsPlayer#testLudeme2() */
  public testLudeme2(): string { return this._testLudeme2; }
  /** @java SettingsPlayer#setTestLudeme2(String) */
  public setTestLudeme2(test2: string): void { this._testLudeme2 = test2; }

  /** @java SettingsPlayer#testLudeme3() */
  public testLudeme3(): string { return this._testLudeme3; }
  /** @java SettingsPlayer#setTestLudeme3(String) */
  public setTestLudeme3(test3: string): void { this._testLudeme3 = test3; }

  /** @java SettingsPlayer#testLudeme4() */
  public testLudeme4(): string { return this._testLudeme4; }
  /** @java SettingsPlayer#setTestLudeme4(String) */
  public setTestLudeme4(test4: string): void { this._testLudeme4 = test4; }

  /** @java SettingsPlayer#showZoomBox() */
  public showZoomBox(): boolean { return this._showZoomBox; }
  /** @java SettingsPlayer#setShowZoomBox(boolean) */
  public setShowZoomBox(show: boolean): void { this._showZoomBox = show; }

  /** @java SettingsPlayer#currentWalkExtra() */
  public currentWalkExtra(): number { return this._currentWalkExtra; }
  /** @java SettingsPlayer#setCurrentWalkExtra(int) */
  public setCurrentWalkExtra(currentWalkExtra: number): void { this._currentWalkExtra = currentWalkExtra; }

  /** @java SettingsPlayer#showBoard() */
  public showBoard(): boolean { return this._showBoard; }
  /** @java SettingsPlayer#setShowBoard(boolean) */
  public setShowBoard(show: boolean): void { this._showBoard = show; }

  /** @java SettingsPlayer#showPieces() */
  public showPieces(): boolean { return this._showPieces; }
  /** @java SettingsPlayer#setShowPieces(boolean) */
  public setShowPieces(show: boolean): void { this._showPieces = show; }

  /** @java SettingsPlayer#showGraph() */
  public showGraph(): boolean { return this._showGraph; }
  /** @java SettingsPlayer#setShowGraph(boolean) */
  public setShowGraph(show: boolean): void { this._showGraph = show; }

  /** @java SettingsPlayer#showConnections() */
  public showConnections(): boolean { return this._showConnections; }
  /** @java SettingsPlayer#setShowConnections(boolean) */
  public setShowConnections(show: boolean): void { this._showConnections = show; }

  /** @java SettingsPlayer#showAxes() */
  public showAxes(): boolean { return this._showAxes; }
  /** @java SettingsPlayer#setShowAxes(boolean) */
  public setShowAxes(show: boolean): void { this._showAxes = show; }

  /** @java SettingsPlayer#puzzleDialogOption() */
  public puzzleDialogOption(): PuzzleSelectionType { return this._puzzleDialogOption; }
  /** @java SettingsPlayer#setPuzzleDialogOption(PuzzleSelectionType) */
  public setPuzzleDialogOption(puzzleDialogOption: PuzzleSelectionType): void {
    this._puzzleDialogOption = puzzleDialogOption;
  }

  /** @java SettingsPlayer#showAIDistribution() */
  public showAIDistribution(): boolean { return this._showAIDistribution; }
  /** @java SettingsPlayer#setShowAIDistribution(boolean) */
  public setShowAIDistribution(show: boolean): void { this._showAIDistribution = show; }

  /** @java SettingsPlayer#showLastMove() */
  public showLastMove(): boolean { return this._showLastMove; }
  /** @java SettingsPlayer#setShowLastMove(boolean) */
  public setShowLastMove(show: boolean): void { this._showLastMove = show; }

  /** @java SettingsPlayer#showEndingMove() */
  public showEndingMove(): boolean { return this._showEndingMove; }
  /** @java SettingsPlayer#setShowEndingMove(boolean) */
  public setShowEndingMove(show: boolean): void { this._showEndingMove = show; }

  /** @java SettingsPlayer#swapRule() */
  public swapRule(): boolean { return this._swapRule; }
  /** @java SettingsPlayer#setSwapRule(boolean) */
  public setSwapRule(swap: boolean): void { this._swapRule = swap; }

  /** @java SettingsPlayer#noRepetition() */
  public noRepetition(): boolean { return this._noRepetition; }
  /** @java SettingsPlayer#setNoRepetition(boolean) */
  public setNoRepetition(no: boolean): void { this._noRepetition = no; }

  /** @java SettingsPlayer#noRepetitionWithinTurn() */
  public noRepetitionWithinTurn(): boolean { return this._noRepetitionWithinTurn; }
  /** @java SettingsPlayer#setNoRepetitionWithinTurn(boolean) */
  public setNoRepetitionWithinTurn(no: boolean): void { this._noRepetitionWithinTurn = no; }

  /** @java SettingsPlayer#hideAiMoves() */
  public hideAiMoves(): boolean { return this._hideAiMoves; }
  /** @java SettingsPlayer#setHideAiMoves(boolean) */
  public setHideAiMoves(hide: boolean): void { this._hideAiMoves = hide; }

  /** @java SettingsPlayer#saveHeuristics() */
  public saveHeuristics(): boolean { return this._saveHeuristics; }
  /** @java SettingsPlayer#setSaveHeuristics(boolean) */
  public setSaveHeuristics(save: boolean): void { this._saveHeuristics = save; }

  /**
   * @java SettingsPlayer#printMoveFeatures()
   * @return Do we want to print move features?
   */
  public printMoveFeatures(): boolean { return this._printMoveFeatures; }

  /**
   * @java SettingsPlayer#printMoveFeatureInstances()
   * @return Do we want to print move feature instances?
   */
  public printMoveFeatureInstances(): boolean { return this._printMoveFeatureInstances; }

  /**
   * Sets whether we want to print move features.
   * @java SettingsPlayer#setPrintMoveFeatures(boolean)
   */
  public setPrintMoveFeatures(val: boolean): void { this._printMoveFeatures = val; }

  /**
   * Sets whether we want to print move feature instances.
   * @java SettingsPlayer#setPrintMoveFeatureInstances(boolean)
   */
  public setPrintMoveFeatureInstances(val: boolean): void { this._printMoveFeatureInstances = val; }

  /**
   * @java SettingsPlayer#featurePrintingSoftmax()
   * @return The softmax object we can use for computing features to print.
   */
  public featurePrintingSoftmax(): SoftmaxFromMetadataSelection {
    return this._featurePrintingSoftmax;
  }

  /** @java SettingsPlayer#devMode() */
  public devMode(): boolean { return this._devMode; }
  /** @java SettingsPlayer#setDevMode(boolean) */
  public setDevMode(value: boolean): void { this._devMode = value; }

  /** @java SettingsPlayer#dragComponent() */
  public dragComponent(): Component | null { return this._dragComponent; }
  /** @java SettingsPlayer#setDragComponent(Component) */
  public setDragComponent(drag: Component | null): void { this._dragComponent = drag; }

  /** @java SettingsPlayer#dragComponentState() */
  public dragComponentState(): number { return this._dragComponentState; }
  /** @java SettingsPlayer#setDragComponentState(int) */
  public setDragComponentState(drag: number): void { this._dragComponentState = drag; }

  /** @java SettingsPlayer#oldMousePoint() */
  public oldMousePoint(): Point { return this._oldMousePoint; }
  /** @java SettingsPlayer#setOldMousePoint(Point) */
  public setOldMousePoint(old: Point): void { this._oldMousePoint = old; }

  /** @java SettingsPlayer#illegalMovesValid() */
  public illegalMovesValid(): boolean { return this._illegalMovesValid; }
  /** @java SettingsPlayer#setIllegalMovesValid(boolean) */
  public setIllegalMovesValid(illegal: boolean): void { this._illegalMovesValid = illegal; }

  /** @java SettingsPlayer#lastErrorMessage() */
  public lastErrorMessage(): string { return this._lastErrorMessage; }
  /** @java SettingsPlayer#setLastErrorMessage(String) */
  public setLastErrorMessage(last: string): void { this._lastErrorMessage = last; }

  /** @java SettingsPlayer#editorAutocomplete() */
  public editorAutocomplete(): boolean { return this._editorAutocomplete; }
  /** @java SettingsPlayer#setEditorAutocomplete(boolean) */
  public setEditorAutocomplete(editor: boolean): void { this._editorAutocomplete = editor; }

  /** @java SettingsPlayer#componentIsSelected() */
  public componentIsSelected(): boolean { return this._componentIsSelected; }
  /** @java SettingsPlayer#setComponentIsSelected(boolean) */
  public setComponentIsSelected(componentIsSelected: boolean): void {
    this._componentIsSelected = componentIsSelected;
  }

  /** @java SettingsPlayer#isMoveSoundEffect() */
  public isMoveSoundEffect(): boolean { return this._moveSoundEffect; }
  /** @java SettingsPlayer#setMoveSoundEffect(boolean) */
  public setMoveSoundEffect(moveSoundEffect: boolean): void { this._moveSoundEffect = moveSoundEffect; }

  /** @java SettingsPlayer#animationType() */
  public animationType(): AnimationVisualsType { return this._animationType; }
  /** @java SettingsPlayer#setAnimationType(AnimationVisualsType) */
  public setAnimationType(animationType: AnimationVisualsType): void { this._animationType = animationType; }

  /**
   * @java SettingsPlayer#showAnimation()
   */
  public showAnimation(): boolean {
    return this._animationType !== AnimationVisualsType.None;
  }

  /**
   * @java SettingsPlayer#getAnimationTimer()
   */
  public getAnimationTimer(): JavaTimer { return this._animationTimer; }
  /** @java SettingsPlayer#setAnimationTimer(Timer) */
  public setAnimationTimer(animationTimer: JavaTimer): void { this._animationTimer = animationTimer; }

  /** @java SettingsPlayer#getDrawingMovingPieceTime() */
  public getDrawingMovingPieceTime(): number { return this._drawingMovingPieceTime; }
  /** @java SettingsPlayer#setDrawingMovingPieceTime(int) */
  public setDrawingMovingPieceTime(drawingMovingPieceTime: number): void {
    this._drawingMovingPieceTime = drawingMovingPieceTime;
  }

  /** @java SettingsPlayer#saveTrialAfterMove() */
  public saveTrialAfterMove(): boolean { return this._saveTrialAfterMove; }
  /** @java SettingsPlayer#setSaveTrialAfterMove(boolean) */
  public setSaveTrialAfterMove(saveTrialAfterMove: boolean): void {
    this._saveTrialAfterMove = saveTrialAfterMove;
  }

  /** @java SettingsPlayer#preferencesLoaded() */
  public preferencesLoaded(): boolean { return this._preferencesLoaded; }
  /** @java SettingsPlayer#setPreferencesLoaded(boolean) */
  public setPreferencesLoaded(preferencesLoaded: boolean): void {
    this._preferencesLoaded = preferencesLoaded;
  }

  /** @java SettingsPlayer#recentGames() */
  public recentGames(): (string | null)[] { return this._recentGames; }
  /** @java SettingsPlayer#setRecentGames(String[]) */
  public setRecentGames(recentGames: (string | null)[]): void { this._recentGames = recentGames; }

  /** @java SettingsPlayer#loadedFromMemory() */
  public loadedFromMemory(): boolean { return this._loadedFromMemory; }
  /** @java SettingsPlayer#setLoadedFromMemory(boolean) */
  public setLoadedFromMemory(loadedFromMemory: boolean): void {
    this._loadedFromMemory = loadedFromMemory;
  }

  /** @java SettingsPlayer#savedStatusTabString() */
  public savedStatusTabString(): string { return this._savedStatusTabString; }
  /** @java SettingsPlayer#setSavedStatusTabString(String) */
  public setSavedStatusTabString(savedStatusTabString: string): void {
    this._savedStatusTabString = savedStatusTabString;
  }

  /** @java SettingsPlayer#animationParameters() */
  public animationParameters(): AnimationParameters | null { return this._animationParameters; }
  /** @java SettingsPlayer#setAnimationParameters(AnimationParameters) */
  public setAnimationParameters(animationParameters: AnimationParameters | null): void {
    this._animationParameters = animationParameters;
  }

  /** @java SettingsPlayer#tabSelected() */
  public tabSelected(): number { return this._tabSelected; }
  /** @java SettingsPlayer#setTabSelected(int) */
  public setTabSelected(tabSelected: number): void { this._tabSelected = tabSelected; }

  /** @java SettingsPlayer#sandboxMode() */
  public sandboxMode(): boolean { return this._sandboxMode; }
  /** @java SettingsPlayer#setSandboxMode(boolean) */
  public setSandboxMode(sandboxMode: boolean): void { this._sandboxMode = sandboxMode; }

  /** @java SettingsPlayer#isPerformingTutorialVisualisation() */
  public isPerformingTutorialVisualisation(): boolean { return this._performingTutorialVisualisation; }
  /** @java SettingsPlayer#setPerformingTutorialVisualisation(boolean) */
  public setPerformingTutorialVisualisation(performingTutorialVisualisation: boolean): void {
    this._performingTutorialVisualisation = performingTutorialVisualisation;
  }

  /** @java SettingsPlayer#tutorialVisualisationMoves() */
  public tutorialVisualisationMoves(): Move[] { return this._tutorialVisualisationMoves; }
  /** @java SettingsPlayer#setTutorialVisualisationMoves(List) */
  public setTutorialVisualisationMoves(tutorialVisualisationMoves: Move[]): void {
    this._tutorialVisualisationMoves = tutorialVisualisationMoves;
  }

  /** @java SettingsPlayer#showPhaseInTitle() */
  public showPhaseInTitle(): boolean { return this._showPhaseInTitle; }
  /** @java SettingsPlayer#setShowPhaseInTitle(boolean) */
  public setShowPhaseInTitle(showPhaseInTitle: boolean): void {
    this._showPhaseInTitle = showPhaseInTitle;
  }

  /** @java SettingsPlayer#isEditorParseText() */
  public isEditorParseText(): boolean { return this._editorParseText; }
  /** @java SettingsPlayer#setEditorParseText(boolean) */
  public setEditorParseText(editorParseText: boolean): void { this._editorParseText = editorParseText; }

  /** @java SettingsPlayer#agentArray() */
  public agentArray(): boolean[] { return this._agentArray; }
  /** @java SettingsPlayer#setAgentArray(int, boolean) */
  public setAgentArray(i: number, b: boolean): void { this._agentArray[i] = b; }

  /** @java SettingsPlayer#isWebGameResultValid() */
  public isWebGameResultValid(): boolean { return this._webGameResultValid; }
  /** @java SettingsPlayer#setWebGameResultValid(boolean) */
  public setWebGameResultValid(webGameResultValid: boolean): void {
    this._webGameResultValid = webGameResultValid;
  }

  /** @java SettingsPlayer#usingMYOGApp() */
  public usingMYOGApp(): boolean { return this._usingExhibitionApp; }
  /** @java SettingsPlayer#setUsingExhibitionApp(boolean) */
  public setUsingExhibitionApp(usingExhibitionApp: boolean): void {
    this._usingExhibitionApp = usingExhibitionApp;
  }

  /** @java SettingsPlayer#boardPlacement() */
  public boardPlacement(): Rectangle { return this._boardPlacement; }
  /** @java SettingsPlayer#setBoardPlacement(Rectangle) */
  public setBoardPlacement(boardPlacement: Rectangle): void { this._boardPlacement = boardPlacement; }

  /** @java SettingsPlayer#boardMarginPlacement() */
  public boardMarginPlacement(): Rectangle { return this._boardMarginPlacement; }
  /** @java SettingsPlayer#setBoardMarginPlacement(Rectangle) */
  public setBoardMarginPlacement(boardMarginPlacement: Rectangle): void {
    this._boardMarginPlacement = boardMarginPlacement;
  }

  /** @java SettingsPlayer#lastGeneratedGameEnglishRules() */
  public lastGeneratedGameEnglishRules(): string { return this._lastGeneratedGameEnglishRules; }
  /** @java SettingsPlayer#setLastGeneratedGameEnglishRules(String) */
  public setLastGeneratedGameEnglishRules(lastGeneratedGameEnglishRules: string): void {
    this._lastGeneratedGameEnglishRules = lastGeneratedGameEnglishRules;
  }

  // ---------------------------------------------------------------------------
}
