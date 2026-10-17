# PLAN PEST CONTROL — Consignes pour Claude Code

## 1. Le projet

Application web en **un seul fichier** : `index.html` (~5 400 lignes ; nom imposé par GitHub Pages, comme pour OVERBOLT).
Elle sert aux techniciens de **Radical Pest Control** (Strasbourg) à annoter des plans de
bâtiments clients : on importe un plan, on y place des pastilles numérotées représentant les
postes de piégeage / traitement, on ajoute logos, textes et légende, puis on exporte un
rapport (PDF, PPTX, PNG, JPEG). Un document peut contenir plusieurs pages (une par étage).

- **Usage principal : smartphone** (Android aujourd'hui, iPhone visé), au doigt, souvent zoomé.
  Le PC est un usage secondaire.
- **Aucun serveur, aucune étape de compilation** : le fichier s'ouvre directement dans un
  navigateur. Toute modification se fait directement dans `index.html`.
- Bibliothèques (CDN) : Konva.js 9.3.6, jsPDF 2.5.1, PptxGenJS 3.12.0, JSZip 3.10.1,
  IndexedDB (sauvegarde automatique locale), Google Fonts IBM Plex Sans / Plex Mono.

## 2. Qui est l'utilisateur et comment lui parler

- Mic, responsable qualité, **non-développeur, novice total**.
- Toujours répondre **en français**.
- Explications **ultra détaillées, étape par étape, sans jargon**, sans rien présumer de ses
  connaissances techniques. Expliquer la **cause** d'un bug en langage simple, puis la correction.
- Terminer chaque livraison par une courte liste **« À tester »** concrète (quel bouton, quel geste,
  quel résultat attendu).
- Mic travaille sous **Windows** (pas de Mac : ne jamais parler du Finder, de Cmd, etc.).

## 3. Règles de travail (OBLIGATOIRES)

1. **Confirmer avant de modifier.** Reformuler la demande, signaler les ambiguïtés et poser les
   questions nécessaires AVANT toute modification du fichier. Pour une tâche complexe, commencer
   en mode Plan.
2. **Ne jamais déplacer de soi-même** un élément que l'utilisateur place à la main (logos, textes,
   légende, date). Aucun repositionnement automatique non demandé.
3. **Numéro de version à CHAQUE itération**, format `v2.1-NN` (actuellement **v2.1-67**), à mettre à
   jour aux 3 endroits : la balise `<title>`, la puce `.brand .ver` du bandeau, le commentaire
   d'en-tête du `<script>`.
   Attention : un remplacement global (`v2.1-67` → `v2.1-68` partout) modifie aussi les références
   historiques du journal et des commentaires ; les remettre ensuite à leur bonne valeur.
4. **Journal des modifications** : ajouter une entrée dans le commentaire d'en-tête du `<script>`
   (à la fin de la liste des versions), avec la **cause racine** et le **correctif**.
5. **Vérifications après chaque modification** :
   - syntaxe JavaScript valide (extraire le contenu du `<script>` et lancer `node --check`) ;
   - aucun `id` HTML en double ;
   - aucun `getElementById('...')` pointant vers un id absent du HTML ;
   - balises `<div>`, `<button>`, `<svg>` équilibrées.
