// @java Core/src/game/util/graph/Trajectories.java Trajectories
//
// The faithful trajectory engine: precomputes, for every SiteType and every
// site, the single-hop Steps and multi-hop Radials, each tagged with the
// AbsoluteDirections it agrees with. This is the one mechanism Java uses to
// resolve movement on EVERY board (square / hex / triangular / concentric),
// replacing the port's earlier Cartesian dx/dy shortcut. See PARITY.md.
//
// Pipeline (mirrors Java create()):
//   generateSteps  → stepsTo per element (structural Orthogonal/Diagonal/…)
//                  → setCompassDirections (angular N/E/… + SameLayer/Up/Down)
//                  → setCircularDirections (pivoted CW/CCW/In/Out)
//   generateRadials → followRadial (straightest continuation, 0.25 rad bend)

import { type Graph } from "../graph.js";
import {
  AbsoluteDirection,
  ALL_DIRECTIONS,
  NUM_DIRECTIONS,
} from "./absolute-direction.js";
import {
  type EdgeEl,
  type FaceEl,
  type GElement,
  GraphTopology,
  NUM_SITE_TYPES,
  SiteType,
  type VertexEl,
} from "./graph-element.js";
import {
  absTanAngleDifference3D,
  angle2D,
  distance3D,
  distanceToLine,
  dot3D,
  whichSide,
} from "./math.js";
import { Radial, Radials } from "./radial.js";
import { Step, Steps } from "./step.js";

const SITE_TYPES: readonly SiteType[] = [
  SiteType.Vertex,
  SiteType.Edge,
  SiteType.Cell,
];

// -- structural steps (stepsTo) ----------------------------------------------

/** @java Face.stepsTo(Steps) */
function faceStepsTo(face: FaceEl, steps: Steps): void {
  const usedFaces = new Set<number>();
  usedFaces.add(face.id);

  // Adjacent cells across shared edges → Orthogonal.
  for (const edge of face.edges) {
    const other = edge.otherFace(face.id);
    if (other === null) continue;
    usedFaces.add(other.id);
    const step = new Step(face, other);
    step.directions.add(AbsoluteDirection.Orthogonal);
    step.directions.add(AbsoluteDirection.Adjacent);
    step.directions.add(AbsoluteDirection.All);
    steps.add(step);
  }

  // Diagonal cells joined by a vertex (square grid) → Diagonal.
  for (const vertex of face.vertices) {
    let bestDistance = 1000000;
    let diagonal: FaceEl | null = null;
    for (const other of vertex.faces) {
      if (usedFaces.has(other.id)) continue;
      const dist = distanceToLine(
        vertex.pt.x, vertex.pt.y,
        face.pt.x, face.pt.y,
        other.pt.x, other.pt.y,
      );
      if (dist < bestDistance) {
        bestDistance = dist;
        diagonal = other;
      }
    }
    if (diagonal === null) continue;
    usedFaces.add(diagonal.id);
    const step = new Step(face, diagonal);
    step.directions.add(AbsoluteDirection.Diagonal);
    step.directions.add(AbsoluteDirection.Adjacent);
    step.directions.add(AbsoluteDirection.All);
    steps.add(step);
  }

  // Remaining off-diagonal cells joined by a vertex (tri grid) → OffDiagonal.
  for (const vertex of face.vertices) {
    for (const other of vertex.faces) {
      if (usedFaces.has(other.id)) continue;
      usedFaces.add(other.id);
      const step = new Step(face, other);
      step.directions.add(AbsoluteDirection.OffDiagonal);
      step.directions.add(AbsoluteDirection.Adjacent);
      step.directions.add(AbsoluteDirection.All);
      steps.add(step);
    }
  }

  // Non-adjacent diagonal cells joined by an edge (hex grid) → Diagonal.
  for (const vertex of face.vertices) {
    if (vertex.edges.length !== 3) continue; // only trivalent intersections
    const otherVertex = vertex.edgeAwayFrom(face);
    if (otherVertex === null) continue;
    for (const otherFace of otherVertex.faces) {
      if (usedFaces.has(otherFace.id)) continue;
      const distV = distanceToLine(
        vertex.pt.x, vertex.pt.y,
        face.pt.x, face.pt.y,
        otherFace.pt.x, otherFace.pt.y,
      );
      const distOV = distanceToLine(
        otherVertex.pt.x, otherVertex.pt.y,
        face.pt.x, face.pt.y,
        otherFace.pt.x, otherFace.pt.y,
      );
      const distAB = Math.hypot(
        otherFace.pt.x - face.pt.x,
        otherFace.pt.y - face.pt.y,
      );
      const error = distAB === 0 ? Infinity : (distV + distOV) / distAB;
      if (error > 0.1) continue;
      usedFaces.add(otherFace.id);
      const step = new Step(face, otherFace);
      step.directions.add(AbsoluteDirection.Diagonal);
      step.directions.add(AbsoluteDirection.All);
      steps.add(step);
    }
  }

  // Steps to this face's own vertices and edges → Orthogonal/Adjacent/All.
  for (const vertex of face.vertices) {
    const step = new Step(face, vertex);
    step.directions.add(AbsoluteDirection.Orthogonal);
    step.directions.add(AbsoluteDirection.Adjacent);
    step.directions.add(AbsoluteDirection.All);
    steps.add(step);
  }
  for (const edge of face.edges) {
    const step = new Step(face, edge);
    step.directions.add(AbsoluteDirection.Orthogonal);
    step.directions.add(AbsoluteDirection.Adjacent);
    step.directions.add(AbsoluteDirection.All);
    steps.add(step);
  }
}

