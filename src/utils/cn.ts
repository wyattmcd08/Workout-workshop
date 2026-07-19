/** Joins truthy class names. Keeps JSX free of template-string noise. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
