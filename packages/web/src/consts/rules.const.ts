import { RULES_TAB } from '../enums/rules-tab.enum.js'
import type { IRulesFact, IRulesStep, IRulesTournamentCard, IRulesVariant } from '../interfaces/rules.interface.js'

export const RULES_DEFAULT_TAB = RULES_TAB.GAME
export const RULES_TAB_VALUES: string[] = Object.values(RULES_TAB)

export const RULES_FACTS: IRulesFact[] = [
  { id: 'players', label: { key: 'rules.fact_players', fallback: 'Joueurs' }, value: '2' },
  { id: 'distance', label: { key: 'rules.fact_distance', fallback: 'Distance' }, value: '2 m' },
  { id: 'format', label: { key: 'rules.fact_format', fallback: 'Format' }, value: '5 / 10' }
]

export const RULES_STEPS: IRulesStep[] = [
  { id: 'throw', title: { key: 'rules.step_throw_title', fallback: 'Le lancer' }, text: { key: 'rules.step_throw_text', fallback: 'Le joueur lance sa capsule vers la capsule posée sur la bière adverse.' } },
  { id: 'reply', title: { key: 'rules.step_reply_title', fallback: 'La réplique' }, text: { key: 'rules.step_reply_text', fallback: 'Après une touche, l’adversaire joue à son tour.' } },
  { id: 'point', title: { key: 'rules.step_point_title', fallback: 'Le point' }, text: { key: 'rules.step_point_text', fallback: 'Si l’adversaire ne touche pas la capsule, le lanceur marque un point.' } },
  { id: 'counter', title: { key: 'rules.step_counter_title', fallback: 'Le contre-caps' }, text: { key: 'rules.step_counter_text', fallback: 'Si l’adversaire touche lui aussi, personne ne marque.' } }
]

export const RULES_TOURNAMENT_CARDS: IRulesTournamentCard[] = [
  { id: 'pools_score', eyebrow: { key: 'rules.card_format', fallback: 'Format' }, bigValue: '5', bigUnit: { key: 'rules.unit_points', fallback: 'pts' }, text: { key: 'rules.card_pools_score_text', fallback: 'Les matchs de poule se jouent en une bière : le vainqueur marque 5 points.' } },
  { id: 'final_score', eyebrow: { key: 'rules.card_format', fallback: 'Format' }, bigValue: '10', bigUnit: { key: 'rules.unit_points', fallback: 'pts' }, isAmber: true, text: { key: 'rules.card_final_score_text', fallback: 'La phase finale se joue en deux bières : le vainqueur marque 10 points.' } },
  { id: 'pools_all', eyebrow: { key: 'rules.card_pools_eyebrow', fallback: 'Poules' }, title: { key: 'rules.card_pools_all_title', fallback: 'Tout le monde se rencontre' }, text: { key: 'rules.card_pools_all_text', fallback: 'Chaque poule est un tournoi complet : 10 matchs à 5 joueurs, 15 à 6, 21 à 7. Une tête de série par poule, issue du classement ACP ; les autres joueurs sont tirés au sort, poule après poule, par une main innocente.' } },
  { id: 'tiebreak', eyebrow: { key: 'rules.card_tiebreak_eyebrow', fallback: 'Départage en poule' }, title: { key: 'rules.card_tiebreak_title', fallback: 'Victoires, cap’s average, confrontation' }, text: { key: 'rules.card_tiebreak_text', fallback: 'Entre poules de tailles différentes : ratio de victoires, puis cap’s average par match. À trois ou plus toujours à égalité : un match à trois, premier à 3 points.' } },
  { id: 'final_draw', eyebrow: { key: 'rules.card_final_eyebrow', fallback: 'Phase finale' }, title: { key: 'rules.card_final_draw_title', fallback: 'Un tirage à chaque tour' }, text: { key: 'rules.card_final_draw_text', fallback: 'Aucune affiche n’est connue à l’avance : les qualifiés sont tirés au sort au début de chaque tour, des barrages jusqu’à la finale.' } },
  { id: 'uneven', eyebrow: { key: 'rules.card_uneven_eyebrow', fallback: 'Poules inégales' }, title: { key: 'rules.card_uneven_title', fallback: 'Une bière d’avance' }, text: { key: 'rules.card_uneven_text', fallback: 'Quand les poules n’ont pas la même taille, les joueurs des poules les moins nombreuses boivent une bière entre le tirage et le début des matchs.' } }
]

export const RULES_VARIANTS: IRulesVariant[] = [
  {
    id: 'pyramid',
    number: '01',
    name: { key: 'rules.variant_pyramid_name', fallback: 'La Pyramide' },
    description: { key: 'rules.variant_pyramid_text', fallback: '3 bières disposées en triangle.' },
    figureLabel: { key: 'rules.variant_pyramid_figure', fallback: 'Vue du dessus : trois bières en triangle, une à l’avant et deux à l’arrière.' },
    beers: [
      { x: 60, y: 40, radius: 9, capRadius: 4 },
      { x: 48, y: 62, radius: 9, capRadius: 4 },
      { x: 72, y: 62, radius: 9, capRadius: 4 }
    ]
  },
  {
    id: 'bowling',
    number: '02',
    name: { key: 'rules.variant_bowling_name', fallback: 'Le Bowling' },
    description: { key: 'rules.variant_bowling_text', fallback: '10 bières disposées en triangle, façon quilles de bowling.' },
    figureLabel: { key: 'rules.variant_bowling_figure', fallback: 'Vue du dessus : dix bières en triangle sur quatre rangées, une, deux, trois puis quatre.' },
    beers: [
      { x: 60, y: 20, radius: 7.5, capRadius: 3.4 },
      { x: 50, y: 38, radius: 7.5, capRadius: 3.4 },
      { x: 70, y: 38, radius: 7.5, capRadius: 3.4 },
      { x: 40, y: 56, radius: 7.5, capRadius: 3.4 },
      { x: 60, y: 56, radius: 7.5, capRadius: 3.4 },
      { x: 80, y: 56, radius: 7.5, capRadius: 3.4 },
      { x: 30, y: 74, radius: 7.5, capRadius: 3.4 },
      { x: 50, y: 74, radius: 7.5, capRadius: 3.4 },
      { x: 70, y: 74, radius: 7.5, capRadius: 3.4 },
      { x: 90, y: 74, radius: 7.5, capRadius: 3.4 }
    ]
  },
  {
    id: 'podium',
    number: '03',
    name: { key: 'rules.variant_podium_name', fallback: 'Le Podium' },
    description: { key: 'rules.variant_podium_text', fallback: '3 hauteurs : haute au centre, moyenne à gauche, basse à droite.' },
    figureLabel: { key: 'rules.variant_podium_figure', fallback: 'Vue de face : trois bières sur des socles, la plus haute au centre, la moyenne à gauche, la plus basse à droite.' },
    bars: [
      { x: 18, y: 58, width: 26, height: 42 },
      { x: 47, y: 30, width: 26, height: 70 },
      { x: 76, y: 76, width: 26, height: 24 }
    ],
    beers: [
      { x: 31, y: 48, radius: 8, capRadius: 3.6 },
      { x: 60, y: 20, radius: 8, capRadius: 3.6 },
      { x: 89, y: 66, radius: 8, capRadius: 3.6 }
    ],
    labels: [
      { x: 31, y: 94, text: { key: 'rules.variant_podium_left', fallback: 'G' } },
      { x: 60, y: 94, text: { key: 'rules.variant_podium_center', fallback: 'C' } },
      { x: 89, y: 94, text: { key: 'rules.variant_podium_right', fallback: 'D' } }
    ]
  }
]
