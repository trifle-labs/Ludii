// @java ViewController/src/util/SettingsVC.java

/**
 * User settings specific to the ViewController.
 *
 * Faithful 1:1 port of util.SettingsVC.
 *
 * @author matthew.stephenson and cambolbro and Eric.Piette (Java original)
 * @java util.SettingsVC
 */

import type { Font } from '../../../awt/index.js';
import { FullLocation } from '../../../../ludemes/other/location/FullLocation.js';
import type { Location } from '../../../../ludemes/other/location/Location.js';
import type { Action } from '../../../../ludemes/other/action/Action.js';

/** @java main.Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

// ---------------------------------------------------------------------------
// Minimal Move interface for animationMove field
// @java other.move.Move
// ---------------------------------------------------------------------------

/** Minimal Move-like interface (other.move.Move subset used by SettingsVC). */
export interface IMove {
  getFromLocation(): Location;
  getToLocation(): Location;
}

/** Minimal Move constructor for new Move(new ArrayList<Action>()). */
class EmptyMove implements IMove {
  private readonly _actions: Action[];
  constructor(actions: Action[] = []) {
    this._actions = actions;
  }
  getFromLocation(): Location { return new FullLocation(UNDEFINED); }
  getToLocation(): Location { return new FullLocation(UNDEFINED); }
  actions(): Action[] { return this._actions; }
}

// ---------------------------------------------------------------------------

/**
 * User settings specific to the ViewController.
 * @java util.SettingsVC
 */
export class SettingsVC {

  // -------------------------------------------------------------------------
  // User settings

  /** Show indices of every cell. @java SettingsVC#showCellIndices */
  private _showCellIndices = false;

  /** Show indices of every edge. @java SettingsVC#showEdgeIndices */
  private _showEdgeIndices = false;

  /** Show indices of every vertex. @java SettingsVC#showVertexIndices */
  private _showVertexIndices = false;

  /** Show indices of every container. @java SettingsVC#showContainerIndices */
  private _showContainerIndices = false;

  /** Show coordinates of every cell. @java SettingsVC#showCellCoordinates */
  private _showCellCoordinates = false;

  /** Show coordinates of every edge. @java SettingsVC#showEdgeCoordinates */
  private _showEdgeCoordinates = false;

  /** Show coordinates of every vertex. @java SettingsVC#showVertexCoordinates */
  private _showVertexCoordinates = false;

  /** Show indices of every relevant graph element for this game. @java SettingsVC#showIndices */
  private _showIndices = false;

  /** Show coordinates of every relevant graph element for this game. @java SettingsVC#showCoordinates */
  private _showCoordinates = false;

  /** Whether to show all possible moves that the player can select. @java SettingsVC#showPossibleMoves */
  private _showPossibleMoves = false;

  /** Whether to display certain tracks. @java SettingsVC#trackNames */
  private _trackNames: string[] = [];
  private _trackShown: boolean[] = [];

  /** The location that is currently selected by the user. @java SettingsVC#selectedFromLocation */
  private _selectedFromLocation: Location = new FullLocation(UNDEFINED);

  /** Extension text to add onto the end of piece names when searching for the correct SVG image. @java SettingsVC#pieceStyleExtension */
  private _pieceStyleExtension = '';

  /** Font used when displaying text. @java SettingsVC#displayFont */
  private _displayFont: Font | null = null;

  /** Whether the board should be drawn flat. @java SettingsVC#flatBoard */
  private _flatBoard = false;

  // -------------------------------------------------------------------------
  // Developer pre-generation display settings

  private _drawCornerCells = false;
  private _drawCornerConcaveCells = false;
  private _drawCornerConvexCells = false;
  private _drawMajorCells = false;
  private _drawMinorCells = false;
  private _drawOuterCells = false;
  private _drawPerimeterCells = false;
  private _drawInnerCells = false;
  private _drawTopCells = false;
  private _drawBottomCells = false;
  private _drawLeftCells = false;
  private _drawRightCells = false;
  private _drawCenterCells = false;
  private _drawPhasesCells = false;
  private _drawSideCells: Map<string, boolean> = new Map<string, boolean>();
  private _drawNeighboursCells = false;
  private _drawRadialsCells = false;
  private _drawDistanceCells = false;

