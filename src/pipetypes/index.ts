import { findInEdges, findOutEdges } from "@meteordb/graph";
import type { Edge, Graph, Gremlin, MaybeGremlin } from "@meteordb/types";
import { filterEdges } from "@meteordb/utils/filterEdges";
import { goToVertex } from "@meteordb/utils/goToVertex";

const pipetypes: Record<string, Pipetype<any, any, any>> = {};

export type Pipetype<TVertex extends object, TEdge extends object, TArgs> = (
  graph: Graph<TVertex, TEdge>,
  state: any,
  gremlin: any,
  ...args: TArgs[]
) => MaybeGremlin<TVertex, TEdge>;

const FAUX_PIPETYPE: Pipetype<object, object, []> = (_g, _s, maybeGremlin) =>
  maybeGremlin ?? "pull";

const addPipetype = <TArgs, TVertex extends object, TEdge extends object>(
  name: string,
  fun: Pipetype<TVertex, TEdge, TArgs>,
) => {
  pipetypes[name] = fun;
};

export const getPipetype = <
  TVertex extends object,
  TEdge extends object,
  TArgs,
>(
  name: string,
): Pipetype<TVertex, TEdge, TArgs> => {
  const pipetype = pipetypes[name];

  if (!pipetype) throw new Error("unknown_pipetype");

  return pipetype ?? FAUX_PIPETYPE;
};

const simpleTraversal = <
  TVertex extends object,
  TEdge extends object,
  TArgs extends Partial<Edge<TEdge, TVertex>>[],
>(
  direction: "out" | "in",
): Pipetype<TVertex, TEdge, TArgs> => {
  const findMethod = direction === "out" ? findOutEdges : findInEdges;
  const edgeList = direction === "out" ? "_in" : "_out";

  return (graph, state, gremlin, args: Partial<Edge<TEdge, TVertex>>[]) => {
    // query initialization
    if (!gremlin && !(state.edges || !state.edges.length)) return "pull";

    // state initialization
    if (!state.edges || !state.edges.length) {
      state.gremlin = gremlin;
      state.edges = findMethod(graph, gremlin.vertex).filter(
        filterEdges(args[0]),
      );
    }

    if (!state.edges.length) return "pull";

    const vertex = state.edges.pop()[edgeList];

    return goToVertex(vertex, state.gremlin);
  };
};

addPipetype("out", simpleTraversal("out"));

const x = getPipetype("out");