/** @java Vertex.stepsTo(Steps) */
function vertexStepsTo(vertex: VertexEl, steps: Steps): void {
  // Orthogonal steps along edges to other vertices.
  for (const edge of vertex.edges) {
    const to = edge.otherVertex(vertex.id);
    const step = new Step(vertex, to);
    step.directions.add(AbsoluteDirection.Orthogonal);
    step.directions.add(AbsoluteDirection.Adjacent);
    step.directions.add(AbsoluteDirection.All);
    steps.add(step);
  }

  // Diagonal steps across cell faces (square cells) → Diagonal.
  for (const face of vertex.faces) {
    if (face.vertices.length < 4) continue; // no diagonal across a triangle
    let bestDist = 1000000;
    let bestTo: VertexEl | null = null;
    for (const to of face.vertices) {
      if (to.id === vertex.id) continue;
      const dist = distanceToLine(
        face.pt.x, face.pt.y,
        vertex.pt.x, vertex.pt.y,
        to.pt.x, to.pt.y,
      );
      if (dist < bestDist) {
        bestDist = dist;
        bestTo = to;
      }
    }
    if (bestTo === null) continue;
    const step = new Step(vertex, bestTo);
    step.directions.add(AbsoluteDirection.Diagonal);
    step.directions.add(AbsoluteDirection.All);
    steps.add(step);
  }

  // Steps to incident edges and faces → Orthogonal/Adjacent/All.
  for (const edge of vertex.edges) {
    const step = new Step(vertex, edge);
    step.directions.add(AbsoluteDirection.Orthogonal);
    step.directions.add(AbsoluteDirection.Adjacent);
    step.directions.add(AbsoluteDirection.All);
    steps.add(step);
  }
  for (const face of vertex.faces) {
    const step = new Step(vertex, face);
    step.directions.add(AbsoluteDirection.Orthogonal);
    step.directions.add(AbsoluteDirection.Adjacent);
    step.directions.add(AbsoluteDirection.All);
    steps.add(step);
  }
}

function stepsToFor(element: GElement, steps: Steps): void {
  if (element.siteType === SiteType.Cell) faceStepsTo(element as FaceEl, steps);
  else if (element.siteType === SiteType.Vertex) {
    vertexStepsTo(element as VertexEl, steps);
  }
  // Edge.stepsTo is unused: board-graph maps use:Edge play onto Vertex sites.
}

// -- compass-direction assignment --------------------------------------------

/**
 * @java Trajectories.mapAngleToAbsoluteDirection
 * Bin a step's planar angle into a compass direction. `intercardinal` selects
 * the 16-point set (used when two steps collide in the 8-point set). Planar
 * boards have elevation 0, so only the 2-D branch is reachable here.
 */
