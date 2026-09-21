/**
 * A submission body is free-form JSON: one row of the `content` column holds whatever the
 * form that created it wrote. Rather than typing the boundary as `any` and letting unknown
 * values flow into JSX, keep the body `unknown`-safe and narrow it at each read, so a
 * malformed row degrades to an empty field instead of a runtime crash.
 */
export type SubmissionContent = Record<string, unknown>;

/** Narrow the whole body or one field to the shape a component declares. */
export function draft<T>(value: unknown): T | undefined {
  if (value === null || value === undefined) return undefined;
  return value as T;
}
