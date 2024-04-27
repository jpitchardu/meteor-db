import type { Graph } from "@meteordb/graph";

export type Query<TVertex extends object, TEdge extends object> = {
  graph: Graph<TVertex, TEdge>;
  state: any;
  program: any;
  gremlins: any;
};

const run = <TVertex extends object, TEdge extends object>(
  query: Query<TVertex, TEdge>,
) => {
  const max = query.program.length - 1;
  const results = [];

  let done = -1;
  let programCounter = max;
  let maybeGremlin: boolean | string = false;

  let step;
  let state;
  let pipetype;

  while (done < max) {
    const currentState = query.state;
    step = query.program[programCounter];
    state = currentState[programCounter] ?? {};
    pipetype = MeteorDb.getPipetype(step[0]);

    maybeGremlin = pipetype(query.graph, step[1], step, maybeGremlin);

    if (maybeGremlin === "pull") {
      maybeGremlin = false;
      if (programCounter > done) {
        programCounter--;
      } else {
        done = programCounter;
      }
    }

    if (maybeGremlin === "done") {
      maybeGremlin = false;
      done = programCounter;
    }

    programCounter++;

    if (programCounter > max) {
      if (maybeGremlin) {
        results.push(maybeGremlin);
      }
      maybeGremlin = false;
      programCounter--;
    }
  }

  return results;
};

export const add = <TVertex extends object, TEdge extends object>(
  query: Query<TVertex, TEdge>,
  pipetype: string,
  args: any,
) => {
  const step = [pipetype, args];
  query.program.push(step);
  return query;
};

export const createQuery = <TVertex extends object, TEdge extends object>(
  graph: Graph<TVertex, TEdge>,
) => {
  const query: Query<TVertex, TEdge> = {
    graph,
    state: [],
    program: [],
    gremlins: [],
  };

  return query;
};