function mapAngleToAbsoluteDirection(
  step: Step,
  _unit: number,
  intercardinal: boolean,
): AbsoluteDirection {
  const a = step.from.pt;
  const b = step.to.pt;
  // 2-D planar boards: elevation is always 0 (z === 0), so omit the U/D branch.
  let angle = Math.atan2(b.y - a.y, b.x - a.x);
  while (angle < 0) angle += 2 * Math.PI;
  while (angle > 2 * Math.PI) angle -= 2 * Math.PI;

  if (!intercardinal) {
    const off = (2 * Math.PI) / 16;
    if (angle < off) return AbsoluteDirection.E;
    if (angle < off + (2 * Math.PI) / 8) return AbsoluteDirection.NE;
    if (angle < off + (4 * Math.PI) / 8) return AbsoluteDirection.N;
    if (angle < off + (6 * Math.PI) / 8) return AbsoluteDirection.NW;
    if (angle < off + (8 * Math.PI) / 8) return AbsoluteDirection.W;
    if (angle < off + (10 * Math.PI) / 8) return AbsoluteDirection.SW;
    if (angle < off + (12 * Math.PI) / 8) return AbsoluteDirection.S;
    if (angle < off + (14 * Math.PI) / 8) return AbsoluteDirection.SE;
    return AbsoluteDirection.E;
  }
  const off = (2 * Math.PI) / 32;
  if (angle < off) return AbsoluteDirection.E;
  if (angle < off + (2 * Math.PI) / 16) return AbsoluteDirection.ENE;
  if (angle < off + (4 * Math.PI) / 16) return AbsoluteDirection.NE;
  if (angle < off + (6 * Math.PI) / 16) return AbsoluteDirection.NNE;
  if (angle < off + (8 * Math.PI) / 16) return AbsoluteDirection.N;
  if (angle < off + (10 * Math.PI) / 16) return AbsoluteDirection.NNW;
  if (angle < off + (12 * Math.PI) / 16) return AbsoluteDirection.NW;
  if (angle < off + (14 * Math.PI) / 16) return AbsoluteDirection.WNW;
  if (angle < off + (16 * Math.PI) / 16) return AbsoluteDirection.W;
  if (angle < off + (18 * Math.PI) / 16) return AbsoluteDirection.WSW;
  if (angle < off + (20 * Math.PI) / 16) return AbsoluteDirection.SW;
  if (angle < off + (22 * Math.PI) / 16) return AbsoluteDirection.SSW;
  if (angle < off + (24 * Math.PI) / 16) return AbsoluteDirection.S;
  if (angle < off + (26 * Math.PI) / 16) return AbsoluteDirection.SSE;
  if (angle < off + (28 * Math.PI) / 16) return AbsoluteDirection.SE;
  if (angle < off + (30 * Math.PI) / 16) return AbsoluteDirection.ESE;
  return AbsoluteDirection.E;
}

const COMPASS_SAME_LAYER = new Set<AbsoluteDirection>([
  AbsoluteDirection.N, AbsoluteDirection.E, AbsoluteDirection.S, AbsoluteDirection.W,
  AbsoluteDirection.NE, AbsoluteDirection.SE, AbsoluteDirection.SW, AbsoluteDirection.NW,
  AbsoluteDirection.NNE, AbsoluteDirection.ENE, AbsoluteDirection.ESE, AbsoluteDirection.SSE,
  AbsoluteDirection.SSW, AbsoluteDirection.WSW, AbsoluteDirection.WNW, AbsoluteDirection.NNW,
]);

// -- the engine --------------------------------------------------------------

/** @java Core/src/game/util/graph/Trajectories.java Trajectories */
export class TrajectoriesCore {
  public readonly topo: GraphTopology;
  /** steps[siteTypeOrdinal][siteId] */
  private readonly stepsArr: Steps[][];
  /** radials[siteTypeOrdinal][siteId] */
  private readonly radialsArr: Radials[][];
  public readonly totalDirections = new Set<number>();
  /** Vertex ids that act as a pivot (centre) for some ring vertex. A circular
   *  In/Out radial passes straight through these (see followRadial). */
  private readonly pivotVertexIds = new Set<number>();

  public constructor(graph: Graph) {
    this.topo = new GraphTopology(graph);
    this.stepsArr = Array.from({ length: NUM_SITE_TYPES }, () => []);
    this.radialsArr = Array.from({ length: NUM_SITE_TYPES }, () => []);
    this.create();
  }

  // -- public accessors (mirror Java steps()/radials() overloads) -----------

  public stepsToType(fromType: SiteType, siteId: number, toType: SiteType): Step[] {
    return this.stepsArr[fromType]?.[siteId]?.toSiteType(toType) ?? [];
  }
  public stepsInDirection(fromType: SiteType, siteId: number, dirn: AbsoluteDirection): Step[] {
    return this.stepsArr[fromType]?.[siteId]?.inDirection(dirn) ?? [];
  }
  public stepsToTypeInDirection(
    fromType: SiteType, siteId: number, toType: SiteType, dirn: AbsoluteDirection,
  ): Step[] {
    return this.stepsArr[fromType]?.[siteId]?.toSiteTypeInDirection(toType, dirn) ?? [];
  }
  public radialsOf(fromType: SiteType, siteId: number): Radials | undefined {
    return this.radialsArr[fromType]?.[siteId];
  }
  public radialsInDirection(fromType: SiteType, siteId: number, dirn: AbsoluteDirection): Radial[] {
    return this.radialsArr[fromType]?.[siteId]?.inDirection(dirn) ?? [];
  }

