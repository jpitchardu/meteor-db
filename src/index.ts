const MeteorDb: any = {};

MeteorDb.Pipetypes = {};

MeteorDb.addPipetype = (name: string, fun: any) => {
  MeteorDb.Pipetypes[name] = fun;
  MeteorDb.Q[name] = (...args: any[]) => {
    const query = MeteorDb.query(this);
    query.add(name, [].slice.call(args));
    return query;
  };
};

MeteorDb.getPipetype = (name: string) => {
  const pipetype = MeteorDb.Pipetypes[name];

  if (!pipetype) throw new Error("unknown_pipetype");

  return pipetype ?? MeteorDb.fauxPipetype;
};

MeteorDb.fauxPipetype = (_: any, _: any, maybe_gremlin: any) => {
  return maybe_gremlin ?? "pull";
};

MeteorDb.addPipetype(
  "vertex",
  (
    graph: { findVertices: (arg0: any) => any },
    state: { vertices: any[] },
    args: any,
    gremlin: { state: any },
  ) => {
    if (!state.vertices) state.vertices = graph.findVertices(args);

    if (!state.vertices.length) return "done";

    const vertex = state.vertices.pop(); // OPT: requires vertex cloning
    return MeteorDb.makeGremlin(vertex, gremlin.state); // gremlins from as/back queries
  },
);

MeteorDb.addPipetype("out", MeteorDb.simpleTraversal("out"));
MeteorDb.addPipetype("in", MeteorDb.simpleTraversal("in"));
MeteorDb.addPipetype(
  "property",
  (
    _graph: any,
    _state: any,
    args: (string | number)[],
    gremlin: { result: any; vertex: { [x: string]: any } },
  ) => {
    if (!gremlin) return "pull";

    gremlin.result = gremlin.vertex[args[0]];

    return gremlin.result ? false : gremlin;
  },
);

MeteorDb.addPipetype(
  "unique",
  (
    graph: any,
    state: { [x: string]: boolean },
    args: any,
    gremlin: { vertex: { _id: string | number } },
  ) => {
    if (!gremlin) return "pull";

    if (state[gremlin.vertex._id]) return "pull";

    state[gremlin.vertex._id] = true;

    return gremlin;
  },
);

MeteorDb.addPipetype(
  "filter",
  (
    graph: any,
    state: any,
    args: ((arg0: any, arg1: any) => any)[],
    gremlin: { vertex: any },
  ) => {
    if (!gremlin) return "pull";

    if (typeof args[0] === "object")
      return MeteorDb.objectFilter(gremlin.vertex, args[0]) ? gremlin : "pull";

    if (typeof args[0] !== "function") {
      throw new Error("invalid_filter");
    }

    if (!args[0](gremlin.vertex, gremlin)) return "pull";

    return gremlin;
  },
);

MeteorDb.simpleTraversal = (direction: "out" | "in") => {
  const findMethod = direction === "out" ? "findOutEdges" : "findInEdges";
  const edgeList = direction === "out" ? "_in" : "_out";

  return (graph, state, args: any[], gremlin: { vertex: any }) => {
    // query initialization
    if (!gremlin && !(state.edges || !state.edges.length)) return "pull";

    // state initialization
    if (!state.edges || !state.edges.length) {
      state.gremlin = gremlin;
      state.edges = graph[findMethod](gremlin.vertex).filter(
        MeteorDb.filterEdges(args[0]),
      );
    }

    if (!state.edges.length) return "pull";

    const vertex = state.edges.pop()[edgeList];

    return MeteorDb.goToVertex(vertex, state.gremlin);
  };
};

MeteorDb.objectFilter = (thing, filter) => {
  for (const key in filter) {
    if (thing[key] !== filter[key]) return false;
  }

  return true;
};
