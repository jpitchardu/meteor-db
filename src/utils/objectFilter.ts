export const objectFilter = <T extends object>(
  thing: T,
  filter: Partial<T>,
) => {
  for (const key in filter) {
    if (thing[key] !== filter[key]) return false;
  }

  return true;
};