  private _drawCornerVertices = false;
  private _drawCornerConcaveVertices = false;
  private _drawCornerConvexVertices = false;
  private _drawMajorVertices = false;
  private _drawMinorVertices = false;
  private _drawOuterVertices = false;
  private _drawPerimeterVertices = false;
  private _drawInnerVertices = false;
  private _drawTopVertices = false;
  private _drawBottomVertices = false;
  private _drawLeftVertices = false;
  private _drawRightVertices = false;
  private _drawCenterVertices = false;
  private _drawPhasesVertices = false;
  private _drawSideVertices: Map<string, boolean> = new Map<string, boolean>();
  private _drawNeighboursVertices = false;
  private _drawRadialsVertices = false;
  private _drawDistanceVertices = false;

  private _drawCentreEdges = false;
  private _drawCornerEdges = false;
  private _drawCornerConcaveEdges = false;
  private _drawCornerConvexEdges = false;
  private _drawMajorEdges = false;
  private _drawMinorEdges = false;
  private _drawOuterEdges = false;
  private _drawPerimeterEdges = false;
  private _drawInnerEdges = false;
  private _drawTopEdges = false;
  private _drawBottomEdges = false;
  private _drawLeftEdges = false;
  private _drawRightEdges = false;
  private _drawDistanceEdges = false;
  private _drawPhasesEdges = false;
  private _drawSideEdges: Map<string, boolean> = new Map<string, boolean>();
  private _drawAxialEdges = false;
  private _drawHorizontalEdges = false;
  private _drawVerticalEdges = false;
  private _drawAngledEdges = false;
  private _drawSlashEdges = false;
  private _drawSloshEdges = false;

  private _drawFacesOfVertices = false;
  private _drawEdgesOfVertices = false;
  private _drawVerticesOfFaces = false;
  private _drawEdgesOfFaces = false;
  private _drawVerticesOfEdges = false;
  private _drawFacesOfEdges = false;

  private _lastClickedSite: Location = new FullLocation(UNDEFINED);

  private _drawColumnsCells: boolean[] = [];
  private _drawRowsCells: boolean[] = [];
  private _drawColumnsVertices: boolean[] = [];
  private _drawRowsVertices: boolean[] = [];

  // -------------------------------------------------------------------------
  // Variables used for multiple consequence selection.

  /** If the user is currently selecting a possible consequence to the prior move. */
  private _selectingConsequenceMove = false;

  /** List of possible consequence locations. */
  private _possibleConsequenceLocations: Location[] = [];

  // -------------------------------------------------------------------------
  // Animation

  /** If the animation for the current Frame has already started. */
  private _thisFrameIsAnimated = false;

  /** If all movement animation is disabled for the current game. */
  private _noAnimation = false;

  /** From index for the animation. */
  private _animationMove: IMove = new EmptyMove();

  // -------------------------------------------------------------------------
  // Other

  /** If a piece is being dragged. */
  private _pieceBeingDragged = false;

  /** Whether to show candidate values on puzzle boards. */
  private _showCandidateValues = false;

  /** The last error message that was reported. */
  private _lastErrorMessage = '';

  /** If the coordinates/indices should be drawn with a white outline. */
  private _coordWithOutline = false;

  /** Errors that were recorded when rendering or painting some VC aspect. */
  private _errorReport = '';

  /** Map of all piece families for displaying different piece styles, e.g. Chess. */
  private _pieceFamilies: Map<string, string> = new Map<string, string>();

  /** Multiplier, applied to cell radius, for determining minimal click distance. */
  private _furthestDistanceMultiplier = 0.9;

  // -------------------------------------------------------------------------
  // Getters and setters

  /** @java SettingsVC#showCellIndices() */
  showCellIndices(): boolean { return this._showCellIndices; }
  /** @java SettingsVC#setShowCellIndices(boolean) */
  setShowCellIndices(v: boolean): void { this._showCellIndices = v; }

