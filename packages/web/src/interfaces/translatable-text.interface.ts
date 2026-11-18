/** Texte traduisible : clé i18n, repli français et paramètres. Fichier à part pour que le code serveur (sans lib DOM) puisse l'importer. */
export interface ITranslatableText {
  key: string
  fallback: string
  params?: Record<string, string | number>
}
