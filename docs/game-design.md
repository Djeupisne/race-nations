\# Game Design — Race Nations



\## 1. Physique des véhicules



\### 1.1 Voitures (par catégorie)



| Cat | Vitesse max | Accél (0-100) | Maniabilité | Nitro | Grip sec | Grip pluie |

|---|---|---|---|---|---|---|

| D | 180-220 km/h | 5.0-6.0s | 6-8/10 | 2-3 | 1.0 | 0.7 |

| C | 250-275 km/h | 4.0-4.5s | 7-9/10 | 3 | 0.95 | 0.65 |

| B | 290-310 km/h | 3.4-3.8s | 8-9/10 | 3-4 | 0.92 | 0.62 |

| A | 330-350 km/h | 2.6-3.0s | 8-9/10 | 4 | 0.90 | 0.60 |

| S | 380-430 km/h | 1.7-2.5s | 7-9/10 | 4-5 | 0.88 | 0.58 |



\### 1.2 Motos (par catégorie)



| Cat | Vitesse max | Accél (0-100) | Maniabilité | Nitro | Grip sec | Grip pluie |

|---|---|---|---|---|---|---|

| D | 140-155 km/h | 4.6-5.0s | 9/10 | 2 | 1.05 | 0.75 |

| C | 190-210 km/h | 3.8-4.2s | 9-10/10 | 3 | 1.02 | 0.72 |

| B | 240-250 km/h | 3.3-3.5s | 9-10/10 | 3-4 | 1.00 | 0.70 |

| A | 280-295 km/h | 2.8-3.0s | 9-10/10 | 4 | 0.98 | 0.68 |

| S | 320-400 km/h | 2.0-2.5s | 8-9/10 | 4-5 | 0.95 | 0.65 |



Note : les motos ont +10% de maniabilité et -15% de grip en pluie par rapport aux voitures de même catégorie.



\### 1.3 Formule de vitesse effective

vitesse\_effective = vitesse\_max × (1 - grip\_penalty) × (1 + nitro\_boost) × (1 + draft\_boost)



\- grip\_penalty : 0 (sec) à 0.3 (pluie), selon catégorie

\- nitro\_boost : 0.3 (nitro actif) à 0 (inactif)

\- draft\_boost : 0.05 (aspiration derrière un véhicule < 20m) à 0



\### 1.4 Formule de drift

score\_drift = (angle\_deg / 10) × duration\_s × combo\_multiplier



\- angle\_deg : angle de dérive (0-90°)

\- duration\_s : durée du drift

\- combo\_multiplier : 1.0 (1 drift), 1.5 (2 drifts enchaînés), 2.0 (3+)



\### 1.5 Formule de collision

vitesse\_après\_collision = vitesse\_avant × (1 - collision\_penalty)



\- collision\_penalty : 0.15 (voiture) à 0.25 (moto)

\- Si collision frontale : collision\_penalty = 0.4



\## 2. Contrôles



\### 2.1 Mobile

\- Accélération : bouton droit

\- Frein : bouton gauche

\- Direction : tilt (gyroscope) ou volant tactile (configurable)

\- Nitro : bouton central

\- Caméra : swipe

\- Drift : maintenir frein + direction en virage

\- Pause : bouton en haut à droite



\### 2.2 Desktop

\- Accélération : W / flèche haut

\- Frein : S / flèche bas

\- Direction : A/D / flèches gauche/droite

\- Nitro : Espace

\- Caméra : souris

\- Drift : maintenir S + A/D en virage

\- Pause : Échap



\### 2.3 Gamepad (desktop)

\- Accélération : RT

\- Frein : LT

\- Direction : stick gauche

\- Nitro : A / croix

\- Caméra : stick droit

\- Drift : maintenir LT + stick gauche en virage

\- Pause : Start



\## 3. Circuits



\### 3.1 Lomé (Togo) — "Perle du Golfe"

\- Longueur : 3.2 km

\- Type : urbain, virages serrés

\- Météo : ensoleillé (80%), pluie (20%)

\- Checkpoints : 5

\- Difficulté : facile

\- Record théorique : 1:45 (voiture D), 1:35 (voiture S)



\### 3.2 Accra (Ghana) — "Côte Atlantique"

\- Longueur : 3.8 km

\- Type : mixte (urbain + autoroute)

\- Météo : ensoleillé (70%), pluie (30%)

\- Checkpoints : 6

\- Difficulté : facile-moyen

\- Record théorique : 2:00 (voiture D), 1:45 (voiture S)



\### 3.3 Lagos (Nigeria) — "Mégapole"

