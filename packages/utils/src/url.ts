export function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  try {
    const search = new URL(url, 'https://localhost').searchParams;
    search.forEach((value, key) => {
      params[key] = value;
    });
  } catch {
    // ignore invalid URL
  }
  return params;
}
