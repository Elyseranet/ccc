import { ROUTES } from './routes.const.js'
import { LEGAL_BLOCK } from '../enums/legal-block.enum.js'
import type { ILegalPageContent } from '../interfaces/legal.interface.js'

export const LEGAL_PRIVACY_CONTENT: ILegalPageContent = {
  path: ROUTES.PRIVACY,
  title: { key: 'legal.privacy.title', fallback: 'Politique de confidentialité' },
  updated: { key: 'legal.common.updated_value', fallback: '[À FOURNIR : date de mise à jour]' },
  sections: [
    {
      id: 'responsable',
      title: { key: 'legal.privacy.controller_title', fallback: 'Responsable de traitement et contact' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.privacy.controller_text', fallback: 'Elysera [À FOURNIR : dénomination] · [À FOURNIR : adresse email de contact RGPD]' } }
      ]
    },
    {
      id: 'donnees',
      title: { key: 'legal.privacy.data_title', fallback: 'Données collectées et origine' },
      blocks: [
        {
        kind: LEGAL_BLOCK.LIST,
        items: [
          { key: 'legal.privacy.data_accounts', fallback: 'Comptes : email, mot de passe (stocké haché), rôle, statut.' },
          { key: 'legal.privacy.data_profile', fallback: 'Profil : nom, prénom, surnom ; téléphone et photo (facultatifs).' },
          { key: 'legal.privacy.data_results', fallback: 'Résultats, classements, fiches publiques.' },
          { key: 'legal.privacy.data_security', fallback: 'Sécurité : jetons de session, appareils, limite de débit, journaux.' }
        ]
      },
        { kind: LEGAL_BLOCK.SUBHEADING, text: { key: 'legal.privacy.archives_title', fallback: 'Archives 2012-2026' } },
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.privacy.archives_text', fallback: 'Les noms de personnes ayant joué avant la création des comptes sont conservés (intérêt légitime). Droit d’opposition : demande de retrait ou de pseudonyme à [À FOURNIR : adresse email de contact RGPD], traitée à la main par un administrateur.' } }
      ]
    },
    {
      id: 'finalites',
      title: { key: 'legal.privacy.purposes_title', fallback: 'Finalités et bases légales' },
      blocks: [
        {
        kind: LEGAL_BLOCK.TABLE,
        table: {
          caption: { key: 'legal.privacy.purposes_caption', fallback: 'Finalités et bases légales' },
          columns: [{ key: 'legal.privacy.purposes_col_processing', fallback: 'Traitement' }, { key: 'legal.privacy.purposes_col_basis', fallback: 'Base légale' }],
          rows: [
            [{ text: { key: 'legal.privacy.purposes_accounts', fallback: 'Gestion des comptes' } }, { text: { key: 'legal.privacy.purposes_accounts_basis', fallback: 'Exécution du service (art. 6.1.b)' } }],
            [{ text: { key: 'legal.privacy.purposes_results', fallback: 'Publication des résultats et archives' } }, { text: { key: 'legal.privacy.purposes_results_basis', fallback: 'Intérêt légitime (6.1.f) ou contrat' } }],
            [{ text: { key: 'legal.privacy.purposes_photo', fallback: 'Photo, téléphone' } }, { text: { key: 'legal.privacy.purposes_photo_basis', fallback: 'Consentement, retirable' } }],
            [{ text: { key: 'legal.privacy.purposes_security', fallback: 'Sécurité' } }, { text: { key: 'legal.privacy.purposes_security_basis', fallback: 'Intérêt légitime (6.1.f)' } }],
            [{ text: { key: 'legal.privacy.purposes_invitations', fallback: 'Invitations par email' } }, { text: { key: 'legal.privacy.purposes_invitations_basis', fallback: 'Exécution du service' } }]
          ]
        }
      },
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.privacy.purposes_review', fallback: '[À FOURNIR : relecture juridique des bases légales]' } }
      ]
    },
    {
      id: 'durees',
      title: { key: 'legal.privacy.retention_title', fallback: 'Durées de conservation' },
      blocks: [
        {
        kind: LEGAL_BLOCK.TABLE,
        table: {
          caption: { key: 'legal.privacy.retention_caption', fallback: 'Durées de conservation' },
          columns: [{ key: 'legal.privacy.retention_col_data', fallback: 'Donnée' }, { key: 'legal.privacy.retention_col_duration', fallback: 'Durée' }],
          rows: [
            [{ text: { key: 'legal.privacy.retention_inactive', fallback: 'Compte inactif' } }, { text: { key: 'legal.privacy.retention_inactive_value', fallback: '[À FOURNIR : durée]' } }],
            [{ text: { key: 'legal.privacy.retention_logs', fallback: 'Journaux' } }, { text: { key: 'legal.privacy.retention_logs_value', fallback: '[À FOURNIR : durée]' } }],
            [{ text: { key: 'legal.privacy.retention_invitations', fallback: 'Invitations' } }, { text: { key: 'legal.privacy.retention_invitations_value', fallback: '[À FOURNIR : durée]' } }],
            [{ text: { key: 'legal.privacy.retention_admin_cookie', fallback: 'Cookie ccc_admin_edition' } }, { text: { key: 'legal.privacy.retention_admin_cookie_value', fallback: '[À FOURNIR : durée]' } }]
          ]
        }
      }
      ]
    },
    {
      id: 'destinataires',
      title: { key: 'legal.privacy.recipients_title', fallback: 'Destinataires et sous-traitants' },
      blocks: [
        {
        kind: LEGAL_BLOCK.LIST,
        items: [
          { key: 'legal.privacy.recipients_host', fallback: 'Hébergeur : [À FOURNIR : société]' },
          { key: 'legal.privacy.recipients_mail', fallback: 'Envoi d’emails : [À FOURNIR : fournisseur SMTP de production, quand choisi]' }
        ]
      },
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.privacy.recipients_transfers', fallback: 'Transferts hors UE : [À FOURNIR : à confirmer selon hébergeur et fournisseur]' } }
      ]
    },
    {
      id: 'droits',
      title: { key: 'legal.privacy.rights_title', fallback: 'Droits et réclamation' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.privacy.rights_text', fallback: 'Accès, rectification, effacement, opposition, limitation, portabilité. Exercice par email à l’adresse ci-dessus (aucune suppression en libre-service).' } },
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.privacy.rights_complaint', fallback: 'Réclamation possible auprès de la CNIL :' } },
        { kind: LEGAL_BLOCK.LINK, link: { text: { key: 'legal.privacy.rights_complaint_link', fallback: 'Déposer une plainte sur le site de la CNIL' }, href: 'https://www.cnil.fr/fr/plaintes' } }
      ]
    },
    {
      id: 'cookies',
      title: { key: 'legal.privacy.cookies_title', fallback: 'Cookies' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.privacy.cookies_intro', fallback: 'Aucun bandeau : les cookies ci-dessous sont exemptés de consentement (authentification, sécurité, personnalisation).' } },
        {
        kind: LEGAL_BLOCK.TABLE,
        table: {
          caption: { key: 'legal.privacy.cookies_caption', fallback: 'Cookies déposés' },
          columns: [{ key: 'legal.privacy.cookies_col_name', fallback: 'Nom' }, { key: 'legal.privacy.cookies_col_role', fallback: 'Rôle' }, { key: 'legal.privacy.cookies_col_duration', fallback: 'Durée' }],
          rows: [
            [{ code: 'ccc_session' }, { text: { key: 'legal.privacy.cookies_session_role', fallback: 'Authentification' } }, { text: { key: 'legal.privacy.cookies_session_duration', fallback: 'Session valable 12 h au plus, 2 h sans activité ; [À FOURNIR : durée garantie, après le merge de T-SEC-20]' } }],
            [{ code: 'ccc_device' }, { text: { key: 'legal.privacy.cookies_device_role', fallback: 'Sécurité de la connexion' } }, { text: { key: 'legal.privacy.cookies_device_duration', fallback: '90 jours' } }],
            [{ code: 'ccc_admin_edition' }, { text: { key: 'legal.privacy.cookies_admin_role', fallback: 'Édition choisie par l’administrateur' } }, { text: { key: 'legal.privacy.cookies_admin_duration', fallback: 'Durée de la session du navigateur (aucune durée fixée) [À CONFIRMER : décision utilisateur]' } }]
          ]
        }
      }
      ]
    },
    {
      id: 'majeurs',
      title: { key: 'legal.privacy.adults_title', fallback: 'Réservé aux majeurs' },
      blocks: [
        { kind: LEGAL_BLOCK.PARAGRAPH, text: { key: 'legal.privacy.adults_text', fallback: 'Le championnat et les comptes sont réservés aux personnes majeures.' } }
      ]
    }
  ],
  related: [
    { to: ROUTES.LEGAL_NOTICE, label: { key: 'legal.notice.title', fallback: 'Mentions légales' } },
    { to: ROUTES.TERMS, label: { key: 'legal.terms.title', fallback: 'Conditions d’utilisation' } },
    { to: ROUTES.ACCESSIBILITY, label: { key: 'legal.accessibility.title', fallback: 'Déclaration d’accessibilité' } }
  ]
}
