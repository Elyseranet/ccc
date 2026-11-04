import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import DrawAssignment from '../../../src/components/admin/draws/DrawAssignment.vue'
import DrawSeeds from '../../../src/components/admin/draws/DrawSeeds.vue'
import DrawSteps from '../../../src/components/admin/draws/DrawSteps.vue'
import { POOL_DRAW_SAVE_STATE, POOL_DRAW_STEP } from '../../../src/enums/pool-draw.enum'
import type { IPoolDrawPlayer, IPoolDrawPool } from '../../../src/interfaces/pool-draw.interface'
import { buildEmptyPools, buildSteps, drawProgress, placePlayer } from '../../../src/utils/pool-draw.util'

const player = (id: string, name: string): IPoolDrawPlayer => ({ participationId: id, competitor: { id: `c-${id}`, displayName: name }, initials: name.slice(0, 2).toUpperCase() })
const players = [player('p1', 'Maya Legrand'), player('p2', 'Clara Lambert'), player('p3', 'Paul Girard'), player('p4', 'Alice Vincent'), player('p5', 'Côme Michel')]

const assignmentProps = (pools: IPoolDrawPool[], saveState = POOL_DRAW_SAVE_STATE.SAVED) => ({
  pools,
  players,
  unplaced: players.filter(entry => !pools.some(pool => pool.members.some(member => member.participationId === entry.participationId))),
  seedRows: [{ participationId: 'p1', competitor: players[0]!.competitor, rank: 1, acp: 20.4 }],
  progress: drawProgress(pools, 5),
  poolCount: 2,
  saveState,
  readOnly: false,
  complete: false
})

describe('DrawSteps', () => {
  it('cinq étapes, l’étape de saisie est la troisième et les deux premières sont faites', async () => {
    const wrapper = await mountSuspended(DrawSteps, { props: { steps: buildSteps(POOL_DRAW_STEP.ENTRY) } })
    const items = wrapper.get('[data-cy="draw-steps-horizontal"]').findAll('[data-cy^="stepper-item-"]')
    expect(items).toHaveLength(5)
    expect(items[0]!.classes().join(' ')).toContain('done')
    expect(items[2]!.classes().join(' ')).toContain('active')
    expect(items[4]!.classes().join(' ')).toContain('pending')
  })
})

describe('DrawAssignment : saisie', () => {
  const pools = buildEmptyPools(['p1', 'p2'], 5)

  it('la tête de série est en place 1 de chaque poule, avec sa pastille, sans bouton « Changer »', async () => {
    const wrapper = await mountSuspended(DrawAssignment, { props: assignmentProps(pools) })
    const first = wrapper.get('[data-cy="draw-slot-1-1"]')
    expect(first.text()).toContain('Maya Legrand')
    expect(first.text()).toContain('Tête de série')
    expect(wrapper.find('[data-cy="draw-change-1-1"]').exists()).toBe(false)
  })

  it('les places libres proposent une liste ; le compteur de poule et l’avancement suivent la saisie', async () => {
    const placed = placePlayer(pools, 1, 'p3')
    const wrapper = await mountSuspended(DrawAssignment, { props: assignmentProps(placed) })
    expect(wrapper.get('[data-cy="draw-pool-1"]').text()).toContain('2/3')
    expect(wrapper.get('[data-cy="draw-pool-2"]').text()).toContain('1/2')
    expect(wrapper.find('[data-cy="draw-select-1-3"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="draw-select-1-2"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="draw-progress-text"]').text()).toBe('3 / 5 joueurs placés')
    expect(wrapper.get('[data-cy="draw-change-1-2"]').exists()).toBe(true)
  })

  it('un joueur placé disparaît de la liste « À placer »', async () => {
    const wrapper = await mountSuspended(DrawAssignment, { props: assignmentProps(placePlayer(pools, 1, 'p3')) })
    const rest = wrapper.findAll('[data-cy="draw-rest-item"]').map(item => item.text())
    expect(rest).toHaveLength(2)
    expect(rest.join(' ')).not.toContain('Paul Girard')
  })

  it('un enregistrement échoué est signalé, avec l’action de renvoyer', async () => {
    const wrapper = await mountSuspended(DrawAssignment, { props: assignmentProps(placePlayer(pools, 1, 'p3'), POOL_DRAW_SAVE_STATE.FAILED) })
    expect(wrapper.get('[data-cy="draw-unsaved"]').text()).toContain('n’est pas enregistrée')
    await wrapper.get('[data-cy="draw-retry-save"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('en lecture seule (tirage validé), ni sélecteur ni « Changer »', async () => {
    const wrapper = await mountSuspended(DrawAssignment, { props: { ...assignmentProps(placePlayer(pools, 1, 'p3')), readOnly: true } })
    expect(wrapper.find('[data-cy="draw-change-1-2"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="draw-select-1-3"] input').attributes('disabled')).toBeDefined()
  })
})

describe('DrawSeeds : égalité non tranchée (RG10)', () => {
  const seeds = [{ participationId: 'b', competitor: { id: 'cb', displayName: 'B' }, rank: 2, acp: 10 }, { participationId: 'c', competitor: { id: 'cc', displayName: 'C' }, rank: 2, acp: 10 }]
  const tieGroups = [{ index: 0, needed: 1, candidates: [...seeds, { participationId: 'd', competitor: { id: 'cd', displayName: 'D' }, rank: 2, acp: 10 }] }]

  it('l’écran montre les ex æquo et laisse l’administrateur choisir, sans départage inventé', async () => {
    const wrapper = await mountSuspended(DrawSeeds, { props: { seeds, selectedIds: ['b'], tieGroups, choices: { 0: ['b'] }, poolCount: 1, issue: null, canConfirm: true, busy: false } })
    expect(wrapper.get('[data-cy="draw-seed-tie"]').text()).toContain('1 sur 3 à retenir')
    expect(wrapper.get('[data-cy="draw-seed-tie"]').text()).toContain('ne les départage pas')
    expect(wrapper.findAll('[data-cy^="draw-seed-choice-"]')).toHaveLength(3)
    await wrapper.get('[data-cy="draw-seed-choice-d"] input').setValue(true)
    expect(wrapper.emitted('toggle')?.[0]).toEqual([0, 'd'])
  })

  it('« Ouvrir le tirage » est inactif tant que la sélection est incomplète', async () => {
    const wrapper = await mountSuspended(DrawSeeds, { props: { seeds, selectedIds: [], tieGroups, choices: { 0: [] }, poolCount: 1, issue: { key: 'admin.draws.issue_seed_count', fallback: 'Il faut autant de têtes de série que de poules ({pools}) : {seeds} choisies.', params: { pools: 1, seeds: 0 } }, canConfirm: false, busy: false } })
    expect(wrapper.get('[data-cy="draw-seeds-confirm"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-cy="draw-seeds-issue"]').text()).toContain('autant de têtes de série que de poules')
  })
})
