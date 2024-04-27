import { add, createQuery } from "@meteordb/query";
import { objectFilter } from "@meteordb/utils/objectFilter";

type Vertex<T extends object, TEdge extends object> = T & {
  _id: number;
  _out: Array<Edge<TEdge, T>>;
  _in: Array<Edge<TEdge, T>>;
};

type Edge<T extends object, TVertex extends object> = T & {
  _out: Vertex<TVertex, T>;
  _in: Vertex<TVertex, T>;
};

export type Graph<TVertex extends object, TEdge extends object> = {
  _autoId: number;
  vertices: Array<Vertex<TVertex, TEdge>>;
  edges: Array<Edge<TEdge, TVertex>>;
  vertexIndex: { [id: number]: Vertex<TVertex, TEdge> };
};

type SearchObject = {
  [key: string]: any;
};

type VertexId = number;

const findVertexById = <TVertex extends object, TEdge extends object>(
  graph: Graph<TVertex, TEdge>,
  id: VertexId,
) => {
  return graph.vertexIndex[id];
};

const findVerticesByIds = <TVertex extends object, TEdge extends object>(
  graph: Graph<TVertex, TEdge>,
  ids: VertexId[],
) => {
  return graph.vertices.filter((vertex) => ids.includes(vertex._id));
};

const findVertices = <TVertex extends object, TEdge extends object>(
  graph: Graph<TVertex, TEdge>,
  args: SearchObject | VertexId[],
) => {
  if (!Array.isArray(args)) return searchVertices(graph, args);

  if (!args.length) return graph.vertices.slice();

  return findVerticesByIds(graph, args);
};

const searchVertices = <TVertex extends object, TEdge extends object>(
  graph: Graph<TVertex, TEdge>,
  filter: SearchObject,
) => graph.vertices.filter((vertex: any) => objectFilter(vertex, filter));

const addVertex = <TVertex extends object, TEdge extends object>(
  graph: Graph<TVertex, TEdge>,
  vertex: Vertex<TVertex, TEdge>,
) => {
  if (!vertex._id) {
    vertex._id = graph._autoId++;
  } else if (findVertexById(graph, vertex._id)) {
    throw new Error("duplicate_vertex_id");
  }

  graph.vertices.push(vertex);
  graph.vertexIndex[vertex._id] = vertex;
  vertex._out = [];
  vertex._in = [];

  return vertex._id;
};

const addEdge = <TVertex extends object, TEdge extends object>(
  graph: Graph<TVertex, TEdge>,
  inputEdge: { _in: VertexId; _out: VertexId } & TEdge,
) => {
  const edge: Edge<TEdge, TVertex> = {
    ...inputEdge,
    _in: findVertexById(graph, inputEdge._in),
    _out: findVertexById(graph, inputEdge._out),
  };

  if (!edge._in || !edge._out) {
    throw new Error("invalid_edge");
  }
  edge._out._out.push(edge);
  edge._in._in.push(edge);

  graph.edges.push(edge);
};

const vertex = <TVertex extends object, TEdge extends object>(
  graph: Graph<TVertex, TEdge>,
  ...args: any[]
) => {
  const query = createQuery(graph);
  add(query, "vertex", [...args]);
  return query;
};

const createGraph = <TVertex extends object, TEdge extends object>(
  v?: Array<Vertex<TVertex, TEdge>>,
  e?: Array<{ _in: VertexId; _out: VertexId }>,
) => {
  const graph: Graph<TVertex, TEdge> = {
    _autoId: 1,
    edges: [],
    vertices: [],
    vertexIndex: [],
  };

  if (v) v.forEach(addVertex.bind(null, graph));
  if (e) e.forEach(addEdge.bind(null, graph));

  return graph;
};
