import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { usePrimaryActionButton } from '../../../src/composables/usePrimaryActionButton'

describe('usePrimaryActionButton', () => {
  it('actif : primary et élévation lg', () => {
    const { buttonColor, buttonElevation } = usePrimaryActionButton(ref(false))
    expect(buttonColor.value).toBe('primary')
    expect(buttonElevation.value).toBe('lg')
  })

  it('bloqué : ni couleur ni élévation en ligne, la règle de l’état désactivé s’applique', () => {
    const blocked = ref(true)
    const { buttonColor, buttonElevation } = usePrimaryActionButton(blocked)
    expect(buttonColor.value).toBeUndefined()
    expect(buttonElevation.value).toBeUndefined()
    blocked.value = false
    expect(buttonColor.value).toBe('primary')
  })

  it('couleur et élévation fournies (confirmation de dialogue) : reprises quand actif, retirées quand bloqué', () => {
    const blocked = ref(false)
    const { buttonColor, buttonElevation } = usePrimaryActionButton(blocked, { color: () => 'danger', elevation: () => undefined })
    expect(buttonColor.value).toBe('danger')
    expect(buttonElevation.value).toBeUndefined()
    blocked.value = true
    expect(buttonColor.value).toBeUndefined()
  })
})
