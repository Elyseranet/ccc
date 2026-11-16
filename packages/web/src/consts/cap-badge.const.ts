import { CAP_TONE } from '../enums/cap-tone.enum.js'

/** Position verticale du texte de la capsule (unités du viewBox 100 x 100) : la valeur des capsules à chiffre de l'édition, du palmarès et de l'accueil. */
export const CAP_BADGE_DEFAULT_TEXT_Y = 58

/** Taille du texte de la capsule, en unités du viewBox (la capsule de la page d'erreur). */
export const CAP_BADGE_DEFAULT_TEXT_SIZE = 26

/** Teinte de la coque de la capsule, par jeton : l'ambre de la marque, le néon et la glace de la pinte de l'accueil. */
export const CAP_TONE_FILL: Readonly<Record<CAP_TONE, string>> = {
  [CAP_TONE.AMBER]: 'var(--origam-color__bar---amber)',
  [CAP_TONE.NEON]: 'var(--origam-color__bar---neon)',
  [CAP_TONE.ICE]: 'var(--origam-color__bar---ice)'
}
