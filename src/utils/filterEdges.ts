import { objectFilter } from "./objectFilter";

export const filterEdges = (filter: string | any[]) => {
  return (edge: { _label: string }) => {
    if (!filter) return true;

    if (typeof filter === "string") return edge._label === filter;

    if (Array.isArray(filter)) return filter.includes(edge._label);

    return objectFilter(edge, filter);
  };
};