  /** @java SettingsVC#showEdgeIndices() */
  showEdgeIndices(): boolean { return this._showEdgeIndices; }
  /** @java SettingsVC#setShowEdgeIndices(boolean) */
  setShowEdgeIndices(v: boolean): void { this._showEdgeIndices = v; }

  /** @java SettingsVC#showVertexIndices() */
  showVertexIndices(): boolean { return this._showVertexIndices; }
  /** @java SettingsVC#setShowVertexIndices(boolean) */
  setShowVertexIndices(v: boolean): void { this._showVertexIndices = v; }

  /** @java SettingsVC#showContainerIndices() */
  showContainerIndices(): boolean { return this._showContainerIndices; }
  /** @java SettingsVC#setShowContainerIndices(boolean) */
  setShowContainerIndices(v: boolean): void { this._showContainerIndices = v; }

  /** @java SettingsVC#showCellCoordinates() */
  showCellCoordinates(): boolean { return this._showCellCoordinates; }
  /** @java SettingsVC#setShowCellCoordinates(boolean) */
  setShowCellCoordinates(v: boolean): void { this._showCellCoordinates = v; }

  /** @java SettingsVC#showEdgeCoordinates() */
  showEdgeCoordinates(): boolean { return this._showEdgeCoordinates; }
  /** @java SettingsVC#setShowEdgeCoordinates(boolean) */
  setShowEdgeCoordinates(v: boolean): void { this._showEdgeCoordinates = v; }

  /** @java SettingsVC#showVertexCoordinates() */
  showVertexCoordinates(): boolean { return this._showVertexCoordinates; }
  /** @java SettingsVC#setShowVertexCoordinates(boolean) */
  setShowVertexCoordinates(v: boolean): void { this._showVertexCoordinates = v; }

  /** @java SettingsVC#showIndices() */
  showIndices(): boolean { return this._showIndices; }
  /** @java SettingsVC#setShowIndices(boolean) */
  setShowIndices(v: boolean): void { this._showIndices = v; }

  /** @java SettingsVC#showCoordinates() */
  showCoordinates(): boolean { return this._showCoordinates; }
  /** @java SettingsVC#setShowCoordinates(boolean) */
  setShowCoordinates(v: boolean): void { this._showCoordinates = v; }

  /** @java SettingsVC#showPossibleMoves() */
  showPossibleMoves(): boolean { return this._showPossibleMoves; }
  /** @java SettingsVC#setShowPossibleMoves(boolean) */
  setShowPossibleMoves(v: boolean): void { this._showPossibleMoves = v; }

  /** @java SettingsVC#trackNames() */
  trackNames(): string[] { return this._trackNames; }
  /** @java SettingsVC#setTrackNames(ArrayList) */
  setTrackNames(v: string[]): void { this._trackNames = v; }

  /** @java SettingsVC#trackShown() */
  trackShown(): boolean[] { return this._trackShown; }
  /** @java SettingsVC#setTrackShown(ArrayList) */
  setTrackShown(v: boolean[]): void { this._trackShown = v; }

  /** @java SettingsVC#selectedFromLocation() */
  selectedFromLocation(): Location { return this._selectedFromLocation; }
  /** @java SettingsVC#setSelectedFromLocation(Location) */
  setSelectedFromLocation(v: Location): void { this._selectedFromLocation = v; }

  /** @java SettingsVC#pieceStyleExtension() */
  pieceStyleExtension(): string { return this._pieceStyleExtension; }
  /** @java SettingsVC#setPieceStyleExtension(String) */
  setPieceStyleExtension(v: string): void { this._pieceStyleExtension = v; }

  /** @java SettingsVC#displayFont() */
  displayFont(): Font | null { return this._displayFont; }
  /** @java SettingsVC#setDisplayFont(Font) */
  setDisplayFont(v: Font | null): void { this._displayFont = v; }