\- Longueur : 4.5 km

\- Type : urbain dense

\- Météo : ensoleillé (60%), pluie (40%)

\- Checkpoints : 7

\- Difficulté : moyen

\- Record théorique : 2:30 (voiture D), 2:10 (voiture S)



\### 3.4 Dakar (Sénégal) — "Corniche"

\- Longueur : 4.0 km

\- Type : côtier, virages rapides

\- Météo : ensoleillé (90%), pluie (10%)

\- Checkpoints : 6

\- Difficulté : moyen

\- Record théorique : 2:15 (voiture D), 1:55 (voiture S)



\### 3.5 Paris (France) — "Lumières"

\- Longueur : 5.0 km

\- Type : urbain, monuments

\- Météo : ensoleillé (50%), pluie (30%), nuit (20%)

\- Checkpoints : 8

\- Difficulté : moyen-difficile

\- Record théorique : 2:50 (voiture D), 2:30 (voiture S)



\### 3.6 Tokyo (Japon) — "Néons"

\- Longueur : 5.5 km

\- Type : urbain nocturne, virages techniques

\- Météo : nuit (80%), pluie (20%)

\- Checkpoints : 9

\- Difficulté : difficile

\- Record théorique : 3:10 (voiture D), 2:45 (voiture S)



\### 3.7 Abidjan (Côte d'Ivoire) — "Perle des Lagunes"

\- Longueur : 4.2 km

\- Type : mixte (urbain + lagune)

\- Météo : ensoleillé (70%), pluie (30%)

\- Checkpoints : 7

\- Difficulté : moyen

\- Record théorique : 2:20 (voiture D), 2:00 (voiture S)



\### 3.8 Nairobi (Kenya) — "Savane"

\- Longueur : 4.8 km

\- Type : mixte (urbain + savane)

\- Météo : ensoleillé (80%), pluie (20%)

\- Checkpoints : 7

\- Difficulté : moyen-difficile

\- Record théorique : 2:40 (voiture D), 2:15 (voiture S)



\### 3.9 Casablanca (Maroc) — "Nuits Blanches"

\- Longueur : 5.2 km

\- Type : urbain nocturne

\- Météo : nuit (60%), ensoleillé (30%), pluie (10%)

\- Checkpoints : 8

\- Difficulté : difficile

\- Record théorique : 3:00 (voiture D), 2:35 (voiture S)



\### 3.10 Dubaï (Émirats) — "Désert Futuriste"

\- Longueur : 5.5 km

\- Type : autoroute + désert

\- Météo : ensoleillé (100%)

\- Checkpoints : 9

\- Difficulté : difficile

\- Record théorique : 3:15 (voiture D), 2:45 (voiture S)



\## 4. Progression



\### 4.1 XP

\- Course gagnée : +100 XP

\- Course perdue : +30 XP

\- Mission journalière : +50 XP

\- Mission hebdomadaire : +500 XP

\- Mission saisonnière : +2000 XP

\- Succès : +10 à +500 XP (selon difficulté)

\- Courbe : XP requis = niveau × 100

\- Max : niveau 100



\### 4.2 PL (Performance Level)

\- Victoire : +25 PL

\- Défaite : -20 PL

\- Match nul : +0 PL

\- Abandon : -30 PL (pénalité)

\- Cap minimum : 0

\- Cap maximum : aucun (mais 3000+ = Légende)

\- Reset saisonnier : retour à 50% du PL



\### 4.3 Divisions (avec promotions/relégations)



| Division | PL min | PL max | Couleur | Promotion | Relégation |

|---|---|---|---|---|---|

| Bronze | 0 | 499 | #CD7F32 | +500 → Argent | — |

| Argent | 500 | 999 | #C0C0C0 | +1000 → Or | -50 → Bronze |

| Or | 1000 | 1499 | #FFD700 | +1500 → Platine | -50 → Argent |

| Platine | 1500 | 1999 | #00CED1 | +2000 → Diamant | -50 → Or |

| Diamant | 2000 | 2499 | #B9F2FF | +2500 → Maître | -50 → Platine |

| Maître | 2500 | 2999 | #9932CC | +3000 → Légende | -50 → Diamant |

| Légende | 3000 | ∞ | #FF4500 | — | -100 → Maître |



\### 4.4 Réputation

\- Plage : 0-100

\- Initial : 50

\- Gain : course terminée sans abandon +1, victoire propre (0 collision) +2, aide à un joueur (coop) +5

\- Perte : abandon -5, rapport signalé (confirmé) -10, triche détectée -50, multi-compte -100 (ban direct)