6. Toute action qui modifie durablement le document doit appeler `pushHistory()` (sinon elle
   n'est ni annulable ni sauvegardée automatiquement).
7. Toute fonction d'export doit couvrir **toutes les pages** (`pages[]`), pas seulement la page affichée.
8. Commentaires du code en français, expliquant le **pourquoi** (historique du bug, choix fait).

## 4. Architecture — points clés à connaître

### Données
- `pages[]` (11 max) ; `model` est un **alias** vers `pages[currentPageIndex]`. Ne réassigner
  `model` que dans : `switchToPage()`, `deleteCurrentPage()`, `restoreDoc()`, ouverture de
  fichier, `newProject()`.
- Chaque page : `plans[]` (plusieurs plans possibles), `pastilles[]`, `anchors[]`, `lines[]`,
  `textes[]`, `logos[]`, `legend{}`, `deviceTypes[]`, `orientation`.
- Historique = document entier (`cloneDoc()`), les gros dataURL sont partagés par référence.
- Sauvegarde automatique IndexedDB (`scheduleAutoSave`, debounce 600 ms). Le fichier `.json`
  exporté reste la sauvegarde fiable (surtout sur iPhone).

### Rendu
- Rendu **incrémental** : les nodes Konva persistent entre rendus et ne sont reconstruits que si
  leur « signature » change. `resetContentNodeCaches()` est appelé aux changements de page,
  undo/redo, nouveau projet, ouverture, export.
- Le cadre de sélection (transformer) est attaché à DEUX endroits : `selectNode()` ET la fin de
  `renderContent()`. Toute règle sur les poignées doit être appliquée aux deux.
- Zoom : `fitZoom()` uniquement au démarrage, à l'ouverture d'un fichier et au nouveau projet.
  Jamais sur un changement d'outil ni sur l'ouverture du clavier virtuel.
  Pincement à 2 doigts ancré entre les doigts (`setZoomAnchored`).
- Export : attendre le chargement des images de logos (`waitForLogoImages`) avant chaque capture.

### Interface
- **Mode smartphone uniquement** (mode PC supprimé) : 6 tuiles (Page, Vue, Historique, Plan,
  Pastille, Texte) ouvrant des tiroirs. Fermeture après 5 s d'inactivité (sauf Texte, immédiate).
  Survol souris = ouverture immédiate.
- Barre de sélection et menus d'options en **pleine largeur**, étalés horizontalement.
- Police : **IBM Plex Sans uniquement** (constante `APP_FONT`, licence libre SIL OFL). Ne jamais
  réintroduire Inter, Arial ou une autre police propriétaire.

### Éléments
- **Pastilles** : pas de poignées ; halo bleu + zone de saisie élargie (≥ 32 px écran) quand
  sélectionnée ; double-tap = verrouiller ; taille via le curseur dédié. Numérotation continue
  sur toutes les pages.
- **Postes (deviceTypes)** : une modification (nom, couleur, code, taille, sans numéro) ou un ajout
  est propagé à **toutes les pages**. Liste par défaut de 12 postes + rat (voir `createEmptyModel`).
- **Textes** : cadre **ajusté au contenu** (marge `TEXT_PAD` = 4 px) ; poignées de coin = police
  et cadre ensemble ; couleur de police + fond (∅ = transparent).
- **Légende** : couleur de police + fond ; pastilles de légende de taille fixe 10 ; échelle
  bornée 0,3–8 et recentrée si elle sort de la feuille.
- **Plan importé** : rotation par **4 icônes main** (Main.svg de l'utilisateur, intégrées) au
  milieu de chaque côté ; aimant à 0/90/180/270° ; pas de ligne de mire. Au doigt, le plan ne se
  déplace sur la feuille qu'avec l'outil « Déplacer le plan ».
- **Navigation au doigt** : maintenir puis glisser sur le plan ou une zone vide = faire défiler
  la vue, dans tous les modes ; un doigt sur une pastille la déplace, elle seule.
- **Poignées** : dessinées en petits points, zone de saisie de 52 px conservée.
- **Cadenas** : pastille rouge + cadenas blanc, au coin supérieur droit de l'élément, suit ses
  déplacements, cliquable (verrouille / déverrouille).
- **4 éléments de coin** (logo Radical, logo client + « Adresse du client », légende, « Mise à jour
  le ») : verrouillés par défaut sur un nouveau projet ; copiés sur chaque nouvel étage depuis la
  page choisie ; marge au bord préservée lors du passage portrait ↔ paysage.

## 5. Approches ABANDONNÉES (ne pas les retenter)

- Marge de canevas dynamique pour afficher les poignées hors de la feuille : trop de cas
  limites. La feuille reste strictement A4 portrait ou paysage.
- Repositionnement automatique des éléments de coin à une position fixe : écrasait les réglages
  manuels.
- Taille des pastilles de légende proportionnelle au poste : jugé illisible.
- Ligne de mire pendant la rotation / le déplacement du plan : retirée à la demande.

## 6. Points ouverts

- **Tâche en cours : optimisation complète des performances** (ralentissements ressentis sur
  smartphone). Commencer par une analyse en mode Plan : rendus inutiles, recréations de nodes
  pendant les glissements (cadenas, icônes de rotation, halo), taille des canevas selon la
  densité d'écran, coût des filtres d'image du plan, sauvegardes automatiques. Proposer un plan
  classé par gain attendu et par risque avant toute modification.
- Réordonner ou supprimer un poste n'agit encore que sur la page affichée.
- Mise en ligne sur GitHub Pages envisagée (fiabilise la sauvegarde et l'usage sur iPhone).
- Documents anciens : leurs éléments de coin ne sont pas verrouillés automatiquement.
- Noms exacts des postes « Rodenticide » int. / ext. à confirmer.

## 7. Mise en ligne et mise à jour automatique (GitHub Pages)

- Dépôt : `https://github.com/mic67420/plan-pest-control` — adresse de l'application :
  `https://mic67420.github.io/plan-pest-control/` (branche `main`, dossier racine).
- Fichiers publiés : `index.html` (l'application), `manifest.json` + `icon-192.png` / `icon-512.png`
  / `apple-touch-icon.png` (installation sur l'écran d'accueil), `sw.js` (hors ligne + mise à jour).
  Les copies `*.sauvegarde.html` ne sont jamais publiées (voir `.gitignore`).
- **Workflow Git automatique** : après chaque modification terminée ET vérifiée (checks du §3),
  sans attendre que Mic le demande : `git add` des fichiers modifiés, `git commit` avec un message
  décrivant la version (ex. « v2.1-67 : correctif … »), puis `git push origin main`. Confirmer
  ensuite à Mic, en une phrase, ce qui a été publié. Ne jamais pousser un fichier dont la
  syntaxe n'a pas été vérifiée.
- `sw.js` : la page `index.html` est en « réseau d'abord » (toujours la dernière version quand il y
  a du réseau) ; incrémenter `CACHE_NAME` UNIQUEMENT si la liste des fichiers ou la version d'une
  bibliothèque CDN change.
- Après un push, GitHub Pages met ~1 à 2 minutes à publier. Mic voit la nouvelle version en
  rouvrant l'application sur son téléphone (avec du réseau).
- Les données (plans, pastilles) restent sur l'appareil de Mic (IndexedDB) et ne sont JAMAIS dans
  le dépôt. Le stockage dépend de l'adresse : changer d'adresse = repartir d'un stockage vide
  (d'où l'importance du fichier `.json` exporté).