  /** @java SettingsVC#flatBoard() */
  flatBoard(): boolean { return this._flatBoard; }
  /** @java SettingsVC#setFlatBoard(boolean) */
  setFlatBoard(v: boolean): void { this._flatBoard = v; }

  // ---- Cell developer settings ----

  drawCornerCells(): boolean { return this._drawCornerCells; }
  setDrawCornerCells(v: boolean): void { this._drawCornerCells = v; }

  drawCornerConcaveCells(): boolean { return this._drawCornerConcaveCells; }
  setDrawCornerConcaveCells(v: boolean): void { this._drawCornerConcaveCells = v; }

  drawCornerConvexCells(): boolean { return this._drawCornerConvexCells; }
  setDrawCornerConvexCells(v: boolean): void { this._drawCornerConvexCells = v; }

  drawMajorCells(): boolean { return this._drawMajorCells; }
  setDrawMajorCells(v: boolean): void { this._drawMajorCells = v; }

  drawMinorCells(): boolean { return this._drawMinorCells; }
  setDrawMinorCells(v: boolean): void { this._drawMinorCells = v; }

  drawOuterCells(): boolean { return this._drawOuterCells; }
  setDrawOuterCells(v: boolean): void { this._drawOuterCells = v; }

  drawPerimeterCells(): boolean { return this._drawPerimeterCells; }
  setDrawPerimeterCells(v: boolean): void { this._drawPerimeterCells = v; }

  drawInnerCells(): boolean { return this._drawInnerCells; }
  setDrawInnerCells(v: boolean): void { this._drawInnerCells = v; }

  drawTopCells(): boolean { return this._drawTopCells; }
  setDrawTopCells(v: boolean): void { this._drawTopCells = v; }

  drawBottomCells(): boolean { return this._drawBottomCells; }
  setDrawBottomCells(v: boolean): void { this._drawBottomCells = v; }

  drawLeftCells(): boolean { return this._drawLeftCells; }
  setDrawLeftCells(v: boolean): void { this._drawLeftCells = v; }

  drawRightCells(): boolean { return this._drawRightCells; }
  setDrawRightCells(v: boolean): void { this._drawRightCells = v; }

  drawCenterCells(): boolean { return this._drawCenterCells; }
  setDrawCenterCells(v: boolean): void { this._drawCenterCells = v; }

  drawPhasesCells(): boolean { return this._drawPhasesCells; }
  setDrawPhasesCells(v: boolean): void { this._drawPhasesCells = v; }

  drawSideCells(): Map<string, boolean> { return this._drawSideCells; }
  setDrawSideCells(v: Map<string, boolean>): void { this._drawSideCells = v; }

  drawNeighboursCells(): boolean { return this._drawNeighboursCells; }
  setDrawNeighboursCells(v: boolean): void { this._drawNeighboursCells = v; }

  drawRadialsCells(): boolean { return this._drawRadialsCells; }
  setDrawRadialsCells(v: boolean): void { this._drawRadialsCells = v; }

  drawDistanceCells(): boolean { return this._drawDistanceCells; }
  setDrawDistanceCells(v: boolean): void { this._drawDistanceCells = v; }

  // ---- Vertex developer settings ----

  drawCornerVertices(): boolean { return this._drawCornerVertices; }
  setDrawCornerVertices(v: boolean): void { this._drawCornerVertices = v; }

  drawCornerConcaveVertices(): boolean { return this._drawCornerConcaveVertices; }
  setDrawCornerConcaveVertices(v: boolean): void { this._drawCornerConcaveVertices = v; }

  drawCornerConvexVertices(): boolean { return this._drawCornerConvexVertices; }
  setDrawCornerConvexVertices(v: boolean): void { this._drawCornerConvexVertices = v; }

  drawMajorVertices(): boolean { return this._drawMajorVertices; }
  setDrawMajorVertices(v: boolean): void { this._drawMajorVertices = v; }

  drawMinorVertices(): boolean { return this._drawMinorVertices; }
  setDrawMinorVertices(v: boolean): void { this._drawMinorVertices = v; }

