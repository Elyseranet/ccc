import frenchTranslations from '~/locales/fr.json'

export const useT = () => {
  const translations: Record<string, string> = frenchTranslations
  const t = (key: string, fallback: string): string => translations[key] ?? fallback

  return { t }
}
