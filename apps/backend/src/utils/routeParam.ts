/** Normalize Express route params (string | string[] in Express 5). */
export function routeParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}
