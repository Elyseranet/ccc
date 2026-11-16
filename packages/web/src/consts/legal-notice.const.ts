import { ROUTES } from './routes.const.js'
import { LEGAL_BLOCK } from '../enums/legal-block.enum.js'
import type { ILegalPageContent } from '../interfaces/legal.interface.js'

export const LEGAL_NOTICE_CONTENT: ILegalPageContent = {
  path: ROUTES.LEGAL_NOTICE,
  title: { key: 'legal.notice.title', fallback: 'Mentions légales' },
  updated: { key: 'legal.common.updated_value', fallback: '[À FOURNIR : date de mise à jour]' },
  sections: [
    {
      id: 'editeur',
      title: { key: 'legal.notice.publisher_title', fallback: 'Éditeur' },
      blocks: [
        {
        kind: LEGAL_BLOCK.DEFINITIONS,
        definitions: [
          { term: { key: 'legal.notice.publisher_name_label', fallback: 'Dénomination' }, description: { key: 'legal.notice.publisher_name_value', fallback: 'Elysera (éditeur déclaré) [À FOURNIR : dénomination exacte]' } },
          { term: { key: 'legal.notice.publisher_form_label', fallback: 'Forme juridique' }, description: { key: 'legal.notice.publisher_form_value', fallback: '[À FOURNIR : forme juridique]' } },
          { term: { key: 'legal.notice.publisher_capital_label', fallback: 'Capital' }, description: { key: 'legal.notice.publisher_capital_value', fallback: '[À FOURNIR : capital]' } },
          { term: { key: 'legal.notice.publisher_seat_label', fallback: 'Siège' }, description: { key: 'legal.notice.publisher_seat_value', fallback: '[À FOURNIR : adresse du siège]' } },
          { term: { key: 'legal.notice.publisher_registry_label', fallback: 'RCS / SIREN' }, description: { key: 'legal.notice.publisher_registry_value', fallback: '[À FOURNIR : SIREN ou RCS]' } }
        ]
      }
      ]
    },
    {
      id: 'directeur',
      title: { key: 'legal.notice.director_title', fallback: 'Directeur de la publication' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.notice.director_text', fallback: '[À FOURNIR : nom du directeur de la publication]' } }
      ]
    },
    {
      id: 'hebergeur',
      title: { key: 'legal.notice.host_title', fallback: 'Hébergeur' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.notice.host_text', fallback: '[À FOURNIR : société de l’hébergeur du serveur] · [À FOURNIR : adresse] · [À FOURNIR : téléphone]' } }
      ]
    },
    {
      id: 'contact',
      title: { key: 'legal.notice.contact_title', fallback: 'Contact' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.notice.contact_text', fallback: '[À FOURNIR : email de contact] · [À FOURNIR : téléphone de contact]' } }
      ]
    },
    {
      id: 'pi',
      title: { key: 'legal.notice.ip_title', fallback: 'Propriété intellectuelle' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.notice.ip_text', fallback: '[À FOURNIR : texte à rédiger et à relire : propriété intellectuelle (contenus du site, marque, contenus déposés par les joueurs, droit de retrait)]' } }
      ]
    },
    {
      id: 'credits',
      title: { key: 'legal.notice.credits_title', fallback: 'Crédits' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.notice.credits_text', fallback: 'Site réalisé par Elysera avec Origam.' } },
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.notice.credits_fonts', fallback: '[À FOURNIR : licence des polices, à citer une fois vérifiée]' } }
      ]
    }
  ],
  related: [
    { to: ROUTES.PRIVACY, label: { key: 'legal.privacy.title', fallback: 'Politique de confidentialité' } },
    { to: ROUTES.TERMS, label: { key: 'legal.terms.title', fallback: 'Conditions d’utilisation' } },
    { to: ROUTES.ACCESSIBILITY, label: { key: 'legal.accessibility.title', fallback: 'Déclaration d’accessibilité' } }
  ]
}