  // -- construction ---------------------------------------------------------

  private create(): void {
    this.generateSteps();
    this.generateRadials();
  }

  private generateSteps(): void {
    for (const siteType of SITE_TYPES) {
      for (const from of this.topo.elements(siteType)) {
        const stepsFrom = new Steps(siteType, from.id);
        stepsToFor(from, stepsFrom);
        (this.stepsArr[siteType] as Steps[])[from.id] = stepsFrom;
      }
    }

    this.setDirections();

    for (const siteType of SITE_TYPES) {
      for (const stepList of this.stepsArr[siteType] as Steps[]) {
        if (!stepList) continue;
        for (const d of stepList.totalDirections) this.totalDirections.add(d);
      }
    }
  }

  private setDirections(): void {
    this.setCompassDirections();
    this.setCircularDirections();

    // Propagate every per-direction step bit into the step itself and into the
    // toSiteTypeInDirection index. @java Trajectories.setDirections final loop.
    for (const siteType of SITE_TYPES) {
      const elements = this.topo.elements(siteType);
      for (let id = 0; id < elements.length; id += 1) {
        const stepsFrom = (this.stepsArr[siteType] as Steps[])[id];
        if (!stepsFrom) continue;
        for (const dirn of ALL_DIRECTIONS) {
          for (const step of [...stepsFrom.inDirection(dirn)]) {
            step.directions.add(dirn);
            stepsFrom.addToSiteTypeInDirection(step.to.siteType, dirn, step);
            this.totalDirections.add(dirn);
          }
        }
      }
    }
  }

  /** @java Trajectories.setCompassDirections */
  private setCompassDirections(): void {
    const unit = this.topo.averageEdgeLength();
    for (const siteType of SITE_TYPES) {
      for (const element of this.topo.elements(siteType)) {
        const stepsFrom = (this.stepsArr[siteType] as Steps[])[element.id];
        if (!stepsFrom) continue;
        const stepList = stepsFrom.steps;

        // 8 compass directions unless two steps collide → use 16.
        const used = new Set<AbsoluteDirection>();
        let collision = false;
        for (const step of stepList) {
          const dirn = mapAngleToAbsoluteDirection(step, unit, false);
          if (used.has(dirn)) {
            collision = true;
            break;
          }
          used.add(dirn);
        }

        for (const step of stepList) {
          const dirn = mapAngleToAbsoluteDirection(step, unit, collision);
          stepsFrom.addInDirection(dirn, step);
          if (COMPASS_SAME_LAYER.has(dirn)) {
            stepsFrom.addInDirection(AbsoluteDirection.SameLayer, step);
          }
          // Upward/Downward families are unreachable on planar boards (z = 0).
        }
      }
    }
  }

