import type { Edge } from "@meteordb/types";
import { objectFilter } from "./objectFilter";

export const filterEdges = <TVertex extends object, TEdge extends object>(
  filter: Partial<Edge<TVertex, TEdge>>,
) => {
  return (edge: Edge<TVertex, TEdge>) => {
    if (!filter) return true;

    return objectFilter(edge, filter);
  };
};
