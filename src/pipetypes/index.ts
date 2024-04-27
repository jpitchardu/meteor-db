import type { Graph } from "@meteordb/graph";
import type { TaggedTemplateExpression } from "typescript";

const pipetypes = {};

type PipetypeArgs<TVertex extends object, TEdge extends object, TArgs> = {
  graph: Graph<TVertex, TEdge>;
  args: TArgs;
  state: any;
  gremlin: any;
};

export type Pipetype<TVertex extends object, TEdge extends object, TArgs> = (
  args: PipetypeArgs<TVertex, TEdge, TArgs>,
) => unknown;

type;

const addPipetype = <TArgs, TVertex extends object, TEdge extends object>(
  name: string,
  fun: Pipetype<TVertex, TEdge, TArgs>,
) => {
  pipetypes[name] = fun;
};

const getPipetype = <TArgs, TVertex extends object, TEdge extends object>(
  name: string,
): Pipetype<TVertex, TEdge, TArgs> => {
  const pipetype = pipetypes[name];

  if (!pipetype) throw new Error("unknown_pipetype");

  return pipetype ?? MeteorDb.fauxPipetype;
};
