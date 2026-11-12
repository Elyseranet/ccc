import { ROUTES } from './routes.const.js'
import { LEGAL_BLOCK } from '../enums/legal-block.enum.js'
import type { ILegalPageContent } from '../interfaces/legal.interface.js'

export const LEGAL_ACCESSIBILITY_CONTENT: ILegalPageContent = {
  path: ROUTES.ACCESSIBILITY,
  title: { key: 'legal.accessibility.title', fallback: 'Déclaration d’accessibilité' },
  updated: { key: 'legal.common.updated_value', fallback: '[À FOURNIR : date de mise à jour]' },
  sections: [
    {
      id: 'etat',
      title: { key: 'legal.accessibility.status_title', fallback: 'État de conformité' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.accessibility.status_text', fallback: 'Aucun audit RGAA complet n’a été réalisé : le site n’est donc pas déclaré « conforme ».' } }
      ]
    },
    {
      id: 'fait',
      title: { key: 'legal.accessibility.done_title', fallback: 'Ce qui est fait' },
      blocks: [
        {
        kind: LEGAL_BLOCK.LIST,
        items: [
          { key: 'legal.accessibility.done_axe', fallback: 'Tests automatisés (axe) sur les pages.' },
          { key: 'legal.accessibility.done_keyboard', fallback: 'Navigation au clavier ; lien d’évitement.' },
          { key: 'legal.accessibility.done_motion', fallback: 'Réduction des animations pour les personnes qui le demandent (prefers-reduced-motion).' }
        ]
      }
      ]
    },
    {
      id: 'manque',
      title: { key: 'legal.accessibility.missing_title', fallback: 'Ce qui n’est pas fait' },
      blocks: [
        {
        kind: LEGAL_BLOCK.LIST,
        items: [
          { key: 'legal.accessibility.missing_audit', fallback: 'Pas d’audit RGAA complet ni de test avec lecteurs d’écran sur tous les parcours.' }
        ]
      }
      ]
    },
    {
      id: 'connus',
      title: { key: 'legal.accessibility.known_title', fallback: 'Défauts connus' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.accessibility.known_intro', fallback: 'Défauts connus ou identifiés, certains venant de la bibliothèque de composants Origam :' } },
        {
        kind: LEGAL_BLOCK.LIST,
        items: [
          { key: 'legal.accessibility.known_contrast', fallback: 'Contraste des bordures des champs de formulaire inférieur à 3:1 : identifié par l’audit, mesure en cours.' },
          { key: 'legal.accessibility.known_sort', fallback: 'Le tri des colonnes de l’annuaire des joueurs (/joueurs) n’est pas utilisable au clavier (composant Origam, issue n° 1341) : identifié par l’audit, mesure en cours.' },
          { key: 'legal.accessibility.known_chips', fallback: 'Les puces-filtres des matchs d’une édition signalent leur état par la couleur seule : identifié par l’audit, mesure en cours.' },
          { key: 'legal.accessibility.known_score', fallback: 'Sur l’accueil, le score d’un match peut être lu sans son séparateur par un lecteur d’écran : identifié par l’audit, mesure en cours.' },
          { key: 'legal.accessibility.known_motion', fallback: 'Les animations en boucle de l’accueil n’ont pas encore de bouton de mise en pause (il est prévu) : identifié par l’audit, mesure en cours.' },
          { key: 'legal.accessibility.known_abbreviations', fallback: 'Des abréviations (J, V, D, Diff., Q, ACP) ne sont pas expliquées : identifié par l’audit, mesure en cours.' },
          { key: 'legal.accessibility.known_suggestions', fallback: 'Dans l’administration (hors pages publiques), le menu de suggestions de la recherche de participant expose des rôles ARIA invalides (composant Origam, issue n° 1331).' }
        ]
      },
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.accessibility.known_note', fallback: 'L’audit dont ces points sont tirés est statique : aucune mesure avec un outil ou un lecteur d’écran n’a encore confirmé chacun d’eux.' } }
      ]
    },
    {
      id: 'contact',
      title: { key: 'legal.accessibility.contact_title', fallback: 'Contact et voies de recours' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.accessibility.contact_text', fallback: 'Signaler un problème : [À FOURNIR : adresse email de contact accessibilité]' } },
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.accessibility.contact_remedies', fallback: '[À FOURNIR : voies de recours, à confirmer avec le statut de l’éditeur]' } }
      ]
    }
  ],
  related: [
    { to: ROUTES.LEGAL_NOTICE, label: { key: 'legal.notice.title', fallback: 'Mentions légales' } },
    { to: ROUTES.PRIVACY, label: { key: 'legal.privacy.title', fallback: 'Politique de confidentialité' } },
    { to: ROUTES.TERMS, label: { key: 'legal.terms.title', fallback: 'Conditions d’utilisation' } }
  ]
}
