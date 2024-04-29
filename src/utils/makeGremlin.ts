import type { Gremlin, Vertex } from "@meteordb/types";

export const makeGremlin = <TVertex extends object, TEdge extends object>(
  vertex: Vertex<TVertex, TEdge>,
  state: object,
): Gremlin<TVertex, TEdge> => {
  return { vertex, state };
};
