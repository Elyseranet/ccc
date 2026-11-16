/** Entier tiré uniformément dans [0, maxExclusive) : `crypto.randomInt` en production, un générateur injecté dans les tests. */
export type TRandomInt = (maxExclusive: number) => number