\- Effets : réputation < 30 = pas de paris HARD ni tournois payants ; réputation < 10 = bannissement temporaire (7j)



\### 4.5 Récompenses par course



| Position | Crédits | Gemmes | XP | Tokens |

|---|---|---|---|---|

| 1er | 150 | 8 | 120 | 5 |

| 2e | 90 | 5 | 80 | 3 |

| 3e | 60 | 3 | 60 | 2 |

| 4e-8e | 30 | 1 | 40 | 1 |

| Abandon | 0 | 0 | 0 | 0 |



Bonus : course parfaite (0 collision) +50% crédits, record du circuit +200 crédits, première victoire du jour +100 crédits, série de 3 victoires +100 crédits + 5 gemmes



\### 4.6 Récompenses de division (fin de saison)



| Division | Gemmes | Crédits | Cosmétique |

|---|---|---|---|

| Bronze | 50 | 5000 | Sticker |

| Argent | 100 | 10000 | Skin |

| Or | 200 | 20000 | Skin + Sticker |

| Platine | 400 | 40000 | Skin + Néon |

| Diamant | 800 | 80000 | Skin + Néon + Effet |

| Maître | 1500 | 150000 | Cosmétique exclusif |

| Légende | 3000 | 300000 | Cosmétique légendaire + titre |



\## 5. Matchmaking



\### 5.1 Algorithme

\- Basé sur : PL (priorité), région (ping), temps d'attente

\- Fenêtre PL initiale : ±200 PL

\- Après 30s : ±300 PL

\- Après 60s : ±400 PL

\- Après 90s : ±500 PL + bots autorisés

\- Attente max : 120s



\### 5.2 Région

\- Priorité : ping < 80ms

\- Acceptable : ping < 150ms

\- Refus : ping > 150ms (sauf si attente > 60s)

\- Régions : Afrique, Europe, Amériques, Asie



\### 5.3 Formats

\- 1v1 : course classée, paris

\- 3v3 : course rapide

\- Matchday : 3-8 joueurs (voitures vs motos)

\- Tournoi : bracket 8/16/32

\- Élimination : 8 joueurs

\- Battle Royale : 16 joueurs



\### 5.4 Bots

\- Utilisation : si attente > 90s

\- Difficulté : adaptée au PL du joueur

\- Récompenses : 50% des crédits normaux, pas de gemmes

\- PL : impact réduit (50%)



\### 5.5 Draft (aspiration)

\- Actif si 2 véhicules à < 20m l'un derrière l'autre

\- Boost de vitesse : +5% pour le suiveur

\- Boost de nitro recharge : +10%

\- Effet visuel : traînée de vitesse



\### 5.6 Drift

\- Actif en virage avec frein + direction

\- Score de drift : voir formule section 1.4

\- Recharge nitro : +5% par seconde de drift

\- Effet visuel : fumée, marques au sol



\## 6. Paris (défis 1v1 avec mise)



\### 6.1 Modèle parimutuel

\- Deux joueurs misent une somme identique

\- Le gagnant remporte la mise du perdant moins la commission

\- La commission (5%) va au propriétaire (house wallet)

\- Modèle : parimutuel (cagnotte partagée entre gagnants)



\### 6.2 Formule

totalPool = mise\_joueur\_A + mise\_joueur\_B

houseCut = floor(totalPool × houseEdgeBps / 10000)

netPool = totalPool - houseCut

payout\_gagnant = netPool

payout\_perdant = 0



Exemple : Joueur A mise 100, joueur B mise 100. totalPool = 200, houseCut = 200 × 500 / 10000 = 10, netPool = 190. Si A gagne : A reçoit 190 (bénéfice net +90), B perd 100, house gagne 10.



\### 6.3 Règles

\- Mise identique obligatoire

\- Mise min : 10 crédits (SOFT) / 1€ (HARD)

\- Mise max : 10000 crédits (SOFT) / 100€ (HARD)

\- Mise plafonnée par limite journalière (10000 crédits/jour)

\- Monnaie : SOFT (crédits) ou HARD (argent réel, si licence)