  drawOuterVertices(): boolean { return this._drawOuterVertices; }
  setDrawOuterVertices(v: boolean): void { this._drawOuterVertices = v; }

  drawPerimeterVertices(): boolean { return this._drawPerimeterVertices; }
  setDrawPerimeterVertices(v: boolean): void { this._drawPerimeterVertices = v; }

  drawInnerVertices(): boolean { return this._drawInnerVertices; }
  setDrawInnerVertices(v: boolean): void { this._drawInnerVertices = v; }

  drawTopVertices(): boolean { return this._drawTopVertices; }
  setDrawTopVertices(v: boolean): void { this._drawTopVertices = v; }

  drawBottomVertices(): boolean { return this._drawBottomVertices; }
  setDrawBottomVertices(v: boolean): void { this._drawBottomVertices = v; }

  drawLeftVertices(): boolean { return this._drawLeftVertices; }
  setDrawLeftVertices(v: boolean): void { this._drawLeftVertices = v; }

  drawRightVertices(): boolean { return this._drawRightVertices; }
  setDrawRightVertices(v: boolean): void { this._drawRightVertices = v; }

  drawCenterVertices(): boolean { return this._drawCenterVertices; }
  setDrawCenterVertices(v: boolean): void { this._drawCenterVertices = v; }

  drawPhasesVertices(): boolean { return this._drawPhasesVertices; }
  setDrawPhasesVertices(v: boolean): void { this._drawPhasesVertices = v; }

  drawSideVertices(): Map<string, boolean> { return this._drawSideVertices; }
  setDrawSideVertices(v: Map<string, boolean>): void { this._drawSideVertices = v; }

  drawNeighboursVertices(): boolean { return this._drawNeighboursVertices; }
  setDrawNeighboursVertices(v: boolean): void { this._drawNeighboursVertices = v; }

  drawRadialsVertices(): boolean { return this._drawRadialsVertices; }
  setDrawRadialsVertices(v: boolean): void { this._drawRadialsVertices = v; }

  drawDistanceVertices(): boolean { return this._drawDistanceVertices; }
  setDrawDistanceVertices(v: boolean): void { this._drawDistanceVertices = v; }

  // ---- Edge developer settings ----

  drawCentreEdges(): boolean { return this._drawCentreEdges; }
  setDrawCentreEdges(v: boolean): void { this._drawCentreEdges = v; }

  drawCornerEdges(): boolean { return this._drawCornerEdges; }
  setDrawCornerEdges(v: boolean): void { this._drawCornerEdges = v; }

  drawCornerConcaveEdges(): boolean { return this._drawCornerConcaveEdges; }
  setDrawCornerConcaveEdges(v: boolean): void { this._drawCornerConcaveEdges = v; }

  drawCornerConvexEdges(): boolean { return this._drawCornerConvexEdges; }
  setDrawCornerConvexEdges(v: boolean): void { this._drawCornerConvexEdges = v; }

  drawMajorEdges(): boolean { return this._drawMajorEdges; }
  setDrawMajorEdges(v: boolean): void { this._drawMajorEdges = v; }

  drawMinorEdges(): boolean { return this._drawMinorEdges; }
  setDrawMinorEdges(v: boolean): void { this._drawMinorEdges = v; }

  drawOuterEdges(): boolean { return this._drawOuterEdges; }
  setDrawOuterEdges(v: boolean): void { this._drawOuterEdges = v; }

  drawPerimeterEdges(): boolean { return this._drawPerimeterEdges; }
  setDrawPerimeterEdges(v: boolean): void { this._drawPerimeterEdges = v; }

  drawInnerEdges(): boolean { return this._drawInnerEdges; }
  setDrawInnerEdges(v: boolean): void { this._drawInnerEdges = v; }

  drawTopEdges(): boolean { return this._drawTopEdges; }
  setDrawTopEdges(v: boolean): void { this._drawTopEdges = v; }

  drawBottomEdges(): boolean { return this._drawBottomEdges; }
  setDrawBottomEdges(v: boolean): void { this._drawBottomEdges = v; }