  /** @java Trajectories.setCircularDirections (pivoted concentric boards). */
  private setCircularDirections(): void {
    const vertexType = SiteType.Vertex;

    // Pivot vertices: all steps go Out + Rotational.
    const pivotIds = this.pivotVertexIds;
    for (const vertex of this.topo.verts) {
      const p = vertex.pivot();
      if (p !== null) pivotIds.add(p.id);
    }
    if (pivotIds.size === 0) return; // square/rect/etc. have no pivots

    for (const id of pivotIds) {
      const stepsFrom = (this.stepsArr[vertexType] as Steps[])[id];
      if (!stepsFrom) continue;
      for (const step of stepsFrom.steps) {
        stepsFrom.addInDirection(AbsoluteDirection.Out, step);
        stepsFrom.addInDirection(AbsoluteDirection.Rotational, step);
      }
    }

    for (const siteType of SITE_TYPES) {
      const elements = this.topo.elements(siteType);
      for (let id = 0; id < elements.length; id += 1) {
        if (siteType === vertexType && pivotIds.has(id)) continue;
        const from = elements[id] as GElement;
        const pivot = from.pivot();
        if (pivot === null) continue;
        const stepsFrom = (this.stepsArr[siteType] as Steps[])[id];
        if (!stepsFrom) continue;

        for (const step of stepsFrom.steps) {
          if (step.directions.has(AbsoluteDirection.Diagonal)) continue;
          // Vectors from-element→to and from-element→pivot, normalised.
          const abx = step.to.pt.x - from.pt.x;
          const aby = step.to.pt.y - from.pt.y;
          const abz = step.to.pt.z - from.pt.z;
          const apx = pivot.pt.x - from.pt.x;
          const apy = pivot.pt.y - from.pt.y;
          const apz = pivot.pt.z - from.pt.z;
          const abLen = Math.hypot(abx, aby, abz) || 1;
          const apLen = Math.hypot(apx, apy, apz) || 1;
          const d = dot3D(
            abx / abLen, aby / abLen, abz / abLen,
            apx / apLen, apy / apLen, apz / apLen,
          );
          if (d > 0.9) {
            stepsFrom.addInDirection(AbsoluteDirection.In, step);
            stepsFrom.addInDirection(AbsoluteDirection.Rotational, step);
          } else if (d < -0.9) {
            stepsFrom.addInDirection(AbsoluteDirection.Out, step);
            stepsFrom.addInDirection(AbsoluteDirection.Rotational, step);
          } else {
            const side = whichSide(
              step.to.pt.x, step.to.pt.y,
              from.pt.x, from.pt.y,
              pivot.pt.x, pivot.pt.y,
            );
            const dir = side > 0 ? AbsoluteDirection.CW : AbsoluteDirection.CCW;
            stepsFrom.addInDirection(dir, step);
            stepsFrom.addInDirection(AbsoluteDirection.Rotational, step);
          }
        }
      }
    }
  }

  // -- radials --------------------------------------------------------------

  private generateRadials(): void {
    for (const siteType of SITE_TYPES) {
      const elements = this.topo.elements(siteType);
      for (let id = 0; id < elements.length; id += 1) {
        const radials = new Radials(siteType, id);
        (this.radialsArr[siteType] as Radials[])[id] = radials;
        const stepsFrom = (this.stepsArr[siteType] as Steps[])[id];
        if (!stepsFrom) continue;
        for (const dirn of ALL_DIRECTIONS) {
          for (const step of stepsFrom.inDirection(dirn)) {
            if (step.to.siteType !== siteType) continue;
            const radial = new RadialWIP(step.from, dirn);
            this.followRadial(radials, siteType, dirn, step.to, radial);
          }
        }
      }
    }

    // Remove opposite subsets.
    for (const siteType of SITE_TYPES) {
      for (const radials of this.radialsArr[siteType] as Radials[]) {
        if (!radials) continue;
        for (const radial of radials.radials) radial.removeOppositeSubsets();
      }
    }

    // Reassign Rotational radials, then setDistinct + sort.
    for (const siteType of SITE_TYPES) {
      const elements = this.topo.elements(siteType);
      for (let id = 0; id < elements.length; id += 1) {
        const radials = (this.radialsArr[siteType] as Radials[])[id];
        if (!radials) continue;
        // Rebuild Rotational from In/Out/CW/CCW.
        const rot = radials.inDirection(AbsoluteDirection.Rotational);
        rot.length = 0;
        for (const dir of [
          AbsoluteDirection.In, AbsoluteDirection.Out,
          AbsoluteDirection.CW, AbsoluteDirection.CCW,
        ]) {
          for (const radial of radials.inDirection(dir)) {
            radials.addInDirection(AbsoluteDirection.Rotational, radial);
          }
        }
        radials.removeSubsetsInDirection(AbsoluteDirection.Rotational);
      }
    }

    for (const siteType of SITE_TYPES) {
      for (const radials of this.radialsArr[siteType] as Radials[]) {
        if (!radials) continue;
        radials.setDistinct();
        radials.sort();
      }
    }
  }

