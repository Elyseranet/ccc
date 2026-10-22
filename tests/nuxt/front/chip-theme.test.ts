import { describe, expect, it } from 'vitest'
import { CCC_HH_BASE } from '~/themes/ccc.theme'

describe('origam-chip, défaut du thème (F-00n)', () => {
  const chip = CCC_HH_BASE.components?.['origam-chip'] as Record<string, unknown>

  it('famille neutre : texte text.secondary sur surface.overlay, par des tokens', () => {
    expect(chip.color).toBe('var(--origam-color__text---secondary)')
    expect(chip.bgColor).toBe('var(--origam-color__surface---overlay)')
  })

  it('garde les props de forme du thème', () => {
    expect(chip).toMatchObject({ size: 'small', pill: true, border: false, fontWeight: 'bold' })
  })
})
