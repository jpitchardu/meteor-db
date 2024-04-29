import type { Gremlin, Vertex } from "@meteordb/types";
import { makeGremlin } from "@meteordb/utils/makeGremlin";

export const goToVertex = <TVertex extends object, TEdge extends object>(
  vertex: Vertex<TVertex, TEdge>,
  gremlin: Gremlin<TVertex, TEdge>,
) => makeGremlin(vertex, gremlin.state);
