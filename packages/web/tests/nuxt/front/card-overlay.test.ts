import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/*********************************************************
 * Carte cliquable : l'overlay reste transparent au repos (F-00t)
 *
 * @description
 * Origam pose `.origam-card > * { opacity: var(--origam-card---opacity) }` (spécificité 0,2,0) qui écrase l'opacité de
 * l'overlay : une carte cliquable est alors noire au repos. `main.css` porte le contournement ; l'opacité calculée
 * (repos 0, survol 0,12) est mesurée en navigateur par les e2e des pages qui ont des cartes cliquables (F-01).
 * Ce test garde la règle elle-même : même propriété, une classe de plus que celle d'Origam.
 ********************************************************/
const css = readFileSync('src/assets/css/main.css', 'utf8')
const rule = css.split('\n').find(line => line.includes('.origam-card__overlay')) ?? ''

describe('overlay des cartes cliquables (F-00t)', () => {
  it('main.css redonne à l’overlay sa propre opacité, avec une spécificité supérieure à celle d’Origam', () => {
    expect(rule).toContain('opacity: var(--origam-card__overlay---opacity, 0)')
    const selector = rule.slice(0, rule.indexOf('{')).trim()
    const classCount = selector.match(/\.[a-z][\w-]*/g)?.length ?? 0
    expect(classCount).toBeGreaterThanOrEqual(3)
    expect(rule).not.toContain('!important')
  })
})
