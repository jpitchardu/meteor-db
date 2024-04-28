export type VertexId = number;

export type Vertex<T extends object, TEdge extends object> = T & {
  _id: VertexId;
  _out: Array<Edge<TEdge, T>>;
  _in: Array<Edge<TEdge, T>>;
};

export type Edge<T extends object, TVertex extends object> = T & {
  _out: Vertex<TVertex, T>;
  _in: Vertex<TVertex, T>;
};

export type Graph<TVertex extends object, TEdge extends object> = {
  _autoId: number;
  vertices: Array<Vertex<TVertex, TEdge>>;
  edges: Array<Edge<TEdge, TVertex>>;
  vertexIndex: { [id: number]: Vertex<TVertex, TEdge> };
};

export type Query<TVertex extends object, TEdge extends object> = {
  graph: Graph<TVertex, TEdge>;
  state: any;
  program: any;
  gremlins: any;
};

export type Gremlin<TVertex extends object, TEdge extends object> = {
  vertex: Vertex<TVertex, TEdge>;
  state: object;
};

export type MaybeGremlin<TVertex extends object, TEdge extends object> =
  | Gremlin<TVertex, TEdge>
  | false
  | "done"
  | "pull";
