import { ROUTES } from './routes.const.js'
import { LEGAL_BLOCK } from '../enums/legal-block.enum.js'
import type { ILegalPageContent } from '../interfaces/legal.interface.js'

export const LEGAL_TERMS_CONTENT: ILegalPageContent = {
  path: ROUTES.TERMS,
  title: { key: 'legal.terms.title', fallback: 'Conditions d’utilisation' },
  updated: { key: 'legal.common.updated_value', fallback: '[À FOURNIR : date de mise à jour]' },
  sections: [
    {
      id: 'objet',
      title: { key: 'legal.terms.purpose_title', fallback: 'Objet et éditeur' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.terms.purpose_text', fallback: 'Conditions d’utilisation du site CCC édité par Elysera (voir les mentions légales).' } }
      ]
    },
    {
      id: 'acces',
      title: { key: 'legal.terms.access_title', fallback: 'Accès au service' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.terms.access_text', fallback: 'Accès gratuit. Consultation sans compte.' } }
      ]
    },
    {
      id: 'compte',
      title: { key: 'legal.terms.account_title', fallback: 'Comptes' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.terms.account_text', fallback: 'Création de compte sur invitation ; exactitude des informations ; confidentialité du mot de passe. Réservé aux majeurs.' } }
      ]
    },
    {
      id: 'contenus',
      title: { key: 'legal.terms.content_title', fallback: 'Contenus déposés' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.terms.content_text', fallback: 'Photo : droit de l’utilisateur sur l’image, interdiction des contenus illicites, droit de retrait.' } }
      ]
    },
    {
      id: 'conduite',
      title: { key: 'legal.terms.conduct_title', fallback: 'Règles de conduite' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.terms.conduct_text', fallback: '[À FOURNIR : texte à rédiger et à relire : règles de conduite]' } }
      ]
    },
    {
      id: 'pi',
      title: { key: 'legal.terms.ip_title', fallback: 'Propriété intellectuelle' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.terms.ip_text', fallback: 'Marque, Origam, Elysera.' } }
      ]
    },
    {
      id: 'exactitude',
      title: { key: 'legal.terms.accuracy_title', fallback: 'Exactitude des résultats et archives' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.terms.accuracy_text', fallback: 'Pas de garantie d’exactitude des archives.' } }
      ]
    },
    {
      id: 'suspension',
      title: { key: 'legal.terms.suspension_title', fallback: 'Suspension et suppression de compte' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.terms.suspension_text', fallback: '[À FOURNIR : texte à rédiger et à relire : suspension et suppression de compte]' } }
      ]
    },
    {
      id: 'responsabilite',
      title: { key: 'legal.terms.liability_title', fallback: 'Limitation de responsabilité' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.terms.liability_text', fallback: '[À FOURNIR : texte à rédiger et à relire : limitation de responsabilité, à relire par un juriste]' } }
      ]
    },
    {
      id: 'donnees',
      title: { key: 'legal.terms.data_title', fallback: 'Données personnelles' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.terms.data_text', fallback: 'Le traitement des données personnelles est décrit dans la politique de confidentialité.' } },
        { kind: LEGAL_BLOCK.LINK, link: { text: { key: 'legal.terms.data_link', fallback: 'Politique de confidentialité' }, to: ROUTES.PRIVACY } }
      ]
    },
    {
      id: 'droit',
      title: { key: 'legal.terms.law_title', fallback: 'Droit applicable et litiges' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.terms.law_text', fallback: 'Droit français. Médiateur de la consommation : [À FOURNIR : à décider avec un juriste : applicable ou non]' } }
      ]
    },
    {
      id: 'modification',
      title: { key: 'legal.terms.changes_title', fallback: 'Modification des conditions' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.terms.changes_text', fallback: '[À FOURNIR : texte à rédiger et à relire : modification des conditions]' } }
      ]
    }
  ],
  related: [
    { to: ROUTES.LEGAL_NOTICE, label: { key: 'legal.notice.title', fallback: 'Mentions légales' } },
    { to: ROUTES.PRIVACY, label: { key: 'legal.privacy.title', fallback: 'Politique de confidentialité' } },
    { to: ROUTES.ACCESSIBILITY, label: { key: 'legal.accessibility.title', fallback: 'Déclaration d’accessibilité' } }
  ]
}
