import { add, createQuery } from "@meteordb/query";
import type { Graph, Vertex, Edge, VertexId } from "@meteordb/types";
import { objectFilter } from "@meteordb/utils/objectFilter";

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
  args: Partial<TVertex> | VertexId[],
) => {
  if (!Array.isArray(args)) return searchVertices(graph, args);

  if (!args.length) return graph.vertices.slice();

  return findVerticesByIds(graph, args);
};

const searchVertices = <TVertex extends object, TEdge extends object>(
  graph: Graph<TVertex, TEdge>,
  filter: Partial<TVertex>,
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

export const findInEdges = <TVertex extends object, TEdge extends object>(
  graph: Graph<TVertex, TEdge>,
  vertex: Vertex<TVertex, TEdge>,
) => {
  return graph.edges.filter((edge) => edge._in._id === vertex._id);
};

export const findOutEdges = <TVertex extends object, TEdge extends object>(
  graph: Graph<TVertex, TEdge>,
  vertex: Vertex<TVertex, TEdge>,
) => {
  return graph.edges.filter((edge) => edge._out._id === vertex._id);
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
