
# Fordmin - Algorithme de Ford pour le plus court chemin

Application web de recherche opérationnelle implémentant l'algorithme de Ford (minimisation) pour trouver le plus court chemin dans un graphe orienté pondéré.

## Fonctionnalités

- **Calcul automatique** : à chaque modification (ajout/suppression d’arc, changement de poids, suppression de sommet, changement de mode), le chemin optimal est recalculé instantanément.
- **Minimisation / Maximisation** : bascule entre la recherche du plus court chemin et du plus long chemin (sans cycle absorbant).
- **Détection des cycles absorbants** (cycles négatifs pour la minimisation, cycles positifs pour la maximisation).
- **Affichage de tous les chemins optimaux** si plusieurs existent.
- **Gestion des arcs et des sommets** :
  - Ajout / suppression d’arcs via un tableau éditable.
  - Suppression d’un sommet (et de tous ses arcs associés) via une liste cliquable.
- **Import / Export au format Excel (XLSX)** : structure simple (deux premières lignes pour la source et la cible, puis tableau des arcs).
- **Visualisation interactive** avec Cytoscape.js (nœuds déplaçables, zoom, surlignage du chemin optimal).
- **Exemples intégrés** (graphe du cours et petit graphe de test).
- **Interface responsive** et entièrement hors ligne (bibliothèques locales).

## Stack technique

- **Backend** : Flask (Python) avec l’implémentation maison de l’algorithme de Ford (minimisation et maximisation).
- **Frontend** : HTML/CSS/JS, Cytoscape.js, SheetJS (XLSX).
- **Conteneurisation** : Docker & Docker Compose.

## Prérequis

- Docker
- Docker Compose

## Installation et lancement

1. Cloner le dépôt

```bash
git clone https://github.com/ndrianja04/ro.git
cd ro
```

2. Construire et lancer les conteneurs

```bash
docker compose build --no-cache
docker compose up
```

3. Accéder à l'application

Ouvrir un navigateur à l'adresse : http://localhost:8080

## Utilisation

### Saisie manuelle d'un graphe

1. Choisir le mode de calcul (Minimisation / Maximisation).
2. Renseigner les sommets de départ et d’arrivée.
3. Ajouter des arcs avec le bouton +. Pour chaque arc, saisir : départ, arrivée, poids.
4. Le chemin optimal se calcule automatiquement et s’affiche dans la zone des résultats. Les arcs empruntés sont surlignés en orange dans le graphe.

### Suppression d'un sommet

- La liste de tous les sommets du graphe apparaît dans la sidebar.
- Cliquer sur la croix (×) à côté d’un sommet pour le supprimer, ainsi que tous les arcs qui y sont liés. Le calcul se relance automatiquement.

### Import / Export Excel

- Importer : cliquer sur Importer Excel et sélectionner un fichier .xlsx. Le fichier doit contenir :
    - Ligne 1 : Départ | valeur_départ
    - Ligne 2 : Arrivée | valeur_arrivée
    - Ligne 4 : De | Vers | Poids
    - Lignes suivantes : les arcs.
- Exporter : cliquer sur Exporter Excel pour télécharger le graphe courant au format .xlsx.

### Exemples intégrés

- Exemple 1 : graphe du cours (X1 à X16)
- Exemple 2 : petit graphe de test (A à D)

### Visualisation

- Les nœuds sont déplaçables.
- Zoomer / dézoomer avec la molette de la souris ou la fonction « Ajuster la vue ».
- Le chemin optimal est surligné en orange.
- Les distances minimales / maximales ne sont pas affichées sur les nœuds (réservé à la zone de résultats), mais la liste complète est disponible dans la sidebar.

### Structure du projet

```
├── backend/
│   ├── app.py          # API Flask
│   ├── ford.py         # Implémentation de l'algorithme
│   └── requirements.txt
├── frontend/
│   ├── index.html      # Interface utilisateur
│   ├── script.js       # Logique frontend
│   ├── style.css       # Styles
│   ├── nginx.conf      # Configuration du proxy
│   └── lib/            # Bibliothèques locales (Cytoscape)
├── data/               # Exemples de graphes JSON
├── Dockerfile.backend
├── Dockerfile.frontend
└── docker-compose.yml
```

### Arrêt de l'application

```bash
docker compose down
```