  drawLeftEdges(): boolean { return this._drawLeftEdges; }
  setDrawLeftEdges(v: boolean): void { this._drawLeftEdges = v; }

  drawRightEdges(): boolean { return this._drawRightEdges; }
  setDrawRightEdges(v: boolean): void { this._drawRightEdges = v; }

  drawDistanceEdges(): boolean { return this._drawDistanceEdges; }
  setDrawDistanceEdges(v: boolean): void { this._drawDistanceEdges = v; }

  drawPhasesEdges(): boolean { return this._drawPhasesEdges; }
  setDrawPhasesEdges(v: boolean): void { this._drawPhasesEdges = v; }

  drawSideEdges(): Map<string, boolean> { return this._drawSideEdges; }
  setDrawSideEdges(v: Map<string, boolean>): void { this._drawSideEdges = v; }

  drawAxialEdges(): boolean { return this._drawAxialEdges; }
  setDrawAxialEdges(v: boolean): void { this._drawAxialEdges = v; }

  drawHorizontalEdges(): boolean { return this._drawHorizontalEdges; }
  setDrawHorizontalEdges(v: boolean): void { this._drawHorizontalEdges = v; }

  drawVerticalEdges(): boolean { return this._drawVerticalEdges; }
  setDrawVerticalEdges(v: boolean): void { this._drawVerticalEdges = v; }

  drawAngledEdges(): boolean { return this._drawAngledEdges; }
  setDrawAngledEdges(v: boolean): void { this._drawAngledEdges = v; }

  drawSlashEdges(): boolean { return this._drawSlashEdges; }
  setDrawSlashEdges(v: boolean): void { this._drawSlashEdges = v; }

  drawSloshEdges(): boolean { return this._drawSloshEdges; }
  setDrawSloshEdges(v: boolean): void { this._drawSloshEdges = v; }

  // ---- Adjacency developer settings ----

  drawFacesOfVertices(): boolean { return this._drawFacesOfVertices; }
  setDrawFacesOfVertices(v: boolean): void { this._drawFacesOfVertices = v; }

  drawEdgesOfVertices(): boolean { return this._drawEdgesOfVertices; }
  setDrawEdgesOfVertices(v: boolean): void { this._drawEdgesOfVertices = v; }

  drawVerticesOfFaces(): boolean { return this._drawVerticesOfFaces; }
  setDrawVerticesOfFaces(v: boolean): void { this._drawVerticesOfFaces = v; }

  drawEdgesOfFaces(): boolean { return this._drawEdgesOfFaces; }
  setDrawEdgesOfFaces(v: boolean): void { this._drawEdgesOfFaces = v; }

  drawVerticesOfEdges(): boolean { return this._drawVerticesOfEdges; }
  setDrawVerticesOfEdges(v: boolean): void { this._drawVerticesOfEdges = v; }

  drawFacesOfEdges(): boolean { return this._drawFacesOfEdges; }
  setDrawFacesOfEdges(v: boolean): void { this._drawFacesOfEdges = v; }

  /** @java SettingsVC#lastClickedSite() */
  lastClickedSite(): Location { return this._lastClickedSite; }
  /** @java SettingsVC#setLastClickedSite(Location) */
  setLastClickedSite(v: Location): void { this._lastClickedSite = v; }

  drawColumnsCells(): boolean[] { return this._drawColumnsCells; }
  setDrawColumnsCells(v: boolean[]): void { this._drawColumnsCells = v; }

  drawRowsCells(): boolean[] { return this._drawRowsCells; }
  setDrawRowsCells(v: boolean[]): void { this._drawRowsCells = v; }

  drawColumnsVertices(): boolean[] { return this._drawColumnsVertices; }
  setDrawColumnsVertices(v: boolean[]): void { this._drawColumnsVertices = v; }

  drawRowsVertices(): boolean[] { return this._drawRowsVertices; }
  setDrawRowsVertices(v: boolean[]): void { this._drawRowsVertices = v; }

