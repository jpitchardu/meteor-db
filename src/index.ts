const MeteorDb: any = {};

type Vertex = {
  _id: number;
  _out: Array<Edge>;
  _in: Array<Edge>;
};

type VertexId = Vertex["_id"];

type Edge = {
  _id: number;
  _out: Vertex;
  _in: Vertex;
};

type Graph = {
  autoId: number;
  vertices: Array<Vertex>;
  edges: Array<Edge>;
  vertexIndex: { [id: number]: Vertex };
  addVertex: (vertex: Vertex) => number;
  addEdge: (edge: Edge) => number;
};

MeteorDb.G = {}; // Prototype
MeteorDb.Q = {};
MeteorDb.Pipetypes = {};

MeteorDb.G.addVertex = (vertex: Vertex) => {
  if (!vertex._id) {
    vertex._id = MeteorDb.G.autoId++;
  } else if (this.findVertexById(vertex._id)) {
    throw new Error("duplicate_vertex_id");
  }

  this.vertices.push(vertex);
  this.vertexIndex[vertex._id] = vertex;
  vertex._out = [];
  vertex._in = [];

  return vertex._id;
};

MeteorDb.G.addEdge = (edge: { _in: { _in: any[] }; _out: { _out: any[] } }) => {
  edge._in = this.findVertexById(edge._in);
  edge._out = this.findVertexById(edge._out);

  if (!edge._in || !edge._out) {
    throw new Error("invalid_edge");
  }
  edge._out._out.push(edge);
  edge._in._in.push(edge);

  this.edges.push(edge);
};

MeteorDb.G.v = (...args: any[]) => {
  const query = MeteorDb.query(this);
  1;
  query.add("vertex", [].slice.call(args));
  return query;
};

MeteorDb.Q.add = (pipetype: any, args: any) => {
  const step = [pipetype, args];
  this.program.push(step);
  return this;
};

MeteorDb.query = (graph: any) => {
  const query = Object.create(MeteorDb.Q);

  query.graph = graph;
  query.state = [];
  query.program = [];
  query.gremlins = [];

  return query;
};

MeteorDb.graph = (v?: Array<Vertex>, e?: Array<Edge>) => {
  const graph = Object.create(MeteorDb.G);

  graph.edges = [];
  graph.vertices = [];
  graph.vertexIndex = [];

  graph.autoId = 1;

  if (v) graph.addVertices(v);
  if (e) graph.addEdges(e);

  return graph;
};

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
    gremlin: { state: any }
  ) => {
    if (!state.vertices) state.vertices = graph.findVertices(args);

    if (!state.vertices.length) return "done";

    const vertex = state.vertices.pop(); // OPT: requires vertex cloning
    return MeteorDb.makeGremlin(vertex, gremlin.state); // gremlins from as/back queries
  }
);

MeteorDb.addPipetype("out", MeteorDb.simpleTraversal("out"));
MeteorDb.addPipetype("in", MeteorDb.simpleTraversal("in"));
MeteorDb.addPipetype(
  "property",
  (
    _graph: any,
    _state: any,
    args: (string | number)[],
    gremlin: { result: any; vertex: { [x: string]: any } }
  ) => {
    if (!gremlin) return "pull";

    gremlin.result = gremlin.vertex[args[0]];

    return gremlin.result ? false : gremlin;
  }
);

MeteorDb.addPipetype(
  "unique",
  (
    graph: any,
    state: { [x: string]: boolean },
    args: any,
    gremlin: { vertex: { _id: string | number } }
  ) => {
    if (!gremlin) return "pull";

    if (state[gremlin.vertex._id]) return "pull";

    state[gremlin.vertex._id] = true;

    return gremlin;
  }
);

MeteorDb.addPipetype(
  "filter",
  (
    graph: any,
    state: any,
    args: ((arg0: any, arg1: any) => any)[],
    gremlin: { vertex: any }
  ) => {
    if (!gremlin) return "pull";

    if (typeof args[0] === "object")
      return MeteorDb.objectFilter(gremlin.vertex, args[0]) ? gremlin : "pull";

    if (typeof args[0] !== "function") {
      throw new Error("invalid_filter");
    }

    if (!args[0](gremlin.vertex, gremlin)) return "pull";

    return gremlin;
  }
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
        MeteorDb.filterEdges(args[0])
      );
    }

    if (!state.edges.length) return "pull";

    const vertex = state.edges.pop()[edgeList];

    return MeteorDb.goToVertex(vertex, state.gremlin);
  };
};

MeteorDb.G.findVertices = (...args: string | any[]) => {
  if (typeof args[0] === "object") return this.searchVertices(args[0]);
  if (!args.length) return this.vertices.slice();

  return this.findVerticesByIds(args);
};

MeteorDb.G.searchVertices = (filter: any) => {
  return this.vertices.filter((vertex: any) =>
    MeteorDb.objectFilter(vertex, filter)
  );
};

MeteorDb.filterEdges = (filter: string | any[]) => {
  return (edge: { _label: string }) => {
    if (!filter) return true;

    if (typeof filter === "string") return edge._label === filter;

    if (Array.isArray(filter)) return filter.includes(edge._label);

    return MeteorDb.objectFilter(edge, filter);
  };
};

MeteorDb.objectFilter = (thing, filter) => {
  for (const key in filter) {
    if (thing[key] !== filter[key]) return false;
  }

  return true;
};
