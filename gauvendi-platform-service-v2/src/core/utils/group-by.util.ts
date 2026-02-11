/**
 * Groups a list of items into a Map keyed by the value returned from keySelector.
 */
export function groupByToMap<T, K extends string | number | symbol>(
  items: readonly T[],
  keySelector: (item: T) => K
): Map<K, T[]> {
  const result = new Map<K, T[]>();
  for (const item of items) {
    const key = keySelector(item);
    const group = result.get(key);
    if (group) {
      group.push(item);
    } else {
      result.set(key, [item]);
    }
  }
  return result;
}

export function groupByToMapSingle<T, K extends string | number | symbol>(
  items: readonly T[],
  keySelector: (item: T) => K
): Map<K, T> {
  const result = new Map<K, T>();
  for (const item of items) {
    const key = keySelector(item);
    let group = result.get(key);
    if (group) {
      group = item;
    } else {
      result.set(key, item);
    }
  }
  return result;
}

export function mapToRecord<T, K extends string | number | symbol>(map: Map<K, T>): Record<K, T> {
  const newObject: Record<K, T> = {} as Record<K, T>;
  for (let [key, value] of map.entries()) {
    newObject[key] = value;
  }
  return newObject;
}
