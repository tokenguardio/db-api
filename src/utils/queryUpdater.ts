function extractQueryParameters(
  decodedQuery: string,
  pattern: RegExp
): string[] {
  const matches = decodedQuery.matchAll(pattern);
  return Array.from(
    new Set([...matches].map((match) => match[0].replace(/:/g, "")))
  );
}

export { extractQueryParameters };
