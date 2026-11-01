/**
 * Identifiants générés côté code, pour relier des lignes insérées en lot sans dépendre de l'ordre du `RETURNING`
 * (PostgreSQL ne le garantit pas). `node:crypto` est importé dynamiquement : le module reste inoffensif dans le
 * graphe navigateur (garde `client-import-graph`) et n'est jamais appelé par le code navigateur.
 */
export const generateUuids = async (count: number): Promise<string[]> => {
  const { randomUUID } = await import('node:crypto')
  return Array.from({ length: count }, () => randomUUID())
}
