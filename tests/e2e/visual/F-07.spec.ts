import { test } from '@playwright/test'
import { markAwaitingRoutes } from '../helpers/pending-routes'
import { signIn } from '../helpers/session'
import type { IDataMasks } from '../visual.util'
import { box, compare, open } from '../visual.util'

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '1440', width: 1440, height: 900 }
]

const ROUTE = '/admin'

/*********************************************************
 * Zones F-07 (admin.html, 5317b84)
 *
 * @description
 * Seules les VALEURS de données sont masquées (nombres, sous-titres d'étape, année, lignes d'activité), jamais la structure :
 * filet, fond, rayon et gabarit des cartes et des étapes restent comparés (ARCH-9, F-14 M1).
 * Les sélecteurs de l'application s'appuient sur les `data-cy` de la page ; ceux des parties d'Origam
 * (`.origam-stepper-item__subtitle`, `.origam-badge`) viennent de la lecture du source 2.37.4 et sont à confirmer au premier
 * passage en navigateur.
 ********************************************************/
const HEAD_MASKS: IDataMasks = {
  mockup: ['.adm-head .adm-h1', '.adm-head .chip'],
  app: ['[data-cy="page-title"]', '[data-cy="admin-dashboard-cta"] .origam-badge']
}
const STEPS_MASKS: IDataMasks = {
  mockup: ['.adm-steps .adm-card-h .num', '.adm-steps .st__b small'],
  app: ['[data-cy="admin-control-center-progress"]', '[data-cy="admin-control-center"] .origam-stepper-item__subtitle']
}
const TODO_MASKS: IDataMasks = {
  mockup: ['.adm-task__n', '.adm-task small'],
  app: ['[data-cy^="admin-todo-"] .todo__count', '[data-cy^="admin-todo-"] small']
}
const LOG_MASKS: IDataMasks = {
  mockup: ['.adm-log .log'],
  app: ['[data-cy="admin-activity"] .activity__list']
}

const ZONES = [
  { name: 'admin-tableau-titre', mockup: '.adm-head', app: '.dashboard__head', masks: HEAD_MASKS, needsActivityRoute: false },
  { name: 'admin-tableau-centre', mockup: '.adm-steps', app: '[data-cy="admin-control-center"]', masks: STEPS_MASKS, needsActivityRoute: false },
  { name: 'admin-tableau-a-traiter', mockup: '.adm-todo', app: '[data-cy="admin-todo"]', masks: TODO_MASKS, needsActivityRoute: false },
  { name: 'admin-tableau-activite', mockup: '.adm-log', app: '[data-cy="admin-activity"]', masks: LOG_MASKS, needsActivityRoute: true }
]

for (const viewport of VIEWPORTS) {
  test.describe(`F-07 admin tableau de bord @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const zone of ZONES) {
      test(zone.name, async ({ page, browser, context }) => {
        const awaiting = markAwaitingRoutes(ROUTE)
        test.fixme(zone.needsActivityRoute && awaiting.length > 0, `awaiting-route ${awaiting.join(', ')} : l'activité n'a pas de route`)
        await signIn(context, 'admin')
        const { mockup, mockContext } = await open(page, browser, viewport, 'admin.html', ROUTE)
        const mockBox = await box(mockup, zone.mockup)
        const appBox = await box(page, zone.app)
        await compare(page, mockup, zone.name, viewport.name, mockBox, appBox, zone.masks)
        await mockContext.close()
      })
    }
  })
}
