export function routeParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') {
    return value;
  }

  return value?.[0] ?? '';
}
