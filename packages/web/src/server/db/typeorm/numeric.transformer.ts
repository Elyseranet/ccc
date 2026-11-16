import type { ValueTransformer } from 'typeorm'

/** pg renvoie `numeric` en chaîne : on le convertit en nombre (points à deux décimales, RG2). */
export const nullableNumericTransformer: ValueTransformer = {
  to: (value: number | null | undefined): number | null | undefined => value,
  from: (value: string | null): number | null => (value === null ? null : Number(value))
}