\- Activation par pays (Togo d'abord)



\### 6.4 Flux

1\. Joueur A crée un défi (mise X, PL ±300)

2\. Joueur B accepte (mise identique)

3\. Matchmaking → course 1v1

4\. Course terminée → settlement

5\. Gagnant crédité, house créditée, perdant débité



\### 6.5 Cas limites

\- Égalité : remboursement intégral (pas de houseCut)

\- Abandon : le joueur qui abandonne perd sa mise

\- Déconnexion : si < 30s, reprise possible ; sinon abandon

\- Triche détectée : remboursement + sanction

\- Litige : gel du payout jusqu'à résolution admin (max 72h)



\### 6.6 Paris de tournoi

\- Possibilité de parier sur le vainqueur d'un tournoi

\- Cotes dynamiques (parimutuel)

\- Mise min : 50 crédits, Mise max : 50000 crédits, Commission : 5%



\## 7. Économie



\### 7.1 Sources de crédits

\- Courses : 30-150 crédits/course

\- Missions : 100-500 crédits

\- Succès : 50-1000 crédits

\- Battle Pass gratuit : 5000 crédits/saison

\- Publicités (optionnel) : 50 crédits/vidéo



\### 7.2 Sources de gemmes

\- Courses (top 3) : 3-8 gemmes

\- Succès : 5-200 gemmes

\- Battle Pass gratuit : 100 gemmes/saison

\- Battle Pass payant : 500 gemmes/saison

\- Classements : 30-10000 gemmes

\- Achats in-app : 100-14000 gemmes



\### 7.3 Dépenses

\- Véhicules : 3000-600000 crédits ou 400-6000 gemmes

\- Cosmétiques : 50-500 gemmes

\- Battle Pass : 950 gemmes

\- Paris : 10-10000 crédits (SOFT) ou 1-100€ (HARD)

\- Clans : 500 gemmes (création)



\### 7.4 Équilibre

\- Crédits gagnés/heure : \~800 (course rapide) à \~2000 (classée)

\- Gemmes gagnées/heure : \~20 (course rapide) à \~60 (classée)

\- Temps pour véhicule A : \~15h de jeu (ou 10€)

\- Temps pour véhicule S : \~40h de jeu (ou 20€)



\## 8. Battle Pass (saison 1)



\### 8.1 Niveaux gratuits (1-20)

\- Niv 1 : 100 crédits

\- Niv 5 : 50 gemmes

\- Niv 10 : Sticker "Nations"

\- Niv 15 : 200 gemmes

\- Niv 20 : Véhicule D exclusif



\### 8.2 Niveaux payants (1-50)

\- Niv 1 : 500 crédits

\- Niv 5 : 100 gemmes

\- Niv 10 : Skin "Or"

\- Niv 15 : 300 gemmes

\- Niv 20 : Véhicule C exclusif

\- Niv 25 : 500 gemmes

\- Niv 30 : Skin "Diamant"

\- Niv 35 : 800 gemmes

\- Niv 40 : Véhicule B exclusif

\- Niv 45 : 1000 gemmes

\- Niv 50 : Véhicule A exclusif



\## 9. Missions (saison 1)



\### 9.1 Journalières (3/jour, reset à minuit)

1\. "Gagne 1 course" → 50 XP + 100 crédits

2\. "Fais 3 courses" → 50 XP + 100 crédits

3\. "Utilise 5 nitro" → 50 XP + 100 crédits



\### 9.2 Hebdomadaires (5/semaine, reset lundi)

1\. "Gagne 10 courses" → 500 XP + 500 crédits

2\. "Atteins la division Or" → 500 XP + 500 crédits

3\. "Fais 20 courses" → 500 XP + 500 crédits

4\. "Gagne 5 paris" → 500 XP + 500 crédits

5\. "Ajoute 3 amis" → 500 XP + 500 crédits



\### 9.3 Saisonnières (10/saison)

1\. "Atteins 2000 PL" → 2000 XP + 50 gemmes

2\. "Gagne 50 courses classées" → 2000 XP + 50 gemmes

3\. "Gagne 20 paris" → 2000 XP + 50 gemmes

4\. "Possède 10 véhicules" → 2000 XP + 50 gemmes

5\. "Atteins le top 100 de ton pays" → 2000 XP + 50 gemmes

6\. "Fais 100 courses" → 2000 XP + 50 gemmes

7\. "Gagne 10 courses d'affilée" → 2000 XP + 50 gemmes

8\. "Complète le Battle Pass" → 2000 XP + 50 gemmes

9\. "Gagne 1 tournoi" → 2000 XP + 50 gemmes

10\. "Atteins la division Diamant" → 2000 XP + 50 gemmes



\### 9.4 Défis hebdomadaires (1/semaine)

1\. "Bats le record du circuit de Lomé" → 1000 XP + 100 gemmes + cosmétique

2\. "Fais 100000 points en Drift Challenge" → 1000 XP + 100 gemmes

3\. "Gagne 5 Battle Royale" → 1000 XP + 100 gemmes

4\. "Complète le chapitre 5 de la Carrière" → 1000 XP + 100 gemmes



\## 10. Succès (Achievements) — 80 au lancement



\### 10.1 Course (20)

\- Première victoire : 5 gemmes

\- 10 victoires : 10 gemmes

\- 50 victoires : 25 gemmes

\- 100 victoires : 50 gemmes

\- 500 victoires : 100 gemmes

\- 1000 victoires : 200 gemmes

\- Premier top 3 : 5 gemmes

\- 100 top 3 : 25 gemmes

\- 500 top 3 : 75 gemmes

\- Course parfaite (0 collision) : 10 gemmes

\- 10 courses parfaites : 50 gemmes

\- 100 courses parfaites : 200 gemmes

\- Record sur Lomé : 20 gemmes

\- Record sur Accra : 20 gemmes

\- Record sur Lagos : 20 gemmes

\- Record sur Dakar : 20 gemmes

\- Record sur Paris : 20 gemmes

\- Record sur Tokyo : 20 gemmes

\- Record sur Abidjan : 20 gemmes

\- Record sur Nairobi : 20 gemmes



\### 10.2 Progression (15)

\- Niveau 10 : 10 gemmes

\- Niveau 25 : 20 gemmes

\- Niveau 50 : 50 gemmes

\- Niveau 100 : 100 gemmes

\- Division Argent : 10 gemmes

\- Division Or : 20 gemmes

\- Division Platine : 30 gemmes

\- Division Diamant : 50 gemmes

\- Division Maître : 75 gemmes

\- Division Légende : 100 gemmes

\- 1000 PL : 20 gemmes

\- 2000 PL : 50 gemmes

\- 3000 PL : 100 gemmes

\- Saison complète : 50 gemmes

\- 5 saisons complètes : 200 gemmes



\### 10.3 Social (10)

\- Premier ami : 5 gemmes

\- 10 amis : 10 gemmes

\- 50 amis : 25 gemmes

\- 100 amis : 50 gemmes

\- Premier clan : 10 gemmes

\- 10 membres dans ton clan : 25 gemmes

\- 50 membres dans ton clan : 100 gemmes

\- 50 messages envoyés : 10 gemmes

\- 100 messages envoyés : 25 gemmes

\- Gagner une guerre de clan : 100 gemmes



\### 10.4 Paris (10)

\- Premier pari : 5 gemmes

\- 10 paris gagnés : 25 gemmes

\- 50 paris gagnés : 50 gemmes

\- 100 paris gagnés : 100 gemmes

\- 500 paris gagnés : 300 gemmes

\- Gagner 10 paris d'affilée : 50 gemmes

\- Gagner 50 paris d'affilée : 200 gemmes

\- Miser 10000 crédits en un pari : 50 gemmes

\- Gagner un pari de 10000 crédits : 100 gemmes

\- Gagner un tournoi de paris : 200 gemmes



\### 10.5 Collection (15)

\- Premier véhicule acheté : 5 gemmes

\- 5 véhicules : 10 gemmes

\- 10 véhicules : 25 gemmes

\- 20 véhicules : 50 gemmes

\- 50 véhicules : 200 gemmes

\- 15 voitures : 25 gemmes

\- 25 voitures : 75 gemmes

\- 10 motos : 25 gemmes

\- 15 motos : 75 gemmes

\- 5 skins : 20 gemmes

\- 10 stickers : 20 gemmes

\- 5 néons : 20 gemmes

\- 10 effets : 30 gemmes

\- Collection complète voitures : 500 gemmes

\- Collection complète motos : 300 gemmes



\### 10.6 Compétition (10)

\- Gagner 1 tournoi : 50 gemmes

\- Gagner 10 tournois : 200 gemmes

\- Gagner 50 tournois : 500 gemmes

\- Top 100 mondial : 100 gemmes

\- Top 10 mondial : 500 gemmes

\- Top 1 mondial : 1000 gemmes

\- Top 100 pays : 50 gemmes

\- Top 10 pays : 200 gemmes

\- Top 1 pays : 500 gemmes

\- Gagner 10 Battle Royale : 100 gemmes



\## 11. Trust score

\- Plage : 0-100

\- Initial : 100

\- Baisse : abandon -10, rapport signalé (confirmé) -20, triche détectée -50, multi-compte -100 (ban direct)

\- Hausse : 10 courses sans abandon +5, 50 courses sans abandon +10, 100 courses sans abandon +20

\- Effets : Trust < 50 = avertissement, pas de paris HARD ; Trust < 30 = suspension 24h ; Trust < 10 = bannissement définitif

