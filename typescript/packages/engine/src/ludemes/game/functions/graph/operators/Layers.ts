/**
 * @java Core/src/game/functions/graph/operators/Layers.java
 * Makes multiple layers of the specified graph for 3D games (stacked in Z).
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Layers operator: stack N copies of the base graph, one unit apart in Z.
 * @java game/functions/graph/operators/Layers.java
 */
export class Layers extends BaseGraphFunction {
  private readonly numLayers: number;
  private readonly graphFn: GraphFunction;

  /** @java Layers(DimFunction layers, GraphFunction graph) */
  constructor(numLayers: number, graphFn: GraphFunction) {
    super();
    this._dim = [numLayers];
    this.numLayers = numLayers;
    this.graphFn = graphFn;
  }

  /** @java Layers.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    // Evaluate N copies of the base graph, each translated by layer in Z.
    // TS Graph doesn't model Z translation in withTransformedCoordinates for Z;
    // we use pushVertex3D to create layer copies.
    const baseGraph = this.graphFn.eval(siteType);
    const out = new Graph();

    // Layer 0: copy base vertices at Z=0
    const layer0Map = baseGraph.vertices.map((v) =>
      out.pushVertex3D(v.x, v.y, 0),
    );
    for (const e of baseGraph.edges)
      out.addEdge(layer0Map[e.a] as number, layer0Map[e.b] as number);
    for (const f of baseGraph.faces)
      out.findOrAddFace(f.vertices.map((v) => layer0Map[v] as number));

    // Layers 1..N-1
    for (let layer = 1; layer < this.numLayers; layer += 1) {
      const layerMap = baseGraph.vertices.map((v) =>
        out.pushVertex3D(v.x, v.y, layer),
      );

      // Edges within this layer
      for (const e of baseGraph.edges)
        out.addEdge(layerMap[e.a] as number, layerMap[e.b] as number);

      // Vertical edges connecting layer-1 to this layer
      const prevStart = (layer - 1) * baseGraph.vertices.length;
      for (let v = 0; v < baseGraph.vertices.length; v += 1) {
        const prevVid = out.vertices[prevStart + v]?.id;
        const thisVid = layerMap[v];
        if (prevVid !== undefined && thisVid !== undefined)
          out.addEdge(prevVid, thisVid);
      }

      // Faces within this layer
      for (const f of baseGraph.faces)
        out.findOrAddFace(f.vertices.map((v) => layerMap[v] as number));
    }

    out.reorder();
    return out;
  }
}
