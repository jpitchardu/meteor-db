import type { Graph, MaybeGremlin } from "@meteordb/types";

const pipetypes: Record<string, Pipetype<any, any, any>> = {};

export type Pipetype<TVertex extends object, TEdge extends object, TArgs> = (
  graph: Graph<TVertex, TEdge>,
  state: any,
  gremlin: any,
  ...args: TArgs[]
) => MaybeGremlin<TVertex, TEdge>;

const FAUX_PIPETYPE: Pipetype<object, object, []> = (
  _graph,
  _state,
  maybeGremlin,
) => {
  return maybeGremlin ?? "pull";
};

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