  // -------------------------------------------------------------------------
  // Consequence selection

  /** @java SettingsVC#selectingConsequenceMove() */
  selectingConsequenceMove(): boolean { return this._selectingConsequenceMove; }
  /** @java SettingsVC#setSelectingConsequenceMove(boolean) */
  setSelectingConsequenceMove(v: boolean): void { this._selectingConsequenceMove = v; }

  /** @java SettingsVC#possibleConsequenceLocations() */
  possibleConsequenceLocations(): Location[] { return this._possibleConsequenceLocations; }
  /** @java SettingsVC#setPossibleConsequenceLocations(ArrayList) */
  setPossibleConsequenceLocations(v: Location[]): void { this._possibleConsequenceLocations = v; }

  // -------------------------------------------------------------------------
  // Animation

  /** @java SettingsVC#pieceBeingDragged() */
  pieceBeingDragged(): boolean { return this._pieceBeingDragged; }
  /** @java SettingsVC#setPieceBeingDragged(boolean) */
  setPieceBeingDragged(v: boolean): void { this._pieceBeingDragged = v; }

  /** @java SettingsVC#thisFrameIsAnimated() */
  thisFrameIsAnimated(): boolean { return this._thisFrameIsAnimated; }
  /** @java SettingsVC#setThisFrameIsAnimated(boolean) */
  setThisFrameIsAnimated(v: boolean): void { this._thisFrameIsAnimated = v; }

  /** @java SettingsVC#showCandidateValues() */
  showCandidateValues(): boolean { return this._showCandidateValues; }
  /** @java SettingsVC#setShowCandidateValues(boolean) */
  setShowCandidateValues(v: boolean): void { this._showCandidateValues = v; }

  /** @java SettingsVC#lastErrorMessage() */
  lastErrorMessage(): string { return this._lastErrorMessage; }
  /** @java SettingsVC#setLastErrorMessage(String) */
  setLastErrorMessage(v: string): void { this._lastErrorMessage = v; }

  /** @java SettingsVC#noAnimation() */
  noAnimation(): boolean { return this._noAnimation; }
  /** @java SettingsVC#setNoAnimation(boolean) */
  setNoAnimation(v: boolean): void { this._noAnimation = v; }

  /** @java SettingsVC#coordWithOutline() */
  coordWithOutline(): boolean { return this._coordWithOutline; }
  /** @java SettingsVC#setCoordWithOutline(boolean) */
  setCoordWithOutline(v: boolean): void { this._coordWithOutline = v; }

  /** @java SettingsVC#errorReport() */
  errorReport(): string { return this._errorReport; }
  /** @java SettingsVC#setErrorReport(String) */
  setErrorReport(v: string): void { this._errorReport = v; }

  /** @java SettingsVC#pieceFamilies() */
  pieceFamilies(): Map<string, string> { return this._pieceFamilies; }
  /** @java SettingsVC#setPieceFamilies(HashMap) */
  setPieceFamilies(v: Map<string, string>): void { this._pieceFamilies = v; }

  /**
   * @java SettingsVC#pieceFamily(String)
   */
  pieceFamily(gameName: string): string {
    return this._pieceFamilies.get(gameName) ?? '';
  }

  /**
   * @java SettingsVC#setPieceFamily(String, String)
   */
  setPieceFamily(gameName: string, pieceFamily: string): void {
    this._pieceFamilies.set(gameName, pieceFamily);
  }

  /** @java SettingsVC#getAnimationMove() */
  getAnimationMove(): IMove { return this._animationMove; }
  /** @java SettingsVC#setAnimationMove(Move) */
  setAnimationMove(v: IMove): void { this._animationMove = v; }

  /** @java SettingsVC#furthestDistanceMultiplier() */
  furthestDistanceMultiplier(): number { return this._furthestDistanceMultiplier; }
  /** @java SettingsVC#setFurthestDistanceMultiplier(double) */
  setFurthestDistanceMultiplier(v: number): void { this._furthestDistanceMultiplier = v; }

  // -------------------------------------------------------------------------
}
