import frenchTranslations from '../assets/locales/fr.json'

export const useT = () => {
  const translations: Record<string, string> = frenchTranslations
  const t = (key: string, fallback: string, params: Record<string, string | number> = {}): string => {
    let message = translations[key] ?? fallback
    for (const [name, value] of Object.entries(params)) {
      message = message.replaceAll(`{${name}}`, String(value))
    }
    return message
  }

  return { t }
}
