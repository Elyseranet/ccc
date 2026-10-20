# CCC — règles propres au projet

Complète `~/CLAUDE.md` et `~/.claude/CLAUDE.md`. En cas de conflit sur les points ci-dessous, ce fichier prime pour CCC.

## Animations — exception au « CSS only » (décision utilisateur 2026-10-19)

- **Pages vitrines publiques** (accueil, palmarès, et toute page de présentation publique) : vidéo de fond, WebGL/3D léger et une librairie d'animation JS sont **autorisés**.
- **Écrans denses publics** (édition, poules, bracket, matchs, joueurs, fiche joueur, face-à-face, classements) et **tout l'admin** : la règle globale s'applique — animations en CSS uniquement, aucun timer JS pilotant du visuel.
- Partout : **toute animation est désactivée sous `prefers-reduced-motion: reduce`**, et le contenu reste lisible et complet sans elle.

## Specs

Les specs font foi et vivent dans Obsidian : `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidians/Projects/CCC/` (Spec fonctionnelle, Spec API, Spec technique). Décisions design : `docs/design/ux/decisions.md`.
