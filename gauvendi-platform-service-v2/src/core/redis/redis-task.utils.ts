
export function buildTaskKeyPrefix(namespace: string, context: string): string {
  return `${namespace}:${context}`;
}


export function stringifyIdentifier(identifier: string | Record<string, string>): string {
  if (typeof identifier === 'string') {
    return identifier;
  }

  // Convert object to sorted key:value pairs joined by ':'
  return Object.entries(identifier)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => value)
    .filter(Boolean)
    .join(':');
}