  /** @java Trajectories.followRadial */
  private followRadial(
    radials: Radials,
    siteType: SiteType,
    dirn: AbsoluteDirection,
    current: GElement,
    radial: RadialWIP,
  ): void {
    const tanThreshold = Math.tan(0.25);
    const previous = radial.lastStep();
    radial.addStep(current);

    const stepsHere = this.stepsArr[siteType]?.[current.id];
    if (!stepsHere) return;
    const nextSteps = stepsHere.inDirection(dirn);

    const circular =
      dirn === AbsoluteDirection.CW || dirn === AbsoluteDirection.CCW ||
      dirn === AbsoluteDirection.In || dirn === AbsoluteDirection.Out;

    if (circular) {
      let bestNextTo: GElement | null = null;
      for (const next of nextSteps) {
        if (next.to.siteType !== siteType) continue;
        if (next.directions.has(dirn)) {
          bestNextTo = next.to;
          break;
        }
      }
      if (bestNextTo !== null && !radial.contains(bestNextTo)) {
        this.followRadial(radials, siteType, dirn, bestNextTo, radial);
        return;
      }
      // An In/Out radial reaching the pivot (centre) continues straight through
      // it to the diametrically opposite vertex, so a single radial spans the
      // full diameter — this is what lets a Hop capture across the centre
      // (e.g. Bara Guti's `8 → 0(enemy) → 4`). The pivot's own steps are tagged
      // Out only, so we pick the straightest geometric continuation here.
      if (
        bestNextTo === null &&
        (dirn === AbsoluteDirection.In || dirn === AbsoluteDirection.Out) &&
        siteType === SiteType.Vertex &&
        this.pivotVertexIds.has(current.id)
      ) {
        const through = this.straightestThrough(current, previous, siteType);
        if (through !== null && !radial.contains(through)) {
          this.followRadial(radials, siteType, dirn, through, radial);
          return;
        }
      }
      radials.addSafe(radial.toRadial());
      return;
    }

    // Non-circular: follow the straightest continuation(s).
    let bestAbsTanDiff = tanThreshold;
    let bestsNextTo: GElement[] = [];
    for (const next of nextSteps) {
      if (next.to.siteType !== siteType) continue;
      if (!next.directions.has(dirn)) continue;
      const absTanDiff = absTanAngleDifference3D(previous.pt, current.pt, next.to.pt);
      if (absTanDiff < bestAbsTanDiff) {
        bestAbsTanDiff = absTanDiff;
        bestsNextTo = [next.to];
        if (bestAbsTanDiff === 0.0) break;
      } else if (absTanDiff === bestAbsTanDiff) {
        bestsNextTo.push(next.to);
      }
    }

    if (bestsNextTo.length !== 0) {
      for (const nextTo of bestsNextTo) {
        if (!radial.contains(nextTo)) {
          this.followRadial(radials, siteType, dirn, nextTo, new RadialWIP(radial));
        } else {
          radials.addSafe(radial.toRadial());
        }
      }
    } else {
      radials.addSafe(radial.toRadial());
    }
  }

  /**
   * The step from `current` (a pivot/centre vertex) that most nearly continues
   * the straight line `previous → current`, i.e. the diametrically opposite
   * vertex through the pivot. Used to make an In/Out radial span the full
   * diameter (`8 → 0 → 4` on a concentric board) so a Hop can capture across
   * the centre. Returns the straightest continuation whose bend is under the
   * 0.25-rad threshold, else `null`.
   */
  private straightestThrough(
    current: GElement,
    previous: GElement,
    siteType: SiteType,
  ): GElement | null {
    const stepsHere = this.stepsArr[siteType]?.[current.id];
    if (!stepsHere) return null;
    let best: GElement | null = null;
    let bestAbsTanDiff = Math.tan(0.25);
    for (const next of stepsHere.steps) {
      if (next.to.siteType !== siteType) continue;
      if (next.to.id === previous.id) continue;
      const absTanDiff = absTanAngleDifference3D(previous.pt, current.pt, next.to.pt);
      if (absTanDiff < bestAbsTanDiff) {
        bestAbsTanDiff = absTanDiff;
        best = next.to;
      }
    }
    return best;
  }
}

/** @java Trajectories.RadialWIP — a radial under construction. */
class RadialWIP {
  private readonly elements: GElement[] = [];
  private readonly direction: AbsoluteDirection;

  public constructor(start: GElement | RadialWIP, direction?: AbsoluteDirection) {
    if (start instanceof RadialWIP) {
      this.direction = start.direction;
      this.elements = [...start.elements];
    } else {
      this.direction = direction as AbsoluteDirection;
      this.elements.push(start);
    }
  }

  public addStep(to: GElement): void {
    this.elements.push(to);
  }
  public lastStep(): GElement {
    return this.elements[this.elements.length - 1] as GElement;
  }
  public contains(el: GElement): boolean {
    for (const e of this.elements) {
      if (e.siteType === el.siteType && e.id === el.id) return true;
    }
    return false;
  }
  public toRadial(): Radial {
    return new Radial([...this.elements], this.direction);
  }
}

// Re-export the shared types/enums consumers of the core need.
export { AbsoluteDirection, SiteType };
export { angle2D, distance3D };
