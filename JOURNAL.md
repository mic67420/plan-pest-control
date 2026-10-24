# Journal des modifications — PLAN PEST CONTROL

Historique complet (cause racine + correctif de chaque version). Déplacé hors de `index.html` en v2.1-102 :
ces ~950 lignes (71 Ko) étaient lues par le navigateur à chaque ouverture sans servir à rien.
**Nouvelles entrées : à ajouter à la FIN de ce fichier** (une entrée par version, cause racine + correctif).

```text

   PLAN PEST CONTROL v2.1-101 — Éditeur de plans de lutte antiparasitaire
   Architecture : modèle de données central (source de vérité) + rendu Konva.
   Chaque mutation du modèle -> pushHistory() -> render().

   CONVENTION DE VERSION : v{majeur}.{mineur}-{build}. Le numéro de build
   s'incrémente à CHAQUE livraison (correctif ou fonctionnalité), même
   mineure, pour ne jamais perdre le fil d'une session à l'autre. Il apparaît
   à 3 endroits à maintenir ensemble : le <title>, le chip ".brand .ver", et
   ce commentaire d'en-tête.

   v2.0 : support multi-pages (jusqu'à 1 page principale + 10 pages/étages),
   la page 1 porte les logos RADICAL + client, dupliqués (vierges) sur les
   pages suivantes ; la numérotation des pastilles continue d'une page à l'autre.
   Sauvegarde automatique locale (IndexedDB) après chaque modification.
   v2.1 : curseur déporté (décalage vertical) généralisé à la gomme et aux
   outils de découpe (rectangle / point par point), toujours ramené à
   l'intérieur de la feuille ; barres flottantes (découpe, texte) systéma-
   tiquement maintenues visibles à l'écran ; optimisations de fluidité
   (redimensionnement regroupé sur une seule frame, éléments décoratifs
   allégés pour le rendu et la détection tactile).
   v2.1-1 : renommage de poste + réorganisation de la liste déroulante ;
   correctif critique : le sélecteur de couleur du formulaire "Ajouter un
   poste" écrasait en direct la couleur du poste sélectionné ; suppression
   de page corrigée (l'ancien code pouvait supprimer/afficher la mauvaise
   page après un splice()) ; gomme repeinte avec la couleur de la pipette
   (pot de peinture) au lieu de créer une transparence ; cadre de découpe
   recalé sur la zone réellement découpée ; renommage de pastille via un
   champ dans la barre de sélection ; collage d'image (Cmd/Ctrl+V) importé
   comme plan ; postes "sans numéro" avec taille par défaut par poste
   (utilisé pour les pastilles rongeur souris/rat) ; chaque section du
   rendu (lignes, pastilles, textes, logos, légende) est désormais isolée
   dans son propre try/catch pour qu'une erreur sur un seul élément ne
   fasse plus disparaître silencieusement tout ce qui est dessiné après
   (notamment la légende, dessinée en dernier).
   v2.1-2 : les postes par défaut (souris/rat) sont désormais vérifiés et
   réinjectés si besoin à CHAQUE rendu (ensureDefaultDeviceTypes() appelée
   dans render()), pas seulement au chargement du document — auto-réparation
   si une session déjà ouverte n'avait pas rechargé la dernière version.
   v2.1-3 : la légende n'affiche plus le code (MU/RA) sur la pastille des
   postes "sans numéro" (souris/rat), cohérent avec leur affichage sans
   étiquette sur le plan.
   v2.1-4 : la taille de la pastille dans la légende suit maintenant la
   taille par défaut du poste (ex. rat visiblement plus grand que souris),
   dans une fourchette de 8 à 14px pour rester lisible sur la ligne.
   v2.1-5 : correctif "barre d'outils de sélection hors écran" — sur mobile,
   avec beaucoup de contrôles affichés (étiquette, taille, couleur, dupliquer,
   supprimer), la barre débordait à droite de l'écran et le bouton
   "Supprimer" restait inatteignable. Elle est maintenant contrainte à la
   largeur de l'écran et passe à la ligne si besoin ; elle est aussi
   reclampée dans la fenêtre visible comme les autres barres flottantes
   (keepFixedBarInViewport), pour ne plus jamais sortir de l'écran.
   v2.1-6 : audit complet de TOUTES les fenêtres/barres flottantes contre le
   débordement d'écran. Cause racine trouvée : plusieurs conteneurs (liste
   déroulante des postes, popovers, barres de découpe) n'avaient aucune
   largeur maximale — un nom de poste long (ex. "Poste d'appâtage
   RODENTICIDE") forçait toute la liste à s'élargir au-delà de l'écran,
   coupant les boutons ▲▼✎ à droite. Corrigé partout (dd-list, .popover,
   #cutConfirmBar, #pointCutBar) : largeur toujours plafonnée à celle de
   l'écran, contenu qui passe à la ligne plutôt que de déborder.
   v2.1-7 : le crayon ✎ (modifier un poste) est maintenant visuellement
   distinct (contour rouge) dans la liste déroulante, pour être repéré du
   premier coup d'œil. Nouveau geste en placement de pastille (outil 📍
   classique, tactile) : un appui BREF colle une pastille comme avant ; un
   appui LONG maintenu (~0,4s) sans relâcher bascule au contraire en
   déplacement du plan dans toutes les directions tant que le doigt reste
   posé, pour se repositionner sans devoir changer d'outil.
   v2.1-8 : deux correctifs sur la fonctionnalité précédente. (1) Après un
   déplacement du plan par appui long, une pastille se collait quand même
   au relâchement : le drapeau "ne pas coller" n'était posé qu'au tout
   dernier moment (touchend), trop tard si l'événement "tap" de Konva se
   déclenche avant selon l'ordre interne du navigateur. Il est maintenant
   posé dès que le déplacement démarre réellement, et reste actif un court
   instant après le relâchement pour absorber aussi un éventuel "click" de
   compatibilité différé. (2) Réserve de place sous le plan pour les barres
   flottantes — mais gérée par erreur uniquement en mode "mobile" (classe
   body.mobile-mode), alors que l'app est en mode "PC/Mac" par défaut :
   sans effet dans ce mode, donc pour la plupart des utilisateurs sur
   téléphone qui n'avaient pas explicitement basculé le mode.
   v2.1-9 : cause racine du point (2) corrigée en profondeur. Les barres
   #selectionBar/#cutConfirmBar/#pointCutBar étaient positionnées près de
   l'élément sélectionné en mode "PC/Mac" (calcul JS top/left), pouvant
   atterrir en plein milieu du plan et y rester figées par-dessus le
   contenu. Elles sont maintenant TOUJOURS ancrées en bas de l'écran par
   CSS, quel que soit le mode actif, et la réserve d'espace sous le plan
   (canvasWrap) s'applique elle aussi systématiquement, plus seulement en
   mode mobile — ces barres restent désormais physiquement en dehors du
   champ de vision du plan dans tous les cas.
   v2.1-10 : (1) couleur par défaut de la gomme/pot changée de bleu à blanc.
   (2) Curseur déporté (gomme, découpe rectangle/point par point, pastille
   déportée) : la pointe visée était tirée artificiellement vers l'intérieur
   par une marge fixe, rendant impossible d'atteindre ou de gommer les
   bords extérieurs de la feuille/du plan. Cette marge est supprimée : la
   pointe suit maintenant fidèlement le doigt et peut atteindre les bords
   gauche/droit/haut. Pour le bord BAS, l'écart doigt-pointe se réduisait
   progressivement à l'approche de ce bord (la flèche du curseur rétrécissait
   visiblement) — solution jugée insatisfaisante par le client.
   v2.1-11 : (1) remplacement de la solution "écart réduit" pour le bord bas
   par une bien meilleure : stage.getPointerPosition() peut ramener la
   position à l'intérieur de la feuille dans les cas limites, alors que la
   position RÉELLE du doigt (calculée à partir des coordonnées tactiles
   brutes, voir rawTouchStagePos()) continue d'être suivie même légèrement
   en dehors de la feuille. L'écart doigt-pointe reste donc désormais
   CONSTANT partout, y compris tout en bas — la flèche ne rétrécit plus, et
   la pointe peut sortir légèrement de la feuille en haut comme en bas.
   (2) L'appui long pour déplacer le plan (au lieu de déclencher l'action)
   est généralisé à tous les outils "au tapotement" (pastille classique,
   pipette, pot de peinture) — même logique partout, plus seulement pour
   les pastilles.
   v2.1-12 : CHANGEMENT D'ARCHITECTURE — passage d'un plan unique par page
   ("model.plan", singulier) à plusieurs plans par page ("model.plans[]").
   Chaque plan est désormais un élément indépendant : sélectionnable,
   déplaçable, verrouillable et réellement supprimable un par un (avant,
   avec un seul plan obligatoire, "Supprimer" ne faisait que désélectionner).
   Un import n'écrase plus le plan existant : il en AJOUTE un nouveau. Les
   outils pixel (pipette, pot de peinture, gomme, découpe rectangle/point
   par point) identifient désormais le plan précis visé sous le doigt/curseur
   au moment du geste, pour bien cibler le bon plan quand plusieurs se
   chevauchent ou se côtoient sur la même page. Réglages image (luminosité/
   contraste/saturation/teinte) et verrouillage appliqués au plan
   sélectionné, avec resynchronisation des curseurs à chaque sélection.
   Migration automatique des documents déjà sauvegardés (ancien format à un
   seul plan) vers le nouveau format à l'ouverture. Correctif appliqué avant
   livraison : un plan verrouillé restait sélectionnable (juste non
   déplaçable) — sans ça, une fois verrouillé et désélectionné, il devenait
   impossible à resélectionner pour le déverrouiller (blocage permanent).
   v2.1-13 : l'appui long pour déplacer le plan (au lieu de déclencher
   l'action de l'outil) est étendu à TOUS les outils tactiles, plus
   seulement aux 3 outils "au tapotement" (pastille classique, pipette, pot
   de peinture). Couvre maintenant aussi : pastille déportée, découpe
   rectangle, découpe point par point, et la gomme. Pour ces outils à
   glissement continu, la logique s'adapte : si le doigt bouge tout de
   suite après le contact, le geste est traité normalement (glisser =
   dessiner/gommer, comme avant) ; ce n'est que s'il reste immobile le
   temps du délai (~0,4s) que le plan se met à défiler à la place.
   v2.1-14 : PASSE D'OPTIMISATION MAJEURE (fluidité). Cause principale des
   lenteurs identifiée : renderContent() DÉTRUISAIT ET RECONSTRUISAIT tout
   (pastilles, textes, logos, légende) à CHAQUE rendu, même quand rien
   n'avait changé — or render() est appelé très souvent (chaque glissement
   de curseur de taille/luminosité, par exemple). Corrigé : les nodes Konva
   persistent maintenant entre deux rendus ; seul un élément dont
   l'apparence a réellement changé (signature comparée) est reconstruit,
   les autres sont juste repositionnés (bien moins coûteux). Ordre
   d'empilement (lignes < pastilles < textes < logos < légende)
   réaffirmé explicitement à chaque rendu pour rester cohérent malgré ça.
   Deux autres coûts inutiles supprimés du chemin appelé à chaque rendu :
   refreshTypeList() reconstruisait tout le HTML de la liste des postes à
   chaque fois (skip désormais si rien n'a changé, via une signature) ;
   ensureDefaultDeviceTypes() rebouclait sur TOUTES les pages à chaque
   rendu au lieu de la seule page affichée.
   v2.1-15 : TEST — bandeau mobile en tuiles. En mode "mobile" uniquement,
   le bandeau étalé sur plusieurs lignes est remplacé par une seule ligne
   de 6 tuiles pleine largeur (Page, Vue, Historique, Plan, Pastille,
   Texte). Un appui bref sur une tuile déroule un tiroir flottant avec les
   boutons de sa catégorie (les mêmes qu'en mode PC, aucune logique
   dupliquée) ; un appui sur une fonction du tiroir la sélectionne et le
   referme. La tuile reste visuellement active tant que l'outil de sa
   catégorie est utilisé. But : un bandeau minimal, un maximum d'écran
   visible sur le plan. Le mode "PC/Mac" (bandeau classique) reste
   disponible et inchangé via la bascule 🖥️.
   v2.1-16 : trois correctifs sur le retour utilisateur. (1) Légende parfois
   invisible : cause probable trouvée — les nodes pastilles/textes/logos/
   légende persistent maintenant entre deux rendus (v2.1-14, fluidité),
   mais rien ne les réinitialisait lors d'un changement de page, d'un
   undo/redo, d'un nouveau projet ou d'un chargement de fichier, laissant
   d'éventuels nodes obsolètes trainer. Un nettoyage complet
   (resetContentNodeCaches()) est désormais appelé à chacun de ces points.
   (2)+(3) Une seule tuile peut être mise en avant à la fois désormais (au
   lieu de pouvoir en avoir deux distinctement actives en même temps,
   comme "Pastille" outil actif ET "Texte" tiroir ouvert simultanément) :
   priorité au tiroir actuellement ouvert, sinon à l'outil actif ; ouvrir
   une nouvelle tuile éteint toujours l'ancienne.
   v2.1-17 : la vraie cause de la légende "invisible" trouvée — elle
   s'affichait en réalité, mais réduite à un point quasi invisible (taille
   ~0), très probablement suite à un ancien bug de redimensionnement dont
   la valeur corrompue (scale NaN ou proche de 0) n'était ensuite plus
   jamais rattrapable (le calcul de redimensionnement se base sur la
   valeur précédente : une fois invalide, elle le restait pour toujours).
   Un filet de sécurité corrige maintenant la taille ET la position de la
   légende au rendu si elles sont invalides ou aberrantes, avant même de
   la dessiner. Au passage : la case "Utilisés" et l'icône légende ne
   reflétaient pas toujours l'état réel de la page affichée (resynchronisées
   à chaque rendu désormais).
   v2.1-18 : mise en page par défaut d'un nouveau projet. Page 1 reçoit
   désormais automatiquement : logo entreprise en haut à gauche (déjà le
   cas), un PLACEHOLDER "logo Cie" (icône appareil photo, en pointillés) en
   haut à droite tant qu'aucun logo client n'a été importé — dès qu'un vrai
   logo client est importé via l'outil dédié, il remplace ce placeholder
   automatiquement (au lieu de s'ajouter à côté, même correctif appliqué
   au remplacement d'un logo entreprise déjà existant) ; la légende
   positionnée en bas à droite par défaut (au lieu d'en haut à gauche) ;
   un texte "Mise à jour le [date du jour]" en bas à gauche, modifiable
   comme n'importe quel texte (double-clic). Chaque nouvel étage ajouté
   continue de copier ces emplacements depuis la page 1 (comportement de
   copie déjà existant pour logos/textes/légende, inchangé) — seuls le
   plan et les pastilles ne sont jamais copiés d'une page à l'autre.
   v2.1-22 : RETOUR À LA BASE v2.1-18 — le chantier "poignées de
   redimensionnement visibles hors de la feuille" (marge de canevas
   dynamique, versions v2.1-19 à v2.1-21) est abandonné : trop de cas
   limites mal maîtrisés pour le bénéfice apporté. On reprend le
   fonctionnement standard de v2.1-18 (canevas exactement à la taille de
   la feuille) comme base de travail.
   Nouveau correctif à la place : les 4 éléments de coin (logo entreprise
   haut gauche, logo client haut droite, légende bas droite, date de mise
   à jour bas gauche) restent maintenant correctement dans leur coin
   respectif après un changement d'orientation (portrait ↔ paysage). Avant
   ce correctif, leur position était calculée pour l'ancienne largeur/
   hauteur de la feuille et ne suivait pas le changement, ce qui pouvait
   les faire sortir du bon coin — voire de la feuille — une fois pivotée.
   v2.1-23 : (1) cliquer sur le placeholder "logo Cie" (tant qu'aucun vrai
   logo client n'a été importé) ouvre désormais directement la galerie/le
   sélecteur de fichier, au lieu de simplement le sélectionner — plus
   besoin de passer par l'outil dédié dans le bandeau. Un vrai logo déjà
   importé garde le comportement normal (sélection/déplacement au clic).
   (2) Taille par défaut du logo entreprise augmentée (160×100 → 240×150),
   y compris lors d'un remplacement manuel via l'outil dédié. (3) Taille de
   police par défaut augmentée : 18 → 22 pour un nouveau texte libre, 13 →
   16 pour le texte "Mise à jour le [date]" généré automatiquement.
   v2.1-24 : (1) ajout d'un encart texte "Adresse du client" sous le
   placeholder logo Cie par défaut sur un nouveau projet — modifiable
   comme n'importe quel texte (double-clic). Copié automatiquement vers
   les nouveaux étages, comme tous les autres textes de la page 1.
   (2) Confirmé : le logo Cie (placeholder ou vrai logo déjà importé) est
   déjà systématiquement copié vers chaque nouvel étage — ce mécanisme
   existait déjà (addBlankPage copie tous les logos de la page 1 tels
   quels), aucun changement nécessaire de ce côté.
   (3) RETRAIT du repositionnement automatique des éléments de coin (logo
   client, légende, date) lors d'un changement d'orientation, ajouté par
   erreur en v2.1-22 : ces éléments sont placés et ajustés manuellement
   par l'utilisateur, le code ne doit jamais les déplacer de sa propre
   initiative, même bien intentionné — un ajustement manuel ne doit
   jamais être écrasé sans geste explicite de l'utilisateur.
   v2.1-25 : "Ajouter un étage" demande désormais QUELLE page recopier
   (logos, textes, réglage de légende) plutôt que de toujours reprendre la
   page 1 sans le demander — utile si la mise en page a été ajustée
   différemment sur une autre page entretemps. Un petit menu liste toutes
   les pages existantes ; la copie reprend exactement les éléments de
   chaque coin tels qu'ils sont sur la page choisie, à l'identique
   (position, taille). S'il n'y a qu'une seule page, la question ne se
   pose pas : elle est utilisée directement, comme avant.
   v2.1-26 : (correctif insuffisant, voir v2.1-27) le menu de choix de page
   à recopier n'avait pas de défilement : hauteur plafonnée + défilement
   ajoutés au cas où la liste serait longue.
   v2.1-27 : LA VRAIE CAUSE de "limité à 2 pages" trouvée — un écouteur
   global (document.addEventListener('click', closeAllPopovers)) referme
   tous les popovers ouverts dès qu'on clique n'importe où sur la page. Le
   bouton "Ajouter un étage" ouvrait bien le menu de choix, mais sans
   bloquer la remontée de son propre clic (stopPropagation manquant) :
   celui-ci atteignait aussitôt ce même écouteur global, qui refermait le
   menu la fraction de seconde suivant son ouverture — invisible ou
   inutilisable selon la rapidité d'affichage. Comme la 1ʳᵉ page
   supplémentaire ne passe pas par ce menu (un choix évident quand il n'y
   a qu'une page), le problème ne se voyait qu'à partir de la 2ᵉ tentative
   — d'où l'impression d'être bloqué à 2 pages. Corrigé : le clic sur le
   bouton et sur chaque choix de page ne remonte plus jusqu'au document.
   v2.1-28 : le choix de la page à recopier se fait maintenant via un vrai
   menu déroulant natif (<select>), qui s'ouvre verticalement comme
   attendu, plutôt qu'une pile de boutons dans le popover. Un bouton
   "Ajouter l'étage" valide le choix sélectionné.
   v2.1-29 : RETRAIT DU MODE "PC/Mac" — cause de plusieurs bugs récents
   (menu de copie de page notamment). L'app tourne désormais TOUJOURS en
   mode smartphone (bandeau en tuiles), qui s'est révélé fiable et bien
   intégré à un écran de téléphone. Les cases à cocher 📱/🖥️ de bascule
   entre les deux modes sont retirées du bandeau ; mobile-mode est
   appliqué en permanence au démarrage, sans possibilité de revenir à
   l'ancien bandeau étalé. Le CSS spécifique au mode PC reste présent
   dans le fichier (inoffensif, jamais déclenché) plutôt que d'être
   supprimé, pour limiter le risque de régression sur cette version.
   v2.1-30 : PASSE DE NETTOYAGE ET DE VÉRIFICATION COMPLÈTE.
   - Légende : persistance vérifiée et confirmée déjà correcte (chaque
     modification — déplacement, redimensionnement, visibilité, filtre
     "Utilisés" — appelle bien pushHistory(), qui déclenche la sauvegarde
     automatique). Rien à corriger de ce côté, comportement déjà fiable.
   - Code mort supprimé : CSS du mode PC devenu inutile (body.desktop-mode
     #topbar, .topbar-row1) et des cases à cocher retirées (.mobile-toggle,
     orphelines depuis le retrait du mode PC) ; trois références à des
     valeurs d'outil ('add-text', 'logo-a', 'logo-b') qui n'étaient en
     réalité JAMAIS assignées à activeTool nulle part dans le code —
     l'ajout de texte/logo se fait en un clic direct (pas un mode
     persistant) — supprimées du switch de surbrillance des boutons, de
     l'aperçu fantôme, et de la catégorisation des tuiles mobiles.
   - Audit systématique effectué : aucune fonction déclarée mais jamais
     appelée, aucun gestionnaire d'événement dupliqué sur un même bouton,
     aucun identifiant HTML référencé en JS mais absent du document.
   - Vérifié : tous les popovers (export, réglages plan, ajout de poste,
     liste des postes) bloquent déjà correctement la remontée de leur
     propre clic vers l'écouteur global qui referme les menus — seul le
     nouveau menu "Ajouter un étage" en avait manqué un (déjà corrigé en
     v2.1-27), aucune autre occurrence du même bug trouvée ailleurs.
   v2.1-31 : le tiroir "Vue" se refermait après 100ms sur CHAQUE clic, y
   compris sur les boutons de zoom — empêchant de recliquer plusieurs fois
   de suite pour affiner le niveau (zoom avant/arrière/ajuster). Ces trois
   boutons utilisent désormais un délai d'INACTIVITÉ (5 secondes, valeur de
   test à ajuster selon retour) au lieu d'une fermeture immédiate : le
   tiroir reste ouvert tant qu'on continue à cliquer dessus, et ne se
   referme que 5s après le dernier clic sur un bouton de zoom. Les autres
   boutons du bandeau gardent la fermeture immédiate habituelle.
   v2.1-32 : un texte apparaît désormais sous chaque icône, dans TOUS les
   tiroirs (Page, Vue, Historique, Plan, Pastille, Texte) — jusqu'ici seule
   l'info-bulle (title, invisible sans appui long) l'indiquait. Le texte
   est généré automatiquement à partir du title déjà présent sur chaque
   bouton (partie entre parenthèses retirée pour rester court), pas
   ressaisi à la main : aucun risque d'oubli ou d'incohérence entre les
   deux. N'affecte que les icônes des tiroirs ; les boutons des sous-menus
   imbriqués (pipette/pot de peinture/gomme dans "Plan") restent inchangés.
   v2.1-33 : nouvelle approche pour les 4 éléments de coin lors d'un
   changement d'orientation (portrait ↔ paysage) — la largeur et la
   hauteur de la feuille s'échangent, donc un élément ancré à un bord
   (logo client à droite, légende en bas à droite, date en bas à gauche)
   se retrouvait décalé, voire hors feuille, sans réajustement. Au lieu de
   réinitialiser à une position fixe par défaut (ancien essai v2.1-22,
   écrasait un ajustement manuel — retiré en v2.1-24), la MARGE actuelle
   de chaque élément par rapport à son bord est désormais préservée : un
   ajustement manuel (marge plus grande ou plus petite que la valeur par
   défaut) reste identique après le changement d'orientation, seule la
   position absolue s'adapte au nouveau format. Le logo entreprise (ancré
   en haut à gauche) n'a besoin d'aucun ajustement.
   v2.1-34 : (1) une coche ✓ apparaît maintenant à côté du champ de
   renommage d'une pastille (barre de sélection) : elle valide le
   renommage ET referme la barre, comme demandé — plus besoin de cliquer
   ailleurs pour la faire disparaître. (2) le délai d'inactivité de 5s
   avant fermeture automatique (déjà en place sur les boutons de zoom de
   "Vue") est étendu à TOUT le tiroir des tuiles Page, Vue, Historique,
   Plan et Pastille : plus besoin de rouvrir le tiroir entre chaque
   réglage (taille de pastille, renommage d'un poste après l'autre,
   navigation entre pages…). La tuile Texte garde la fermeture immédiate
   habituelle (ses actions sont ponctuelles, pas des réglages à affiner).
   v2.1-35 : (1) un petit cadenas ROUGE apparaît désormais à côté de la
   poignée de rotation d'un plan sélectionné, ouvert ou fermé selon son
   état verrouillé/déverrouillé — pour vérifier d'un coup d'œil que le
   verrouillage a bien pris effet, plus fiable qu'un bouton de bandeau
   moins visible une fois le tiroir refermé (le mécanisme de verrouillage
   lui-même semblait correct au réexamen du code : pl.locked bascule bien
   et empêche bien le glisser-déposer — ce cadenas permettra de confirmer).
   (2) Poignées de redimensionnement doublées de taille (+100%, de 26 à
   52px) pour une meilleure préhension au doigt ; écart de la poignée de
   rotation ajusté en conséquence. (3) Une poignée "main rouge" apparaît
   désormais dans la barre de sélection (celle affichée pour un plan, un
   texte, une pastille…) : elle permet de la glisser n'importe où sur
   l'écran au lieu de rester figée en bas au centre. La zone de travail du
   plan se réajuste automatiquement une fois la barre déplacée ailleurs.
   v2.1-36 : le pincement à deux doigts changeait bien le niveau de zoom,
   mais sans jamais compenser le défilement : le zoom (transform CSS)
   grandit toujours depuis le coin haut-gauche du contenu, donc zoomer
   faisait mécaniquement dériver tout le plan vers le bas-droite depuis ce
   coin — perçu depuis les doigts comme une dérive vers le haut-gauche, au
   lieu de rester centré entre eux. Corrigé : le défilement est maintenant
   réajusté à chaque pincement pour que le point exact sous le milieu des
   deux doigts reste visuellement fixe, avant comme après le changement de
   zoom — plus aucune dérive, le zoom reste centré sur le pincement.
   v2.1-37 : les poignées de redimensionnement/rotation ne s'affichent plus
   sur une pastille sélectionnée — elles ne servaient à rien (sa taille se
   règle via le curseur "Taille" dédié, indépendant du cadre de
   transformation) et gênaient le glisser-déposer pour la déplacer sur le
   plan. Les autres éléments (plan, texte, logo, légende) gardent leurs
   poignées normalement, seule la pastille en est désormais dépourvue.
   v2.1-38 : le verrouillage n'existait jusqu'ici que pour le plan. Un
   bouton 🔓/🔒 générique apparaît maintenant dans la barre de sélection
   pour N'IMPORTE QUEL élément (pastille, texte, logo, légende, plan) : il
   bloque son déplacement par glisser-déposer, quel que soit son type.
   Pour les pastilles spécifiquement, un double-clic (ou double-tap) fait
   la même chose directement sur le plan — pratique une fois son
   emplacement définitif validé, sans repasser par la barre de sélection.
   Une astuce dépliante (ℹ️) explique ce raccourci dans le tiroir
   "Pastille". Au passage : le double-clic sur une pastille ouvrait
   jusqu'ici une fenêtre de renommage devenue redondante avec le champ de
   renommage déjà présent dans la barre de sélection — remplacé par ce
   verrouillage, plus utile à cet endroit précis.
   v2.1-39 : cause trouvée du rendu incohérent d'un même fichier .json
   ouvert à des moments différents ("plan miniature sur feuille
   démesurée" une fois, taille correcte une autre fois). Le niveau de zoom
   n'était RECALCULÉ qu'au tout premier chargement de l'application
   (restauration automatique) ; ouvrir un fichier .json via "Ouvrir" ou
   créer un "Nouveau projet" gardait, eux, le zoom actif AVANT cette
   action — donnant un rendu très différent selon l'état du zoom au moment
   précis où le fichier était ouvert. Corrigé aux deux endroits : le zoom
   se recalcule maintenant pour bien cadrer la feuille à chaque fois.
   v2.1-40 : (1) le cadenas rouge (v2.1-35) ne s'affichait que pour un
   plan verrouillé — généralisé à N'IMPORTE QUEL élément verrouillable
   (pastille, texte, logo, légende), en s'adaptant à son ancrage propre
   (poignée de rotation pour la plupart, position/rayon directement pour
   une pastille qui n'a plus de cadre de transformation depuis v2.1-37).
   (2) DEUX causes trouvées au zoom qui se réinitialisait sans raison,
   notamment en renommant une pastille : (a) setTool() — appelé à CHAQUE
   changement d'outil — recalculait systématiquement le zoom "ajusté à
   l'écran", sans aucune raison de le faire ; (b) ouvrir le clavier
   virtuel (ex. pour taper un renommage) déclenche sur mobile un
   événement de redimensionnement de fenêtre, jusqu'ici traité exactement
   comme une vraie rotation d'écran — donc lui aussi recalculait le zoom.
   Les deux corrigés : changer d'outil ou faire apparaître le clavier ne
   touche plus jamais au niveau de zoom en cours.
   v2.1-41 : la vraie cause des poignées qui réapparaissaient quand même
   sur une pastille (malgré le retrait en v2.1-37) trouvée — DEUX endroits
   du code attachaient les poignées, un seul avait été corrigé. selectNode()
   (déclenché au clic) excluait bien la pastille, MAIS un second bloc, à la
   fin de renderContent() — exécuté à CHAQUE rendu pour resynchroniser le
   cadre après qu'un node ait pu être recréé (ex. la pastille change
   d'apparence à chaque changement de taille, donc son node Konva est
   reconstruit) — réattachait les poignées sans cette même exclusion,
   annulant silencieusement le correctif dès le rendu suivant la
   sélection. Corrigé aux deux endroits désormais. Cause probable du souci
   de curseur "Taille" au passage : les poignées s'accrochaient à un node
   sans arrêt détruit/recréé pendant qu'on glissait le curseur, perturbant
   l'interaction — devrait être résolu par la même occasion.
   v2.1-42 : depuis le retrait des poignées sur les pastilles (v2.1-37),
   plus rien n'indiquait visuellement laquelle était sélectionnée. Un halo
   lumineux bleu apparaît désormais tout autour de la pastille active,
   sous son contenu (ne masque rien). Il suit la pastille pendant un
   déplacement (fait partie du même élément) et reste correctement
   affecté à la bonne pastille même après un changement de taille (qui
   reconstruit son apparence).
   v2.1-43 : le halo (v2.1-42) ne s'allumait qu'au rendu complet SUIVANT
   la sélection, pas au premier clic lui-même — un simple clic de
   sélection ne déclenche pas de rendu complet à lui seul, seule une
   action ultérieure (déplacement, changement de taille…) le faisait
   apparaître avec retard. Corrigé : le halo se met à jour immédiatement
   dans la fonction de sélection elle-même, sans attendre.
   v2.1-44 : PASSE DE COMPATIBILITÉ iOS / SAFARI (l'app ciblait surtout
   Android jusqu'ici). Corrigés : (1) le zoom tactile natif de Safari
   n'était pas désactivé — il pouvait entrer en conflit avec le zoom
   propre à l'app (pincement à deux doigts géré manuellement) ; ajout de
   maximum-scale=1/user-scalable=no dans le viewport. (2) Plusieurs champs
   de saisie (renommage de poste/pastille, menu déroulant de copie de
   page) avaient une taille de police sous 16px : Safari iOS zoome
   automatiquement toute la page au focus d'un champ en dessous de ce
   seuil — corrigé partout, y compris la zone d'édition de texte sur le
   plan dont la taille dépend du zoom courant (plafonnée à 16px minimum).
   (3) Rebond élastique (overscroll) propre à Safari iOS neutralisé, pour
   qu'un geste un peu rapide en bord de plan ne fasse plus "rebondir"
   toute la page. (4) Zone de sécurité ajoutée sous l'encoche/l'île
   dynamique d'un iPhone (sans effet sur Android). (5) Reflet gris par
   défaut au toucher (tap highlight) retiré pour un rendu plus proche
   d'une app native. La sauvegarde automatique (IndexedDB) était déjà
   protégée contre les erreurs — son comportement peut néanmoins être
   moins fiable sur iOS (limites propres à Safari sur le stockage local) :
   le fichier .json exporté reste le moyen de sauvegarde le plus sûr,
   d'autant plus recommandé sur iPhone.
   v2.1-45 : le filet de sécurité anti-légende-invisible (v2.1-17) ne
   rattrapait que des valeurs ABERRANTES (NaN, des milliers de pixels) —
   trop strict pour couvrir le cas d'une légende simplement déplacée hors
   de la feuille par erreur (glissée par inadvertance, ou héritée d'une
   page à l'orientation différente), qui restait invisible malgré la case
   "insérer/retirer" cochée. Corrigé : la vérification se base maintenant
   sur les dimensions RÉELLES de la feuille et de la légende, et la
   recentre dès qu'elle ne chevauche plus du tout la page visible — plus
   seulement pour des valeurs manifestement corrompues.
   v2.1-46 : les pastilles de la légende n'étaient plus de taille égale
   depuis qu'elles reflétaient la taille réelle de chaque poste sur le
   plan (ex. rat plus grand que souris, demandé en v2.1-4). Revenu sur ce
   choix à la demande : toutes les pastilles de la légende utilisent
   maintenant une taille fixe et identique (10), quelle que soit la
   taille du poste correspondant sur le plan.
   v2.1-47 : cause trouvée des logos manquants de façon aléatoire à
   l'export (tous formats confondus, puisqu'ils passent tous par la même
   fonction de capture). Un logo est recréé à chaque page visitée pendant
   l'export multi-pages (les éléments affichés sont réinitialisés entre
   deux pages) — recréer une image, même encodée directement dans le
   fichier, reste un chargement ASYNCHRONE (le décodage n'est jamais
   instantané). La capture de la page intervenait juste après le rendu,
   sans jamais attendre la fin de ce chargement : selon lequel des deux
   logos finissait de décoder à temps, l'un, l'autre, ou aucun des deux
   pouvait manquer sur l'image exportée — d'où le caractère aléatoire.
   Corrigé : l'export attend maintenant explicitement que les logos
   affichés aient fini de charger avant de capturer chaque page.
   v2.1-48 : bug trouvé sur les poignées de la légende — chaque
   redimensionnement MULTIPLIAIT la nouvelle échelle par l'ancienne, au
   lieu de la remplacer. Or Konva rapporte déjà l'échelle ABSOLUE (le
   cadre de la légende porte l'échelle actuelle dès le début de chaque
   glissement, puisqu'elle est réappliquée à chaque rendu) : la
   multiplier une seconde fois cumulait l'agrandissement à l'infini,
   quelle que soit la direction du geste — d'où l'agrandissement en
   boucle même en essayant de rétrécir la légende. Corrigé : la nouvelle
   échelle rapportée par Konva remplace directement l'ancienne.
   v2.1-49 : la légende avait à nouveau disparu — cause probable : une
   valeur d'échelle démesurée, héritée de tentatives de redimensionnement
   AVANT le correctif v2.1-48, restait enregistrée dans le fichier. Le
   filet de sécurité (v2.1-17/v2.1-45) n'avait qu'une limite basse (contre
   une légende devenue minuscule), aucune limite haute contre une échelle
   au contraire bien trop grande. Ajoutée des deux côtés maintenant :
   toute valeur invalide ou hors d'une fourchette raisonnable (0,3 à 8)
   est remise à une taille normale au rendu, et le redimensionnement
   lui-même est désormais plafonné pour ne plus jamais l'atteindre.
   v2.1-50 : les 4 éléments de coin (logo entreprise, logo/adresse client,
   légende, date de mise à jour) sont désormais VERROUILLÉS PAR DÉFAUT sur
   un nouveau projet — taille et position figées tant qu'on ne les
   déverrouille pas explicitement via le bouton 🔓 de la barre de
   sélection. Le verrou est conservé si le placeholder "logo Cie" est
   remplacé par un vrai logo client. N'affecte que les NOUVEAUX documents
   créés à partir de cette version : un document déjà existant garde ses
   éléments tels quels (à verrouiller manuellement si besoin).
   v2.1-51 : (1) renommer un poste, changer sa couleur, son code, sa taille
   par défaut ou l'option "sans numéro" s'applique désormais à TOUTES les
   pages du document (chaque page possède sa propre copie de la liste des
   postes, avec les mêmes identifiants) — avant, seule la page affichée
   était modifiée, laissant plan et légende incohérents sur les autres
   étages. Un nouveau poste ajouté est lui aussi créé sur toutes les pages.
   (2) Survol à la souris d'une des 6 tuiles : ouverture IMMÉDIATE de son
   sous-menu, sans clic ni délai. Réservé aux vrais pointeurs souris (sur
   écran tactile, le comportement au tap reste inchangé) ; à la souris, un
   clic sur une tuile déjà ouverte par le survol ne la referme plus.
   v2.1-52 : (1) Textes ET légende : la barre de sélection propose désormais
   une couleur de POLICE et une couleur de FOND (avec un bouton ∅ pour un
   fond transparent). Pour la légende, la couleur de police s'applique au
   titre et aux noms des postes ; un fond transparent retire aussi son
   cadre et son ombre. Correctif au passage : un changement de couleur
   n'était jamais enregistré dans l'historique ni dans la sauvegarde
   automatique (aucun pushHistory) — c'est le cas maintenant. La couleur
   d'une pastille (= couleur du poste) s'applique à toutes les pages,
   comme une modification via ✎ (v2.1-51).
   (2) Polices : tout ce qui est dessiné sur le plan demandait la police
   "Inter", jamais chargée — le navigateur se rabattait silencieusement
   sur ARIAL, police propriétaire. Remplacée partout (textes, légende,
   étiquettes des pastilles, zone d'édition, interface) par IBM Plex Sans,
   sous licence libre SIL Open Font License (usage commercial autorisé),
   déjà chargée pour l'interface ; polices propriétaires de secours
   (Segoe UI, Helvetica, Arial) retirées. Les anciens documents sont
   automatiquement affichés avec la nouvelle police. Le démarrage attend
   le chargement de la police (2,5 s max) avant le premier dessin.
   v2.1-53 : (1) Nouvelle liste de postes par défaut fournie par
   l'utilisateur (12 postes, ordre et codes repris de ses captures :
   E, NT, R, E, T, B, D, P, ST, S, iPS, MU), poste "rat" conservé en fin
   de liste pour ne pas casser les anciens documents. Identifiants des
   postes existants conservés (compatibilité) ; seul "ext. Rodenticide"
   est nouveau (type-Rext). Ne concerne que les nouveaux projets.
   (2) Liste déroulante des postes : largeur adaptée au nom le plus long
   (plus de noms coupés par « … ») et hauteur libre — tous les postes
   visibles d'un coup ; renvoi à la ligne sur petit écran plutôt que
   troncature. (3) Texte : les poignées de coin agrandissent désormais le
   cadre ET la police ensemble, proportionnellement ; et inversement, le
   curseur "Police" redimensionne aussi le cadre (lien dans les deux
   sens). Curseur "Police" étendu de 6 à 200. (4) Cadenas redessiné :
   pastille ronde rouge à liseré blanc, cadenas blanc à l'intérieur (anse
   fermée/ouverte), repositionné pour ne plus chevaucher la poignée de
   rotation (agrandie en v2.1-35).
   v2.1-54 : le cadre d'un texte avait une taille FIXE (largeur/hauteur
   enregistrées, marge de 8 px), indépendante de son contenu — d'où un
   cadre bien plus grand que le texte, surtout après un agrandissement.
   Le cadre est désormais AJUSTÉ AU TEXTE : sa taille est calculée à
   partir du contenu, avec seulement 4 px de marge tout autour, et suit
   automatiquement tout changement de texte ou de police (poignées de
   coin ou curseur). Les textes existants (anciens documents, textes par
   défaut, nouveau texte) sont convertis automatiquement au premier
   affichage SANS bouger à l'écran : la mise en page qu'ils avaient dans
   leur ancien cadre est recalculée (alignement, centrage vertical,
   retours à la ligne automatiques figés en vrais retours à la ligne) et
   leur position est corrigée en conséquence.
   v2.1-55 : fenêtres d'options étalées HORIZONTALEMENT sur toute la
   largeur de l'écran, pour prendre le moins de hauteur possible et
   laisser voir le plan. (1) Barre de sélection (texte, pastille, plan,
   logo, légende) et barres de découpe : ancrées à 8 px des deux bords au
   lieu d'être centrées depuis le milieu de l'écran (left:50% + translate)
   — ce centrage ne leur laissait que la moitié de l'écran comme place,
   d'où une barre étroite repliée en hauteur. La poignée "main rouge" fige
   la largeur de la barre avant de la déplacer. (2) Menus d'options
   (Exporter, Outils image, Ajouter un poste, Copie de page) : pleine
   largeur, réglages répartis en colonnes côte à côte. La liste des
   postes reste verticale (demandé en v2.1-53). (3) Curseur de taille du
   texte renommé "Taille" (deux réglages s'appelaient "Police").
   (4) Le cadre de sélection d'un texte suit désormais immédiatement sa
   nouvelle taille (transformer.forceUpdate).
   v2.1-56 : ROTATION DU PLAN FAÇON PAINT.NET. La poignée ronde de rotation
   est retirée sur le plan (conservée pour textes, logos et légende) et
   remplacée par une BANDE de 40 px (à l'écran) tout autour de son cadre :
   à la souris, le curseur y devient une main ouverte avec double flèche
   courbe ; en appuyant, la main se ferme et le plan tourne autour de son
   CENTRE (le coin haut-gauche est recalculé pour que le centre reste
   fixe). Au doigt, on pose le doigt dans la bande et on glisse ; une main
   fermée s'affiche près du doigt. La bande ne réagit que sur une zone
   vide (une poignée de coin, une pastille, un texte, un logo ou un autre
   plan situé dedans garde son comportement normal), et pas si le plan est
   verrouillé. LIGNE DE MIRE : horizontale + verticale, de la taille du
   plan, croisées en son centre et toujours droites, affichées pendant la
   rotation ET le déplacement du plan, avec l'angle en degrés. AIMANT : à
   moins de 4° de 0°, 90°, 180° ou 270°, le plan s'y cale (ligne de mire
   verte). Le cadenas d'un plan verrouillé se place désormais près du coin
   supérieur droit (plus de poignée de rotation à côté de laquelle se
   placer).
   v2.1-57 : (1) Poignées de redimensionnement MINIMALISTES : dessinées comme
   de petits points (rayon 6 px) au lieu de gros ronds, mais leur zone de
   saisie garde la taille complète (52 px) — aussi faciles à attraper.
   (2) Ligne de mire SUPPRIMÉE (rotation et déplacement). Aimant conservé.
   (3) Rotation du plan refaite : la bande tout autour du cadre est
   supprimée, remplacée par QUATRE ICÔNES fixes au milieu de chaque côté,
   à l'extérieur du cadre — une main ouverte GRISÉE avec un arc à double
   flèche, sans effet au repos. Au clic ou dès que le doigt se pose
   dessus, l'icône devient une MAIN FERMÉE contrastée et le plan tourne
   autour de son centre en suivant le mouvement (main fermée aussi
   affichée au-dessus du doigt et comme curseur souris). Nouveau dessin de
   main, plus réaliste (doigts, paume, pouce, relief en dégradé) — création
   originale dans l'esprit de Paint.NET, pas une copie de ses images. Les
   icônes suivent le plan en direct (déplacement, redimensionnement, zoom)
   et n'apparaissent pas si le plan est verrouillé. Rien ne s'affiche
   pendant la rotation.
   v2.1-58 : (1) Icônes de rotation remplacées par celles fournies par
   l'utilisateur (Main.svg : main ouverte + main fermée avec arc à double
   flèche, séparées et recadrées ; main ouverte grisée au repos, main
   fermée foncée pendant la rotation et comme curseur souris).
   (2) Cadenas : il ne suivait plus l'élément pendant un DÉPLACEMENT (il
   se calait sur les poignées du cadre, non recalculées pendant un
   glisser). Il se positionne maintenant sur le contour réel de l'élément
   (coin supérieur droit, légèrement à l'extérieur) et est recalculé à
   chaque mouvement, pour tous les types d'éléments ; taille constante à
   l'écran quel que soit le zoom. (3) Cadenas CLIQUABLE : un clic (ou un
   tap rapide au doigt) verrouille ou déverrouille l'élément, comme le
   bouton 🔓/🔒 de la barre de sélection (zone de tap élargie).
   v2.1-59 : sur smartphone (surtout zoomé), vouloir déplacer une pastille
   déplaçait souvent TOUT LE PLAN. Trois causes cumulées, corrigées :
   (1) le doigt ratait facilement la petite pastille et touchait le plan
   en dessous -> la pastille SÉLECTIONNÉE a maintenant une zone de saisie
   invisible couvrant toute sa zone entourée de bleu (au moins 32 px de
   rayon à l'écran, quel que soit le zoom) : un doigt posé n'importe où
   dedans attrape la pastille. (2) Le geste "glisser = faire défiler la
   vue" (outils de placement) ne vérifiait pas où le doigt était posé ->
   il ne se déclenche plus depuis une pastille, un texte, un logo, la
   légende ou une poignée, seulement depuis une zone vide ou le plan.
   (3) Le plan de fond restait déplaçable pendant le repositionnement
   d'une pastille -> il est désormais figé tant qu'une pastille est
   sélectionnée, et redevient déplaçable dès qu'on la désélectionne
   (toucher une zone vide). Le halo bleu est conservé tel quel.
   v2.1-60 : navigation au doigt dans un plan zoomé rétablie et généralisée.
   Le geste "maintenir le doigt (~0,4 s) puis glisser = faire défiler la
   vue" (déplacement de la vue entière : plan + pastilles ensemble, sans
   rien changer de place sur la feuille) n'existait qu'avec certains
   outils actifs ; il fonctionne désormais aussi SANS OUTIL et avec l'outil
   "Déplacer le plan" (depuis une zone vide), y compris quand une pastille
   est sélectionnée. Un doigt posé sur une pastille (ou sa zone bleue)
   déplace toujours la pastille. AU DOIGT, le plan importé ne se déplace
   plus sur la feuille qu'avec l'outil "Déplacer le plan" (sans outil,
   toucher le plan sert à naviguer) ; à la souris, le glisser du plan
   reste possible comme avant.
   v2.1-61 : OPTIMISATION (lot 1/5) — rotation du plan et déplacements plus
   fluides sur smartphone. Cause racine : à CHAQUE événement du doigt, le
   code détruisait puis recréait les 4 icônes de rotation et le cadenas
   (cercles + ombres floues + images), relisait la position de la feuille
   (ce qui force le navigateur à recalculer toute la page), redessinait la
   couche d'interface, et déplaçait la main sous le doigt via left/top.
   Correctif : (1) icônes de rotation et cadenas créés UNE fois puis
   seulement déplacés (aussi pendant le glissement d'une pastille, d'un
   texte, d'un logo ou du plan) ; (2) rotation calculée une seule fois par
   image d'écran (requestAnimationFrame) ; (3) position de la feuille lue
   une seule fois au début du geste ; (4) pendant la rotation, cadre bleu,
   points et cadenas masqués (ils réapparaissent au relâchement) et ombres
   des icônes coupées ; (5) main sous le doigt déplacée par transform CSS ;
   (6) l'aperçu fantôme ne redessine plus la couche d'interface quand il n'y
   a rien à montrer. L'export n'est pas touché.
   v2.1-62 : OPTIMISATION (lot 2/5) — dessin à l'écran allégé. Cause racine :
   (a) sur un téléphone à écran très fin (x3), chacune des 5 couches faisait
   ~8 millions de pixels, effacés et redessinés à chaque image ; (b) une
   couche entière ne servait qu'à porter un rectangle blanc ; (c) la couche
   du quadrillage restait composée même masquée ; (d) chaque rendu rappelait
   moveToTop() sur chaque pastille/texte/logo, puis réécrivait des styles et
   relisait la mise en page (forçant un recalcul complet de la page) ;
   (e) pendant un pincement à deux doigts, icônes, halos et couche de contenu
   étaient redessinés à chaque image, et l'ombre de la feuille repeinte.
   Correctif : (1) finesse d'écran plafonnée à x2 (Konva.pixelRatio) — SANS
   effet sur l'export, qui garde son propre pixelRatio:2 ; (2) couche "fond
   blanc" supprimée à l'écran, le blanc est ajouté uniquement dans l'image
   exportée (exportStageDataURL) : résultat identique ; (3) couche du
   quadrillage masquée en entier quand la grille est cachée ; (4) un groupe
   Konva par catégorie (lignes < pastilles < textes < logos < légende) donne
   l'empilement par structure, plus de moveToTop() à chaque rendu (un élément
   reconstruit reprend son rang d'origine via zIndex) ; (5) taille/zoom de la
   feuille, réserve de place sous la barre de sélection et barres de
   défilement ne sont réécrits/relus que s'ils changent, et regroupés sur une
   image d'écran ; (6) pincement : seul le zoom CSS bouge pendant le geste,
   le reste est recalé une fois à la fin (settleZoom), ombre de la feuille
   retirée pendant le geste.
   v2.1-63 : OPTIMISATION (lot 5/5 — sauvegarde et mémoire). Cause racine :
   la sauvegarde automatique recopiait le document ENTIER (plans en image,
   plusieurs Mo) 0,6 s après chaque changement ET toutes les 20 s même sans
   aucun changement, d'où de petits gels réguliers ; et l'historique gardait
   jusqu'à 40 copies complètes des images retouchées (mémoire saturée sur
   téléphone). Correctif : (1) sauvegarde seulement s'il y a eu un changement
   (drapeau autoSaveDirty), après 1,5 s, au moment où le navigateur est
   disponible (requestIdleCallback) ; (2) le filet de 20 s ne réessaie que
   si une sauvegarde a échoué ; (3) sauvegarde immédiate dès que la page passe
   en arrière-plan (visibilitychange / pagehide) pour ne rien perdre malgré le
   délai plus long ; (4) historique ramené de 40 à 20 étapes.
   v2.1-64 : OPTIMISATION (lot 3/5 — plans lourds), SANS PERTE à l'export.
   Cause racine : un plan importé (photo/scan de 3000-4000 px) était gardé en
   pleine définition ET redessiné tel quel à chaque image de rotation ou de
   déplacement ; le pot de peinture empilait un tableau par pixel (gel, voire
   plantage) ; chaque annulation redécodait toutes les images ; chaque cran
   d'un curseur d'image relançait un rendu complet avec filtres à la finesse
   maximale. Correctif : (1) l'image pleine définition (planNaturalCanvases)
   reste la référence unique pour pipette, pot, gomme, découpe ET EXPORT ;
   l'écran utilise une copie réduite (2400 px max, planDisplayCanvases),
   régénérée après chaque retouche ; l'export (prepareStageForExport) remet
   l'image pleine définition et recalcule les filtres à la finesse de
   l'export — qualité maximale conservée, jamais réduite ; (2) pot de
   peinture réécrit par balayage de lignes (graines à plat) : même résultat,
   sans gel ; (3) les plans inchangés ne sont plus redécodés (planCanvasSource)
   à l'annulation/rétablissement ; (4) curseurs d'image : un rendu par image
   d'écran, aperçu léger pendant le glissement puis recalcul final au
   relâchement ; idem pour les curseurs de taille de pastille et de texte.
   v2.1-65 : OPTIMISATION (lot 4/5 — pastilles et légende). Cause racine :
   dès qu'on glisse un élément, Konva redessine la couche entière ; chaque
   pastille (dégradé + ombre floue + contour + étiquette ombrée) et la légende
   (une mini-pastille par poste + son ombre) étaient recalculées en vectoriel
   à chaque image, d'où une fluidité qui baissait avec le nombre de pastilles.
   Correctif : (1) le dessin de chaque pastille (groupe "pastille-body") et la
   légende sont mis en CACHE BITMAP (finesse >= export), ils ne sont plus que
   recopiés ; halo bleu et zone de saisie restent hors cache ; (2) l'EXPORT ne
   les utilise jamais : le cache est coupé pendant la capture
   (bitmapCacheEnabled=false, dans captureAllPagesAsImages), tout est redessiné
   en vectoriel, netteté inchangée ; (3) caches refaits quand la police finit de
   charger (document.fonts.ready) et quand l'échelle de la légende change ;
   (4) lignes de raccord reconstruites seulement si l'une d'elles change
   (signature lastLinesSig) au lieu de chaque rendu.
   v2.1-66 : MISE EN LIGNE (GitHub Pages) + application installable. Le fichier
   plan-pest-control.html est renommé index.html (adresse d'accueil attendue par
   GitHub Pages, comme pour le projet OVERBOLT). Ajoutés : manifest.json (nom,
   icônes, plein écran), icon-192/512.png + apple-touch-icon.png, sw.js (service
   worker : page en "réseau d'abord" = toujours la dernière version quand il y a
   du réseau ; bibliothèques et polices mémorisées = utilisable hors ligne),
   balises <meta>/<link> d'installation dans l'en-tête et enregistrement du
   service worker en fin de script (seulement en http/https). Aucun changement
   de comportement de l'éditeur.
   v2.1-67 : correctif du mode hors ligne. Cause racine : sw.js mémorisait les
   4 bibliothèques (Konva, jsPDF, PptxGenJS, JSZip) avec cache.add en mode
   "no-cors" ; la réponse "opaque" qui en résulte est refusée par cache.add,
   donc rien n'était gardé et l'éditeur ne pouvait pas démarrer sans réseau.
   Correctif : fetch puis cache.put (les bibliothèques autorisent le CORS) ;
   CACHE_NAME passé à v2 pour repartir d'un cache propre.
   v2.1-68 : réglage de la taille des pastilles + outil par défaut. Demande de
   Mic : (1) un bouton − à gauche et un bouton + à droite du curseur de taille,
   sur le curseur du tiroir « Pastille » (prochaine pastille) ET sur celui de la
   barre de sélection (pastille sélectionnée) : 1 cran par appui, répétition de
   plus en plus rapide en maintenant (bindStepper) ; (2) une PASTILLE TÉMOIN
   dans le tiroir, à la taille réelle qu'aura la prochaine pastille sur la
   feuille au zoom actuel (2 × rayon × zoom), avec la couleur, la forme et
   l'étiquette du poste choisi (réduite et signalée si elle dépasse le cadre ;
   « taille propre au poste » pour souris/rat qui ont leur taille par défaut) ;
   (3) « Placement classique » est l'outil PAR DÉFAUT : sélectionné à
   l'ouverture, à chaque nouveau projet et rétabli dès qu'un outil se termine
   ou est décoché (DEFAULT_TOOL dans setTool) ; l'aperçu fantôme utilise la
   taille réelle du poste (effectiveNextRadius). Au passage, correctif : à
   chaque changement d'outil, la surbrillance des icônes d'orientation et de
   légende était effacée par erreur (même nettoyage que les outils) ; elle est
   rétablie. Conséquence connue de (3) : plan sélectionné/déplacé/tourné
   seulement avec l'outil « Déplacer le plan ».
   v2.1-69 : cause racine du retour de Mic (« ça continue à coller des pastilles
   quand je change de tuile ») : depuis v2.1-68, « Placement classique » est
   l'outil par défaut et il restait actif quelle que soit la tuile ouverte
   (Page, Vue, Plan, Texte…), donc chaque toucher du plan posait une pastille.
   Correctif : la dernière tuile choisie est mémorisée (activeTileId) ; choisir
   une AUTRE tuile que Pastille décoche les outils de pose (classique et déporté)
   — onTileChosen, appelé au clic sur une tuile ; revenir sur la tuile Pastille
   remet Placement classique (sans écraser un Placement déporté déjà choisi). Le
   repli automatique sur Placement classique (outil terminé, décoché, Échap) ne
   vaut plus que sur la tuile Pastille. À l'ouverture et pour un nouveau projet,
   inchangé : Placement classique sélectionné.
   =========================================================================    v2.1-70 : demande de Mic — « Déplacer le plan » doit demander « Sélectionnez le
   plan : il sera automatiquement déverrouillé. OK ? ». Cause racine : un plan
   verrouillé ne bouge pas (planCanBeDragged), et il fallait penser à utiliser
   l'outil « Verrouiller » à part, sans que rien ne l'explique. Correctif : au clic
   sur « Déplacer le plan » (à chaque fois qu'on l'active), une confirmation est
   affichée ; si OK, l'outil s'active et planUnlockPending est armé ; le prochain
   plan touché (et lui seul, les autres gardent leur verrou) est déverrouillé
   (pushHistory pour l'annulation). Annuler = rien ne change. setTool() désarme
   planUnlockPending dès qu'on change d'outil. Un second clic sur l'outil actif le
   désactive sans question.
   v2.1-71 : demande de Mic — remplacer la grande fenêtre OK/Annuler de v2.1-70 par
   une petite bulle flottante, réutilisable pour d'autres notifications. Cause
   racine : confirm() du navigateur est un gros cadre qui masque l'écran. Correctif :
   nouvelle bulle #bubble (showBubble / hideBubble, en haut de l'écran, distincte du
   toast du bas qui disparaît seul). « Déplacer le plan » active l'outil, affiche
   « Sélectionnez le plan à déplacer » et déverrouille directement le plan touché ;
   la bulle reste jusqu'à ce que le plan soit touché ou que l'outil change (setTool).
   v2.1-72 : demande de Mic — (1) la bulle passait par-dessus les tuiles ; cause : position
   fixe à 64 px du haut, sans lien avec la hauteur réelle de la barre de tuiles. Correctif :
   showBubble() la cale juste sous #mobileTileBar (mesurée à chaque affichage), avec un
   z-index inférieur à celui des tiroirs (un tiroir ouvert la masque) ; couleur orange,
   texte sombre, pour trancher avec le gris et le bleu des tuiles. (2) Le rond clair avec
   main fermée qui suivait le doigt pendant la rotation du plan (showTouchHand) est supprimé :
   l'icône au bord du plan passe déjà en main fermée, la rotation est inchangée.
   v2.1-73 : demande de Mic — être prévenu d'une nouvelle version sans la forcer. Cause
   racine : le service worker ne redemande index.html qu'au lancement ; une application
   restée ouverte (ou en arrière-plan) gardait l'ancienne version pendant des jours.
   Un rechargement automatique aurait fait perdre le travail en cours. Correctif :
   checkForUpdate() relit index.html (cache:'no-store') au démarrage (+10 s), toutes les
   5 min et au retour au premier plan, et compare le numéro de version du <title> ; s'il
   diffère, la bulle orange (désormais cliquable : showBubble(msg, onTap)) propose
   « Nouvelle version disponible — touchez ici pour la charger ». Au toucher :
   sauvegarde automatique forcée (doAutoSave) puis rechargement ; si la sauvegarde
   échoue, on ne recharge pas. La bulle revient après tout autre message de bulle.
   v2.1-74 : demande de Mic — verrouiller le plan doit désactiver « Déplacer le plan ».
   Cause racine : l'outil restait actif (et sa bulle affichée) alors que le plan, une fois
   verrouillé, ne peut plus bouger. Correctif : endMovePlanIfLocked() est appelée après le
   verrouillage d'un plan, par le bouton « Verrouiller le plan » comme par le cadenas de la
   barre de sélection ; si l'outil actif est « Déplacer le plan », il est décoché (setTool).
   v2.1-75 : demande de Mic — le cadenas d'une PASTILLE doit être tout juste à côté du
   cercle bleu, vers 10 h. Cause racine : le cadenas était calé sur le coin supérieur
   droit de la boîte englobante, donc loin du cercle bleu (halo) d'une pastille ronde.
   Correctif (updateLockIndicator) : pour une pastille, le cadenas est placé sur la
   direction « 10 h » (à 300° dans le sens horaire depuis le haut) du centre, à la
   distance rayon du halo (r+9, +2 pour le liseré) + rayon du cadenas (13 px écran) + 2 px
   d'écart. Les autres éléments (plan, texte, logo, légende) gardent le coin supérieur droit.
   v2.1-76 : demande de Mic — « je n'arrive pas à déplacer les pastilles, elles reviennent à
   leur place » et « verrouillée, je ne dois pas pouvoir la bouger, même en transparence ».
   Cause racine : avec un outil de pose actif (Placement classique par défaut), l'aperçu
   fantôme (pastille semi-transparente, updateGhost) suivait le doigt PAR-DESSUS une pastille
   verrouillée : on croyait la déplacer alors que la vraie pastille restait en place.
   (Une pastille déverrouillée se déplace normalement : vérifié en test navigateur, souris et
   tactile.) Correctif : aucun fantôme quand le pointeur est sur une pastille
   (pastilleUnderPointer, positions des nodes en direct) ; et un appui sur une pastille
   verrouillée affiche « Pastille verrouillée : touchez le cadenas pour la déverrouiller ».
   v2.1-77 : demande de Mic — le message « Pastille verrouillée » doit être la bulle orange.
   Cause racine : v2.1-76 utilisait toast() (bas de l'écran), masqué par la barre de sélection.
   Correctif : showTimedBubble(msg, ms) (bulle orange sous les tuiles, disparaît seule après
   2,5 s) utilisée pour ce message.
   v2.1-78 : demande de Mic (test, la v2.1-77 reste la référence fonctionnelle, étiquette git
   ref-v2.1-77) — suppression de l'outil « Déplacer le plan » : le verrou décide. Cause :
   un outil à part (+ bulle + déverrouillage automatique) alourdissait un geste qui doit
   être intuitif. Nouveau fonctionnement (planCanBeDragged) : plan DÉVERROUILLÉ et SÉLECTIONNÉ
   (un toucher sur le plan, outil « Plan » sans autre outil actif) = glisser le déplace
   (cadre bleu épaissi + mains de rotation) ; plan non sélectionné ou verrouillé = figé, et le
   doigt dessus fait défiler la vue comme avant. Retirés : bouton, bulle « Sélectionnez le plan
   à déplacer », planUnlockPending, endMovePlanIfLocked, entrée 'move-plan' des listes d'outils.
   v2.1-79 : demande de Mic — les exports (PDF, PPTX, PNG, JPEG, .json) portent le nom du document
   ouvert. Cause racine : l'application n'avait aucune notion de « nom de document » ; tous
   les fichiers s'appelaient « plan-pest-control ». Correctif : docName, repris du fichier de
   projet ouvert (sans .ppcx.json), mémorisé dans la sauvegarde automatique et le .json ;
   pour un nouveau projet, ensureDocName() affiche une petite carte orange qui demande le nom
   au premier export/enregistrement (Annuler = pas d'export). newProject() l'efface.
   v2.1-80 : demande de Mic — bouton « Imprimer » dans la tuile Historique. Même capture que
   l'export PDF (captureAllPagesAsImages : TOUTES les pages), envoyée à une iframe cachée
   dont le CSS impose une feuille A4 par page selon son orientation (@page nommées), puis
   window.print() ; le titre de l'iframe reprend docName pour le nom du PDF enregistré.
   v2.1-81 : demande de Mic — chaque plan a un nom différent : le nom du document demandé à
   l'enregistrement / à l'export est PRÉ-REMPLI avec le nom du plan de la page 1. Cause :
   le nom du fichier image importé n'était pas conservé. Correctif : le plan mémorise son
   nom (pl.name, sans extension) à l'import ; askDocName(prefill) le propose, modifiable.
   v2.1-82 : demande de Mic — rotation FINE du plan en gardant l'aimant 0/90/180/270. Cause :
   l'aimant (ROT_SNAP_DEG = 4°) rend impossible un réglage de quelques dixièmes de degré à la
   main. Correctif : bulle orange « − angle + » (rotFineEl), affichée dès qu'un plan est
   sélectionné et déverrouillé (même condition que les mains : rotatablePlan), pas de 0,1°,
   appui long = répétition ; rotation autour du centre, angle arrondi au dixième ; un seul
   pushHistory au relâchement. La rotation à la main et son aimant sont inchangés.
   v2.1-83 : demande de Mic — (1) choisir la tuile Pastille alors qu'un plan était sélectionné laissait
   son cadre bleu affiché ; correctif : onTileChosen('pastille') désélectionne le plan.
   (2) le bouton cadenas de la tuile Plan ne disait pas l'état du plan ; correctif :
   updatePlanLockButton() (appelée depuis updateLockIndicator, donc à chaque sélection /
   verrouillage / annulation) change l'icône (cadenas ouvert / fermé) et le texte dessous
   (« Plan verrouillé » / « Plan déverrouillé ») d'après le plan sélectionné, à défaut le 1er plan.
   v2.1-84 : demande de Mic — pour le PLAN, la barre noire du bas (texte d'aide, Dupliquer,
   Supprimer) est retirée : redimensionner par les coins est évident, Dupliquer inutilisé.
   Suppression : croix blanche sur pastille rouge, même style que le cadenas, placée juste
   dessous, directement sur le plan ; elle demande une confirmation (askYesNo, bulle orange
   Oui / Non) puis réutilise la suppression existante (bouton selDelete, annulable). La bulle
   − / + de rotation passe tout en bas de l'écran (plus de chevauchement avec les tuiles ni
   leurs tiroirs). Les autres éléments (pastille, texte, logo, légende) gardent leur barre.
   v2.1-85 : demande de Mic — sur n'importe quelle tuile autre que « Plan » (Texte, Page, Vue…),
   le plan sélectionné gardait son cadre bleu, ses mains de rotation et la bulle − / +.
   Cause : v2.1-83 ne désélectionnait le plan que pour la tuile Pastille. Correctif :
   onTileChosen() désélectionne le plan pour toute tuile ≠ « plan » ; non sélectionné, il est
   figé (planCanBeDragged exige la sélection), comme verrouillé.
   v2.1-86 : demande de Mic — le tiroir Pastille doit se réduire après la pose de la première
   pastille ou après 2 s. Cause : il restait ouvert 5 s après un appui (délai commun aux
   tiroirs à appuis répétés) et ne se fermait pas à la pose, masquant le plan. Correctif :
   tiroir Pastille = minuteur de 2 s dès l'ouverture, relancé à chaque appui dans le tiroir
   (reporté tant qu'un sous-menu / la liste des postes est ouvert) ; addPastille() le ferme
   immédiatement. Les autres tiroirs gardent leur délai de 5 s.
   v2.1-87 : demande de Mic — pastille déportée : après le 1er point, le trait doit se tracer EN
   TEMPS RÉEL jusqu'à la pastille pendant qu'on la positionne. Cause : seule la pastille
   translucide suivait le doigt ; le trait n'apparaissait qu'à la validation. Correctif :
   drawRemoteCursor() (tactile) et updateGhost() (souris) tracent un trait du point réel
   (remoteAnchor, repéré par un petit rond) jusqu'à la pastille d'aperçu, avec la couleur et
   l'épaisseur du trait définitif.
   v2.1-88 : demande de Mic — le trait définitif d'une pastille déportée différait de celui vu
   pendant le placement. Cause : l'aperçu (v2.1-87) s'arrêtait à la position BRUTE du doigt
   alors que la pastille posée est calée sur le quadrillage (snapToGrid), avec la taille du poste
   (effectiveNextRadius) et un trait légèrement ombré. Correctif : l'aperçu (tactile et souris)
   utilise la même position calée, la même taille de pastille et la même ombre que le rendu final.
   v2.1-89 : demande de Mic — (1) fluidité du curseur de placement déporté ; (2) accroche des
   pastilles sur les intersections de la grille affichée. Causes : (1) à chaque image, le
   curseur redessinait la couche d'interface, un canvas de feuille entière à la densité de
   l'écran (très lourd à envoyer au GPU d'un smartphone) ; (2) la grille affichée a un pas de
   20 (GRID_STEP) alors que l'accroche utilisait un pas de 12 (REMOTE_SNAP_STEP) : les centres
   ne tombaient jamais sur une intersection visible. Correctifs : (1) curseur et trait dans une
   couche dédiée (cursorLayer) en résolution 1, masquée hors usage ; (2) snapToGrid() = pas
   GRID_STEP, actif seulement quand la grille est affichée (le placement déporté l'affiche
   d'office), appliqué à la pose (classique et déportée, y compris le point réel), à
   l'aperçu et au glissement d'une pastille existante (dragBoundFunc : accroche en direct).
   v2.1-90 : demande de Mic — la grille ne sert plus qu'à placer les pastilles : le bouton quitte la
   tuile Vue pour la tuile Pastille (à côté des deux modes de placement), renommé « Grille
   d'accroche », avec son état dessous (« activée » / « désactivée », updateGridButton).
   Aucun changement de fonctionnement (accroche, affichage auto en placement déporté).
   v2.1-91 : demande de Mic — les textes disparaissaient sous les logos (et la légende). Cause :
   l'ordre d'empilement des groupes était lignes, pastilles, textes, logos, légende : les logos
   et la légende passaient donc par-dessus les textes. Correctif : textes en DERNIER
   (lignes, pastilles, logos, légende, textes) = toujours au premier plan, à l'écran comme
   à l'export (même contentLayer).
   v2.1-92 : demande de Mic — (1) carreaux de la grille divisés par 2 (GRID_STEP 20 -> 10, l'accroche
   suit puisqu'elle utilise GRID_STEP). (2) À la souris, le survol ouvre le tiroir mais un clic
   sur la tuile déjà ouverte ne le refermait pas (openTileDrawer(..., allowToggle=false)) ;
   le clic ferme désormais aussi à la souris. (3) Tiroirs harmonisés au minimum : boutons de taille
   identique (64 px de large) et UNE seule ligne de texte sous l'icône ; libellés courts via
   SHORT_ICON_LABELS (les infobulles gardent le texte complet) ; états dynamiques abrégés
   (Verrouillé / Déverrouillé, Grille ON / OFF).
   v2.1-93 : demande de Mic — délai de fermeture du tiroir Pastille remis à 5 s (2 s était trop court :
   PASTILLE_DRAWER_CLOSE_MS 2000 -> 5000). La fermeture immédiate à la pose d'une pastille et le
   report tant qu'un sous-menu est ouvert (v2.1-86) sont conservés.
   v2.1-94 : demande de Mic — tiroirs de TOUTES les tuiles à la même hauteur. Cause : le tiroir Pastille
   (284 px) était dominé par la pastille témoin (cadre pointillé de 104 px) ; les autres faisaient
   74 ou 136 px. Correctif : cadre du témoin supprimé, témoin limité à 40 px de diamètre
   (MAX_D, rayon 20), mention « aperçu réduit » passée en infobulle ; puis equalizeDrawerHeights()
   mesure le plus haut tiroir et impose cette hauteur à tous (variable CSS --drawer-h, recalculée à
   chaque ouverture car elle dépend de la largeur de l'écran).
   v2.1-95 : demande de Mic — suppression de la ligne « Astuce » (double-tap = verrouiller) du tiroir
   Pastille pour réduire sa hauteur, donc celle de tous les tiroirs (--drawer-h). Le geste
   reste actif ; il est documenté dans CLAUDE.md.
   v2.1-96 : demande de Mic — emplacements par défaut des 4 éléments de coin (logo Radical, logo client +
   « Adresse du client », « Mise à jour le », légende) repris de ses deux documents de test
   (TEST_LOCALISTAION_VERTICALE / HORIZONTALE). Cause : les valeurs par défaut étaient des marges
   théoriques (40 px) qui ne correspondaient pas à son placement. Correctif : CORNER_PRESETS
   (portrait / paysage, valeurs exactes des fichiers de test) utilisés par createEmptyModel,
   autoInsertCompanyLogo, autoInsertClientLogoPlaceholder. Au changement d'orientation d'un document
   dont les éléments sont ENCORE exactement sur le préréglage de l'orientation de départ, on applique
   le préréglage de la nouvelle orientation ; sinon (éléments déplacés à la main) la logique
   « marge préservée » existante s'applique, rien n'est déplacé de force (règle 2 de CLAUDE.md).
   v2.1-97 : demande de Mic — outil gomme : trait d'un point à un autre. Avant, la gomme effaçait en continu
   au fil du doigt, sans pouvoir viser un début et une fin, ni tracer droit. Nouveau fonctionnement :
   appui bref = une tache à la taille de la gomme ; appui maintenu puis glissé = aperçu du trait en
   direct du point de départ jusqu'au doigt (pointe déportée au-dessus du doigt, comme les autres outils
   tactiles), effacement au RELÂCHEMENT (eraseStroke) ; accroche automatique horizontale / verticale à
   ±5° (snapEraseEnd) ; forme carrée ou ronde ; taille par − / curseur / + avec pastille témoin
   (réglages « Outils image »). Le carré balayé est tracé comme l'enveloppe convexe des deux carrés
   d'extrémité (convexHull) ; le rond par un trait à bouts arrondis. Un seul pushHistory par trait.
   v2.1-98 : demande de Mic — (1) accroche H/V de la gomme à ± 2° au lieu de ± 5° (trop large) :
   ERASE_SNAP_DEG 5 -> 2, à l'essai. (2) Astuces supprimées partout : dernière ligne restante, celle du
   pot de peinture (« la pipette définit la couleur… ») dans les réglages Outils image.
   v2.1-99 : demande de Mic — réglages de la gomme sur UNE seule ligne (comme « Couleur du pot » et
   « Tolérance »). Cause : v2.1-97 les avait mis sur deux lignes (forme, puis taille). Correctif :
   une ligne unique « Gomme ■ ● − curseur + valeur témoin » (boutons de forme et − / + de 36 px,
   témoin de 30 px plafonné à 26 px de diamètre), forme choisie mise en surbrillance.
   v2.1-100 : demande de Mic — (1) choisir la Gomme (ou le Pot) refermait aussitôt le tiroir, avant qu'on
   puisse régler forme / taille / tolérance. Cause : setTool() appelle closeAllTileDrawers() à chaque
   changement d'outil. Correctif : pour 'eraser' et 'paint-bucket', le tiroir Plan reste ouvert et se
   referme après 5 s d'inactivité (minuteur relancé par chaque appui ou réglage dans le tiroir).
   (2) Boutons de forme illisibles (■ ●) : remplacés par « ■ Carré » et « ● Rond » (étiquette
   « Gomme » retirée pour garder la ligne unique). (3) Boutons − et + en orange (.step-btn : tiroir
   Pastille et Gomme ; .step-btn-dark : barre de sélection) pour la lisibilité.
   v2.1-101 : demande de Mic (test) — UNE SEULE tuile active à la fois, en bleu, jusqu'à ce qu'on en touche une
   autre. Avant : le bleu suivait l'ouverture du tiroir ou l'outil en cours (updateMobileTileActiveState),
   donc la tuile redevenait grise dès que le tiroir se refermait, et plusieurs règles se mélangeaient.
   Maintenant : activeTileId est la seule source (nul au démarrage et pour un nouveau projet, donc aucune
   tuile bleue et aucun outil actif) ; onTileChosen() désactive les outils de l'ancienne tuile
   (gomme, pipette, pose de pastille…), désélectionne le plan hors de la tuile Plan, et active
   Placement classique en entrant dans Pastille. Le tiroir se replie seul après 5 s (minuteur relancé
   par chaque appui ou réglage, pour TOUTES les tuiles) et dès qu'on agit : pose d'une pastille, passage
   de la gomme, pipette, pot. La tuile reste bleue ; un nouvel appui dessus rouvre / referme le tiroir.

   v2.1-102 : grand nettoyage, étape 2 — le journal ci-dessus quitte l'en-tête de index.html (fichier plus léger
   à charger) pour ce fichier JOURNAL.md ; suppression de deux fonctions jamais appelées (eraseAt,
   isRemotePastille). Aucun changement de comportement.

   v2.1-103 : grand nettoyage, étape 3 — logo Radical intégré recompressé : 900x755 RGBA de 119 Ko (159 Ko en
   base64, 28 % du fichier) -> 700x587 en PNG 256 couleurs de 14 Ko (écart moyen de couleur 1/255, transparence
   identique). Garde le format PNG et reste intégré au fichier (le fichier doit s'ouvrir sans serveur, donc pas de
   fichier séparé). Les documents déjà enregistrés gardent leur ancien logo.

   v2.1-104 : grand nettoyage, étape 4 — gestion du doigt. Mesure (profil CPU, 60 mouvements de doigt) : les
   4 gestionnaires tactiles du stage coûtent moins de 1 ms par mouvement : les fusionner n'aurait rien changé
   et aurait mis le geste au doigt (fragile) en danger -> NON FAIT. Vrai coût : à chaque événement tactile Konva
   appelle getIntersection (2 fois par mouvement), qui lit un pixel de chaque couche (getImageData) : peu cher en
   test (0,08 ms) mais lecture GPU lente sur smartphone. Correctif : stage.getIntersection garde pendant un
   geste (touchmove) l'élément touché au contact initial, comme un écran tactile natif ; recalcul au contact et au
   relâchement seulement. Souris inchangée. Les redessins (batchDraw) étaient déjà regroupés par image.

   v2.1-105 : grand nettoyage, étape 5 — sauvegarde automatique plus légère. Cause : à chaque sauvegarde (1,5 s
   après chaque modification) idbSave recopiait le document ENTIER dans IndexedDB, images de plan comprises
   (plusieurs Mo, en double : image affichée + image d'origine). Correctif : les grosses images (plans, logos) sont
   enregistrées une seule fois dans un magasin 'images' (base passée en version 2, ajout non destructif), sous une
   clé = empreinte + longueur ; le document sauvegardé ne contient que des références {__img:clé} (quelques Ko).
   Les images devenues inutiles sont supprimées dans la même transaction (écriture atomique : document et images
   cohérents). Lecture : idbLoad résout les références ; les anciennes sauvegardes (images dans le document) restent
   lisibles et passent au nouveau format à la sauvegarde suivante. Le fichier .json exporté est inchangé.

   v2.1-106 : tiroir Pastille — libellé « Taille » retiré (le curseur − / + parle de lui-même) et toutes les cases
   (poste, taille, témoin, boutons) alignées sur la même ligne médiane (align-items:center) : sur écran large
   elles étaient décalées en hauteur.

   v2.1-107 : demande de Mic (test) — options du texte dans la barre du haut. La barre noire du bas disparaît pour
   un texte : alignement, taille, couleur de police et fond sont déplacés (placeTextOptions : les mêmes éléments
   changent de parent, donc mêmes écouteurs) dans une ligne du tiroir Texte, qui s'ouvre et active la tuile
   Texte dès qu'un nouveau texte est sélectionné. Cadenas + croix rouge (confirmation « Supprimer ce texte ? »)
   directement sur le texte, comme pour le plan ; « Dupliquer » devient un bouton du tiroir. Le tiroir Texte
   suit désormais le délai de 5 s des autres tiroirs (au lieu de se fermer aussitôt) pour laisser régler le
   texte ; la zone d'options n'est pas comptée dans l'égalisation des hauteurs. Légende, logos, pastilles :
   barre du bas inchangée.

   v2.1-108 : demande de Mic — tiroir Texte allégé : boutons d'alignement, « Dupliquer » et « ∅ » retirés du tiroir
   (il reste Taille, Police, Fond). « ∅ » mettait le fond du texte à « aucun » (transparent) : il apparaissait
   bleu quand le fond était déjà transparent, donc cliquer ne changeait rien de visible. Masqué seulement dans le
   tiroir Texte (CSS) : la barre de la légende le garde. Conséquence : pour retirer un fond coloré d'un texte,
   utiliser Annuler.

   v2.1-109 : demande de Mic — modèle B pour tous les réglages à valeur : barre épaisse dont la partie orange
   montre la valeur, poignée ronde qui l'affiche, boutons carrés − / + orange aux extrémités. Appliqué à : taille
   des pastilles, taille de la gomme, tolérance du pot, luminosité / contraste / saturation / teinte, taille du
   texte (buildRangeB). Le vrai <input type=range> reste en place, transparent et par-dessus la barre : glisser,
   événements 'input' / 'change' et code existant inchangés ; l'intercepteur de .value garde la poignée à jour
   quand le code change la valeur directement. La valeur chiffrée à côté (16, 24) est masquée : elle est dans la
   poignée. La taille de la pastille dans la barre de sélection (− / + sombres) est inchangée.

   v2.1-110 : demande de Mic — le modèle B de v2.1-109 est jugé trop massif et trop impactant : remplacé par le
   modèle E « fin et discret » pour TOUS les réglages à valeur (mêmes barres, buildRangeB) : trait fin de 4 px dont
   la partie orange montre la valeur, petite poignée ronde de 16 px, boutons − / + en petits cercles clairs de 26 px
   au signe orange, valeur chiffrée en petit à droite. Mécanique inchangée (vrai <input type=range> transparent
   par-dessus, intercepteur de .value). Barre de sélection (− / + sombres) inchangée.

   v2.1-111 : demande de Mic — (1) réglages de l'image : même barre que dans le tiroir Texte (modèle E) ; (2) les mots
   Luminosité / Contraste / Saturation / Teinte sont remplacés par de petites icônes (soleil, disque noir et blanc,
   goutte, cercle des couleurs ; le mot reste en infobulle), ce qui libère la largeur pour la barre ; (3) les tiroirs
   restent affichés 10 s (au lieu de 5 s) : PASTILLE_DRAWER_CLOSE_MS et TILE_REPEAT_CLICK_DELAY_MS passent à 10000.

   v2.1-112 : demande de Mic — la valeur chiffrée (« 0 » au repos) est retirée des 4 réglages de l'image
   (luminosité, contraste, saturation, teinte) : elle n'apprend rien (opts.noValue de buildRangeB). Tolérance du
   pot, gomme, pastille et texte gardent leur valeur.

   v2.1-113 : demande de Mic — « ratés dans la numérotation » des pastilles. Cause : le numéro était « nombre de
   pastilles de CE poste + 1 » : (1) après suppression de E2, la suivante prenait E3 en doublon (E1, E3, E3) ;
   (2) les postes de même lettre (placebo ext. et rodenticide ext. = « E ») recommençaient chacun à E1 ;
   (3) « Dupliquer » recopiait l'étiquette. Correctif : nextFreeLabelNumber(code) = plus petit numéro libre parmi
   les étiquettes « CODEn » de TOUTES les pages (une suite par lettre, les trous sont comblés) ; utilisé par la
   pose, par la pastille témoin (même numéro que la prochaine pose) et par Dupliquer. Les pastilles déjà posées
   gardent leur numéro.

   v2.1-114 : demande de Mic — cadenas et croix de suppression visibles EN DEHORS de la page et toujours au premier
   plan. Cause : ils étaient dessinés dans le canevas Konva, qui s'arrête exactement aux bords de la feuille : un
   élément collé au bord (plan, texte, pastille) voyait ses icônes coupées. (Rappel : agrandir le canevas au-delà
   de la feuille est une approche abandonnée.) Correctif : cadenas et croix deviennent de vrais boutons HTML
   (placeBadges) dans une couche fixe posée sur la zone de plan et découpée à ses bords, au-dessus de la feuille ;
   leur position écran est recalculée à chaque affichage, défilement, zoom ou redimensionnement. Les anciens
   objets Konva sont remplacés par des objets de même interface (visible, position en coordonnées feuille,
   path.data) : le reste du code est inchangé. Taille et distance cadenas-croix constantes à l'écran.

   v2.1-115 : demande de Mic (essai terrain, v2.1-114 = référence) — sous la croix de suppression d'un plan, deux
   boutons ronds bleus : CISEAUX (découpe rectangulaire prête en un appui, bulle « Tracez le rectangle à
   découper », un second appui annule ; icône blanche quand l'outil est actif) et RÉGLAGES (ouvre le tiroir Plan
   avec la fenêtre « Outils image » directement). Même mécanique que le cadenas : boutons HTML (placeBadges),
   visibles hors de la page ; plan sélectionné uniquement.

   v2.1-116 : demande de Mic (essai, v2.1-115 = référence) — fonds de tiroir transparents / ajourés pour voir le plan
   derrière. Bouton « Fond » dans la tuile Vue : appuis successifs = 1 Opaque (comme avant), 2 Verre dépoli (voile
   blanc 62 % + flou), 3 Transparent (voile 26 %, éléments posés sur pastilles blanches), 4 Ajouré (aucun fond,
   éléments sur pastilles blanches, liseré). Les fenêtres d'options (.popover) suivent avec un voile minimum.
   Choix mémorisé sur l'appareil (localStorage). Pur CSS (classes drawer-bg-N sur <body>) : aucun changement de
   comportement.

v2.1-117 — Fond des tiroirs : un seul curseur de transparence, net, sans défilement
 - Demande de Mic : tiroirs entièrement visibles (pas de barre de défilement verticale), fond net (pas de flou),
   transparence réglable pour valider la bonne proportion.
 - Correctif : les 4 modes de v2.1-116 et leur bouton sont remplacés par le curseur « Fond » (0-100 %) en bas du
   tiroir Vue (variable CSS --drawer-alpha, mémorisée en localStorage). Plus de backdrop-filter ; l'ombre est
   remplacée par un liseré quand le fond est allégé. Tiroirs et fenêtres d'options : max-height none, overflow
   visible. Le tiroir reste ouvert pendant le réglage (timer repoussé). Test smoke : 9 barres au lieu de 8.

v2.1-118 — Cadre, mains et poignées du plan visibles hors de la page ; appui prolongé = sélection
 - Demande de Mic : le cadre, les mains de rotation et les poignées de redimensionnement doivent sortir de la page ;
   un appui prolongé (2 s, essai) sur un plan le sélectionne.
 - Cause : le canevas Konva s'arrêtait exactement aux bords de la feuille, tout ce qui dépassait était coupé.
 - Correctif : la zone de dessin déborde de SHEET_MARGIN (120 px) autour de la feuille (stage décalé de la marge, les
   coordonnées du document restent celles de la feuille). Les couches plan / contenu / grille sont rognées à la feuille
   (le plan ne dépasse pas visuellement) ; seule la couche UI (cadre, mains, poignées) déborde. Adaptations : helper
   stagePointer() (position sans marge), planNodeAt / toLocal / rognage (conversion de la marge), export rogné à la
   feuille, #sheetBox (zone défilable) + #sheetShadowHost (feuille seule), fitZoom centre la feuille. Un appui À VIDE
   dans la marge n'agit pas (pas de pose, pas de désélection : stage.on filtré, stage.onAny pour le pincement) et fait
   défiler la vue (marginPan). Appui prolongé 2 s immobile sur un plan non sélectionné : sélection (bascule sur la
   tuile Plan si un outil était actif). Coût : canevas ≈ 58 % plus grands en pixels.

v2.1-119 — Cadenas décalé par la marge
 - Cause : updateLockIndicator() mesurait le cadre avec getClientRect({relativeTo: uiLayer}) ; uiLayer n'étant pas un
   ancêtre du plan, la marge du stage (120) était ajoutée : cadenas, croix, ciseaux et réglages apparaissaient trop loin
   du coin du cadre.
 - Correctif : relativeTo: stage (coordonnées feuille). Test smoke ajouté (cadenas collé au coin haut-droit du cadre).
 - Non reproduit : cadre bleu plus petit que l'image (capture de Mic) ; redimensionnement, découpe, filtres, DPR 2 testés OK.

v2.1-120 — Ciseaux : un seul pointage suffit
 - Cause : le premier appui d'une découpe cherchait un plan SOUS le doigt (planNodeAt) ; à côté du plan ou sur une zone
   transparente, « Touchez un plan pour le découper » s'affichait alors que le plan était déjà sélectionné (cadre bleu).
 - Correctif : cutTargetNodeAt() prend le plan déjà sélectionné, où que tombe le doigt, sinon le plan touché
   (curseur déporté, souris rectangle, souris points). Test smoke ajouté.

v2.1-121 — Ciseaux : « Sélectionnez un plan avant de découper » alors que le plan est sélectionné
 - Cause : avec l'icône ciseaux, le curseur de découpe est créé au centre de la vue sans toucher le plan, donc sans
   cible mémorisée (cutTargetPlanId vide ou périmée) ; applyCutPolygon refusait au moment de valider. La v2.1-120 ne
   couvrait que le cas du premier appui sur le plan.
 - Correctif : applyCutPolygon prend le plan sélectionné (sinon le seul plan de la page). Test smoke ajouté.

v2.1-122 — Rotation : légende fixe, textes accrochés à 5°
 - Demande de Mic : pas de rotation pour la légende ; textes pivotables avec accroche horizontale / verticale à 5°.
 - Correctif : rotateAllowedFor() (ni plan, ni légende) pour les deux endroits qui règlent rotateEnabled ; transformer
   avec rotationSnaps [0,90,180,270] et rotationSnapTolerance 5 (vaut aussi pour les logos). Une légende déjà tournée
   dans un ancien document garde son angle (non remis à zéro).

v2.1-123 — Zoom conservé après un renommage de poste
 - Cause : à la fermeture du clavier virtuel, l'événement resize arrive quand le champ n'a plus le focus ; le test
   « typing » était faux et fitZoom() remettait le zoom et la position à zéro.
 - Correctif : fitZoom() sur resize seulement si la LARGEUR de la fenêtre change (rotation d'écran, fenêtre PC) ; le
   clavier ne change que la hauteur.

v2.1-124 — Pastilles et légende : même présentation que le plan (cadenas, croix, icône bleue)
 - Demande de Mic : le plan sert de référence ; plus de barre sombre en bas pour la légende, les textes et les pastilles.
 - Correctif : la croix rouge existe aussi pour la légende (« Masquer la légende ? ») et la pastille (suppression directe) ;
   l'icône bleue ouvre les réglages : texte -> tiroir Texte (déjà existant), pastille (nom, ✓, taille avec barre − / +,
   couleur) et légende (police, fond, ∅) -> nouvelle fenêtre claire #popSelSettings avec croix de fermeture, sous la
   barre de tuiles. Les contrôles de l'ancienne barre y sont déplacés (mêmes ids et écouteurs) ; la fenêtre se ferme
   quand la sélection change. Seuls les logos gardent la barre sombre. Le bouton « Dupliquer » disparaît avec la barre.

v2.1-125 — Icône bleue en bascule, réglages pastille sur une ligne, logos alignés, « Dupliquer » supprimé
 - Un 2e appui sur l'icône bleue referme la fenêtre d'options (plan, pastille, légende, tiroir Texte).
 - Fenêtre des réglages de pastille sur UNE ligne (nom, ✓, taille, couleur) : flex nowrap, libellé « Couleur » masqué.
 - Logos : plus de barre sombre (supprimée pour tous), cadenas + croix (confirmation « Supprimer ce logo ? ») ; pas d'icône
   bleue, un logo n'a rien à régler.
 - Bouton « Dupliquer » et son code supprimés.

v2.1-126 — Mes documents (5), « ✓ hh:mm » visible, tuile Annuler | Rétablir, flèches de déplacement fin
 - Mes documents (tiroir Historique > Documents) : base IndexedDB passée en version 3 avec un magasin « docs ». Chaque
   sauvegarde automatique écrit aussi le document léger sous son docId (seulement s'il contient un plan ou une pastille).
   idbMaintain() garde les 5 plus récents et ne supprime que les images que plus aucun document n'utilise. « Nouveau
   projet » et l'ouverture d'un .json rangent d'abord le document en cours (flushAutoSaveNow) ; idbClear() ne retire
   plus que la sauvegarde courante. Liste : Ouvrir / renommer (✎) / supprimer (🗑) ; le document en cours est marqué.
   loadDocIntoApp() factorise l'ouverture (fichier ou liste).
 - Pastille « ✓ 14:32 » à côté de la version (rouge « ⚠ non sauvegardé » en cas d'échec).
 - 7e tuile coupée en deux (Annuler | Rétablir) à droite de la barre de tuiles, grisées quand il n'y a rien à faire (essai).
   À 360 px de large, le libellé « Historique » est tronqué.
 - Flèches ← ↑ ↓ → dans la fenêtre de réglages d'une pastille : 1 unité par appui, répétition en maintenant, un seul
   pushHistory à la fin de la série.

v2.1-127 — Tuile « Fichier », tout verrouiller, plein soleil, choix des pages à exporter, légende en colonnes
 - La tuile « Historique » devient « Fichier » (libellé tronqué à 360 px ; contient annuler, documents, enregistrer, exporter).
 - Tiroir Vue : « Tout verr. / Tout déverr. » (plans, pastilles, textes, logos, légende de la page affichée ; annulable) et
   « Soleil » (classe body.sun-mode : bordures noires, textes gras, fond plus sombre ; mémorisé en localStorage).
 - Export : askPagesToExport() dans captureAllPagesAsImages() (PDF, PPTX, PNG, JPEG, impression) ; un seul étage = aucune
   question ; annuler = aucun export. La page « Récapitulatif » (v2.1-128) est décochée par défaut.
 - Légende : si elle dépasserait le bas de la page depuis sa position, 2 puis 3 colonnes (jamais plus) ; si la largeur
   sort à droite, x est ramené juste assez à gauche (même principe que le recentrage « hors feuille »).

v2.1-128 — Page « Récapitulatif des postes »
 - Bouton « Récap. » (tiroir Page) : ajoute une page en plus (model.recap, une seule par document, 11 pages max) dont le
   tableau est dessiné par renderRecapPage() : postes utilisés × pages (P1, P2…) + total par poste et total général,
   recalculé depuis les autres pages (recapGroup, reconstruit seulement si les nombres changent). Les logos et textes de
   la page 1 sont repris, la légende est masquée. Indicateur « Récap n/N ».
 - Elle s'exporte comme une page ordinaire, mais est DÉCOCHÉE par défaut dans « Pages à exporter » (le client n'en a pas
   besoin) ; la cocher l'ajoute au PDF / PPTX / PNG / JPEG.
 - Test smoke : tableau calculé, unique, décochée par défaut (le test cherche la carte de dialogue par son z-index, un
   « Annuler » du tiroir Fichier le faisait attendre indéfiniment).

v2.1-129 — Import de tous les formats d'image ; tiroirs sur une seule ligne
 - fileToImageDataURL() : PNG / JPEG gardés tels quels ; SVG dessiné dans un canevas (~2000 px, x10 max) puis PNG ; HEIC /
   HEIF décodé par le navigateur (Safari) ou par heic2any (chargé à la demande depuis jsDelivr, donc sans effet hors ligne
   tant qu'il n'a pas été mis en cache) puis JPEG ; WebP, AVIF, GIF, BMP… -> PNG. Utilisé pour l'import de plan, les logos
   entreprise / client et le collage. Message « Format d'image non pris en charge » en cas d'échec. sw.js inchangé (la
   bibliothèque est mise en cache à l'exécution).
 - Tiroirs : les icônes se partagent la largeur au lieu de 64 px fixes (.pop-wrap en display:contents) -> une seule ligne
   en portrait (testé 360 / 390 / 430 px) pour Page, Vue, Fichier, Plan, Texte ; Pastille = 2 lignes (poste + taille, puis
   outils). Libellés raccourcis (Préc., Suiv., Suppr., Verrou.), n° de page « 1/3 », indicateur de sauvegarde du tiroir
   Page retiré (déjà dans le bandeau).

v2.1-130 — Import PDF ; détection automatique ordinateur / smartphone ; raccourcis clavier
 - PDF : pdf.js 3.11.174 chargé à la demande (jsDelivr ; le « worker » est récupéré puis servi par un blob). Une page est
   dessinée en PNG (~2400 px). PDF de plusieurs pages : fenêtre de vignettes pour choisir la page ; une seule page :
   import direct. Annuler ne montre aucun message (ImportCancelled). Test avec jsPDF + pdfjs-dist local.
 - Détection : applyDeviceClass() pose body.desk quand le pointeur est une souris précise avec survol
   (matchMedia hover/pointer fine) ET que l'écran fait >= 700 px (critère = le pointeur, pas la largeur : un iPad reste
   tactile) et body.is-mac. Sur « desk » : barre de tuiles, tiroirs et fenêtres de réglages dans une colonne centrée
   (620 px, fenêtres 460 px max). Aucun changement sur smartphone.
 - Clavier : flèches = déplacement fin de l'élément sélectionné non verrouillé (Maj = 10 ; une entrée d'historique par
   série), Ctrl/⌘+S = enregistrer, Échap = désélectionner et refermer ; Ctrl/⌘+Z et Y existaient (metaKey déjà géré) ;
   sur Mac les infobulles affichent ⌘ au lieu de Ctrl.

v2.1-131 — Résolution à l'écran sur PC / Mac
 - Cause : le canevas était dessiné à un ratio fixe (écran, plafonné à 2) puis agrandi en CSS par le zoom. Sur un écran
   d'ordinateur (1 ou 1,25 pixel par pixel) on zoome presque toujours au-delà du ratio : l'image était donc étirée et floue.
   L'export PDF, dessiné à ratio 2 sans zoom, restait net. Sur téléphone, la feuille est affichée réduite : rien à voir.
 - Correctif : computeRenderRatio() / applyRenderRatio() (appelé à la fin de chaque zoom, pas pendant le pincement, et au
   changement « desk ») : ratio = max(plancher, densité d'écran × zoom), plancher = ancien ratio sur téléphone / 2 sur
   ordinateur, plafonné par un budget mémoire (6 M pixels par couche sur téléphone = jamais plus lourd qu'avant, 10 M sur
   ordinateur, soit ~2,6) et 4, par pas de 0,25. Les caches bitmap (pastilles, légende, plans filtrés) sont refaits.

v2.1-132 — Import PDF : messages clairs sur smartphone
 - Constaté par Mic : « l'import de PDF ne fonctionne pas sur smartphone » (cause exacte non reproduite en simulation : le
   test PDF passe). Hypothèse principale : le premier import télécharge pdf.js (~1 Mo) sans aucun retour visuel, ou la
   bibliothèque n'a pas pu être téléchargée.
 - Correctif de diagnostic : bulle « Lecture du PDF… » / « Création du plan… » pendant le travail, et message d'erreur qui
   dit pourquoi (réseau, mot de passe, illisible + détail).

v2.1-133 — Mode soleil : le fond des tiroirs reste transparent
 - Cause : la règle body.sun-mode imposait background:#fff !important aux tiroirs et fenêtres, annulant le curseur « Fond ».
 - Correctif : même règle avec rgba(255,255,255,var(--drawer-alpha)) ; bordures noires conservées. Test smoke ajouté.

v2.1-134 — Import PDF sur Android : « The PDF file is empty, size zero bytes »
 - Cause : le fichier choisi n'était lu qu'APRÈS le téléchargement de pdf.js (plusieurs secondes). Sur Android, le fichier
   (URI de contenu du sélecteur) devient illisible entre-temps : lecture à zéro octet. Même risque pour le HEIC.
 - Correctif : lecture immédiate du fichier en mémoire (puis chargement de la bibliothèque) ; HEIC : copie en mémoire
   transmise à heic2any ; message clair si le fichier est réellement vide.

v2.1-135 — Import PDF Android : même message avec v2.1-134
 - Constat : le message restait « The PDF file is empty » (venant de pdf.js, donc fichier lu mais vu vide par la
   bibliothèque ; notre test « 0 octet » aurait donné un autre texte). pdf.js transfère le tampon au worker.
 - Correctif : on lui donne une COPIE ; en cas d'échec, 2e voie par adresse blob: (sans transfert). Le message d'erreur
   indique la version et la taille du fichier lu pour aider au diagnostic.

Retour à la v2.1-135 (demande de Mic)
 - Le « 0 octet » venait du fichier PDF choisi par Mic, pas de l'application : la v2.1-136 (bouton « PDF » dédié) est
   annulée (git revert de f869dcf). Le code redevient celui de la v2.1-135, numéro de version compris.

v2.1-137 — Nouvelles icônes, lot 1 (les 6 tuiles)
 - Icônes SVG fournies par Mic (feuilles générées puis vectorisées) : découpées une à une (groupes de tracés par case de la
   grille), viewBox carrée resserrée, 1 décimale, intégrées en ligne dans les 6 tuiles (Page, Vue, Fichier, Plan, Pastille,
   Texte). Lots suivants à valider un par un : tiroirs Page / Vue, Fichier / Plan, Pastille / Texte, pastilles rondes
   (cadenas, croix, ciseaux, réglages) et menu « Outils image ». Icônes à refaire : cadenas ouvert, dossier + horloge,
   export, import.

v2.1-138 — Nouvelles icônes, lot 2 (tiroirs Page et Vue)
 - Page : précédente, suivante, + étage, récap, page ← / →, supprimer, nouveau projet. Vue : portrait, paysage, zoom − / +,
   ajuster, verrouiller, soleil. Outil : ico/apply.py (scratchpad) remplace l'<svg> d'un bouton par l'icône découpée.
 - Bouton actif : pastille blanche derrière l'icône (contraste sur le fond bleu).

v2.1-139 — Nouvelles icônes, lot 3 (tiroirs Fichier et Plan) + 4 icônes refaites
 - Fichier : annuler, rétablir (annuler retourné), enregistrer, ouvrir, imprimer, documents (dossier + horloge), exporter
   (boîte + flèche). Plan : importer (cadre + flèche), découpe rectangulaire / points, outils image.
 - Cadenas : deux dessins dans le bouton (fermé / ouvert), choisis par la classe is-open (plan déverrouillé ; « tout
   verrouiller » : cadenas ouvert quand tout est déjà verrouillé = l'action proposée est de déverrouiller). L'ancien code
   qui modifiait le tracé de l'anse (PLAN_LOCK_SHACKLE_*) n'est plus utilisé.

v2.1-140 — Nouvelles icônes, lot 4 (tiroirs Pastille et Texte)
 - Pastille : placement classique / déporté, grille, postes. Texte : « T » de la tuile (plus lisible que le T fin de la
   feuille), logo entreprise (maison + losange), logo client (appareil photo en pointillés), légende.

v2.1-141 — Nouvelles icônes, lot 5 (dernier) : pastilles rondes, Outils image, export
 - Pastilles rondes sur le plan : croix, ciseaux et réglages = les icônes rondes fournies (le dessin fait tout le bouton) ;
   cadenas = même rond rouge avec cadenas blanc (fermé / ouvert) composé à partir du rond de la croix ; découpe en cours =
   anneau orange. Menu Outils image : pipette, pot, gomme, luminosité, contraste (dégradé de la feuille remplacé par un
   aplat), saturation, teinte. Menu d'export : icône devant PNG / JPEG / PDF / PPTX.
 - Le jeu d'icônes est complet ; les copies de travail (feuilles SVG, découpes, apply.py / patch5.py) sont dans le dossier
   temporaire de la session, pas dans le dépôt.

v2.1-142 — Grille /2, pastille : 4 icônes en ligne + réglages sur une ligne, mode d'affichage Jour / Soleil / Nuit
 - Grille d'accroche : GRID_STEP 10 -> 5 (carreaux divisés par 2). Test « placement déporté » : centres (205,195,335,250).
 - Pastille sélectionnée : cadenas, renommer (nouvelle icône bleue, crayon blanc), supprimer, réglages rangés EN LIGNE au-dessus
   d'elle (placeBadges, badgeState.row). Renommer ouvre une carte de saisie (askPastilleLabel) qui réutilise les gestionnaires de
   #selLabel. Fenêtre de réglages : taille + couleur + flèches ← ↑ ↓ → sur UNE ligne (360 px), plus de champ de nom ni de libellé.
 - Bouton d'affichage à 3 états (jour -> plein soleil -> nuit, mémorisé) avec 3 dessins (soleil + nuage, soleil, lune) ; mode nuit
   sombre (barre, tuiles, tiroirs, fenêtres ; feuille inchangée ; icônes sur pastille claire).
 - Contraste des tuiles en mode jour : 4 propositions montrées à Mic (A bordure fine foncée, B fond bleu-gris, C bordure bleue +
   ombre, D liseré de couleur) ; choix en attente, aucune appliquée.

v2.1-143 — Tuiles plus visibles en mode jour (proposition D)
 - Fond blanc, bordure grise, ombre légère et liseré de couleur par tuile (Page foncé, Vue turquoise, Fichier bleu, Plan violet,
   Pastille rouge, Texte orange) ; uniquement hors modes Soleil / Nuit.

v2.1-144 — Pastille : UNE seule fenêtre, UNE seule ligne (essai)
 - Constat de Mic : le tiroir Pastille (2 lignes) et la fenêtre de réglages d'une pastille étaient deux fenêtres différentes.
 - Le tiroir Pastille est maintenant aussi la fenêtre de réglages : ligne unique = poste (code seul + liste déroulante) | taille
   − curseur + | placement classique, déporté, grille (icônes seules, infobulles) | flèches ← ↑ ↓ → . Le bouton « Postes » est
   masqué : « + Nouveau poste… » est au bas de la liste déroulante. Pastille sélectionnée : le curseur règle SA taille, la
   liste change SON poste (numéro suivant libre), les flèches s'activent (grisées sinon) ; l'icône bleue de la pastille ouvre ce
   tiroir (2e appui = ferme). La fenêtre #popSelSettings ne sert plus qu'à la légende.
 - Perdus dans l'essai : la couleur de la pastille (se règle dans « modifier le poste » ✎ de la liste), la pastille témoin et la
   valeur chiffrée de la taille.

v2.1-145 — 4 icônes centrées, découpe (pointillés + fenêtre orange), flèches orange
 - Pastille : les 4 icônes sont centrées sur la pastille (décalage de 64 px et non 58) ; ordre = les 2 rouges à gauche (cadenas,
   supprimer), les 2 bleues à droite (renommer, réglages).
 - Découpe : cause des pointillés qui disparaissaient = le « touchend » du relâchement vidait ghostGroup juste après
   showCutConfirm ; garde pendingCutPolygon dans ce gestionnaire et dans updateGhost. Les barres sombres du bas (validation,
   découpe point par point) deviennent des fenêtres flottantes orange sous les tuiles (comme les autres) ; plus de réserve de
   place en bas ; la bulle d'instruction est masquée quand la fenêtre apparaît.
 - Flèches de déplacement fin : sorties du tiroir Pastille, pastille orange flottante en bas (même style que le réglage de
   rotation du plan), visible seulement pour une pastille déverrouillée.

v2.1-146 — Découpe : pointillés conservés au 2e coin ; flèches en haut, ouvertes par une icône
 - Cause réelle (reproduite avec des touchers simulés) : le 2e coin se règle en déplaçant le cercle, puis se VALIDE en
   touchant le cercle. Au relâchement du doigt (avant la validation), le gestionnaire « touchend » vidait ghostGroup alors que
   le curseur était encore en phase « end » : le rectangle pointillé disparaissait. Correctif : cutPreviewActive() (zone en
   attente, ou 2e coin relâché non validé, ou points posés) protège ghostGroup dans ce gestionnaire et dans updateGhost, et
   le dernier tracé est redessiné au relâchement.
 - Flèches de déplacement fin : fenêtre orange flottante SOUS LES TUILES (en haut), avec une croix pour la fermer ; elle
   s'ouvre avec la nouvelle icône bleue « Flèches » (rond bleu, croix de 4 flèches) du tiroir Pastille, pour une pastille
   sélectionnée et déverrouillée.

v2.1-147 — Flèches de déplacement fin : démarrage immédiat, vitesse x1,5
 - Répétition dès l'appui (avant : 400 ms d'attente) toutes les 40 ms (avant : 60 ms).

v2.1-148 — Mode jour / nuit seulement, tiroir Pastille en 2 lignes, taille d'un poste, déplacement fin fluide
 - Plein soleil supprimé (code, styles, réglage mémorisé) : le bouton ne bascule plus qu'entre Jour et Nuit.
 - « Tout verrouiller » déplacé de la tuile Vue à la tuile Pastille ; tuile Fichier : annuler / rétablir masqués dans le tiroir (doublon
   avec la tuile Annuler | Rétablir ; boutons conservés pour les raccourcis) ; icône d'import : flèche rouge retournée (vers le bas).
 - Tiroir Pastille « comme Texte » : ligne 1 = icônes AVEC libellés (classique, déporté, grille, flèches, verrou, taille poste) ;
   ligne 2 = poste actif + curseur de taille pleine largeur. Nouveau « Taille poste » : fenêtre orange (poste présent sur le plan +
   curseur − / + ; case « Toutes les pages ») qui règle d'un coup la taille de toutes les pastilles du poste et sa taille par défaut.
 - Déplacement fin : mouvement continu à vitesse constante (25 unités/s) au lieu de pas de 1 unité toutes les 40 ms (petit saut au
   démarrage) ; appui bref = 1 unité exacte ; position arrondie au relâchement ; un seul pushHistory.
 - Tiroir Vue : une ligne d'icônes (portrait, paysage, zoom − / +, ajuster, jour / nuit) + curseur « Fond » sur sa propre ligne.

v2.1-149 — Appui long = tuile Plan seule active ; tiroir Vue sur une ligne ; taille par poste dans la liste ; icône déporté
 - Appui long (2 s) sur un plan : sélection + tuile Plan seule active (outils des autres tuiles désactivés, tiroirs refermés),
   que des outils soient actifs ou non (avant : seulement si un outil était actif).
 - Tiroir Vue : icônes ET curseur « Fond » compact sur UNE ligne (libellé « Fond » au-dessus, % de zoom masqué dans le tiroir).
 - Liste des postes : chaque poste a ses boutons − n + (taille du poste = taille par défaut + pastilles déjà posées sur la page
   affichée ; maintien = répétition), nom sur 2 lignes maximum, taille sous le nom. « Taille poste » : le poste choisi s'affiche comme
   dans la liste (point de couleur, code, nom) avec sa propre liste de choix.
 - « Nouveau poste » : la fenêtre reçoit une hauteur maximale + défilement quand l'écran est trop petit (fitFloatingHeight).
 - Icône du placement déporté : petits points partant de la pointe inférieure vers la droite et finissant par une croix rouge.

v2.1-150 — Contrôle intégral : nettoyage et fenêtre sombre du bas
  Cause : le message `toast` s'affichait en bandeau SOMBRE en bas de l'écran (seul vestige), et du code
  mort restait (pastille témoin masquée recalculée à chaque rendu, countPastillesOfType, rowsN,
  PLAN_LOCK_SHACKLE_*, lastTilePointerType, CSS tb-slider / tb-hint / size-ctl-lbl / .hint).
  Correctif : toast = fenêtre flottante ORANGE sous les tuiles (comme la bulle et les autres fenêtres) ;
  code et CSS morts supprimés ; vérifications et tests/smoke.js OK.

v2.1-151 — Fenêtres unifiées, pavé de rotation en haut, barre de sélection supprimée, 2 correctifs
  Cause 1 : le compteur de taille d'un poste (liste des postes) défilait sans s'arrêter : la taille était dans la signature de la liste,
  donc la ligne était reconstruite à chaque pas, le bouton disparaissait sous le doigt et le relâchement n'arrivait jamais.
  Correctif 1 : taille retirée de la signature (nombres mis à jour sur place) + relâchement écouté sur la fenêtre.
  Cause 2 : l'appui long « sélectionner le plan » (2 s, 10 px) échouait au doigt avec un outil Pastille (tremblement du doigt).
  Correctif 2 : 1 s, tolérance 22 px.
  Fenêtres : closeOtherWindows() = règle unique (tiroirs, menus, réglages, taille poste, flèches : en ouvrir une referme les autres ; Échap ferme tout).
  Pavé de rotation fine déplacé en haut (masqué pendant la découpe). Bandeaux sombres de découpe : CSS de base nettoyé.
  Barre de sélection : poignée, infos, alignement, ✓, glissement, réserve de bas d'écran supprimés (code mort).

v2.1-152 — Tiroir Pastille sur une seule ligne, liste des postes sous les tuiles
  Cause : le curseur de taille était redondant (taille réglable par poste dans la liste) et occupait une 2e ligne ; la liste déroulante,
  trop haute pour l'écran, était replacée AU-DESSUS de son bouton et masquait les tuiles.
  Correctif : curseur, − / + et valeur retirés du tiroir ; la liste des postes rejoint la ligne des 6 icônes ; positionFloating() ne place
  plus jamais une fenêtre au-dessus du bas des tuiles (hauteur limitée + défilement) ; menus ouverts depuis un tiroir le laissent ouvert.
  Étiquette « Taille poste » -> « Tailles » (tenait mal). Taille des pastilles : réglage uniquement par poste (liste).

v2.1-153 — Taille par poste = prochaines pastilles seulement ; légende « Postes »
  Cause : − / + dans la liste des postes modifiaient aussi les pastilles déjà posées (setTypeSize).
  Correctif : seule la taille par défaut du poste change (la fenêtre « Tailles » reste le moyen de tout modifier) ; ajout de l'annotation
  « Postes » sous la liste déroulante du tiroir Pastille.

v2.1-154 — Poste choisi confirmé visuellement, « Ajust. fin », liseré Annuler / Rétablir
  Cause : le poste actif n'était qu'un fond bleu pâle peu visible ; l'icône de déplacement fin s'appelait « Flèches » ; les tuiles
  Annuler / Rétablir avaient un liseré gris.
  Correctif : ✓ vert + barre bleue + gras sur le poste choisi ; étiquette « Ajust. fin » ; liseré vert sur Annuler et Rétablir.
```
