import json
import sys
import math
import re
from collections import defaultdict


def _construire_chemins(cible, source, pred):
    """
    Reconstruction itérative de tous les chemins optimaux de source à cible.
    Remplace la version récursive pour éviter les RecursionError sur grands graphes
    et les boucles infinies en cas de cycles dans pred (ex: arcs de poids nul).

    Args:
        cible:  Sommet d'arrivée.
        source: Sommet de départ.
        pred:   Dictionnaire des prédécesseurs {sommet: [prédécesseurs]}.

    Returns:
        Liste de chemins [[source, ..., cible], ...].
    """
    if cible == source:
        return [[source]]

    results = []
    # Pile : (nœud courant, chemin à rebours depuis cible, nœuds visités)
    stack = [(cible, [cible], {cible})]

    while stack:
        current, path_back, visited = stack.pop()

        if current == source:
            results.append(list(reversed(path_back)))
            continue

        if current not in pred or not pred[current]:
            continue  # nœud non atteignable depuis source

        for p in pred[current]:
            if p not in visited:  # évite les cycles dans pred
                stack.append((p, path_back + [p], visited | {p}))

    return results


def ford_minimisation(vertices, arcs, source, cible, ordre=None):
    """
    Algorithme de Ford pour le plus court chemin (minimisation).

    Args:
        vertices: Liste des noms des sommets.
        arcs:     Liste de tuples (u, v, poids).
        source:   Sommet de départ.
        cible:    Sommet d'arrivée.
        ordre:    Ordre facultatif des sommets.

    Returns:
        dist:    Dictionnaire {sommet: distance minimale depuis source}.
        chemins: Liste des chemins optimaux de source à cible.
    """
    if ordre is None:
        ordre = list(vertices)

    index_of = {v: i for i, v in enumerate(ordre)}

    dist = {v: math.inf for v in vertices}
    pred = defaultdict(list)
    dist[source] = 0

    change = True
    while change:
        change = False
        arcs_tries = sorted(arcs, key=lambda e: (index_of[e[0]], index_of[e[1]]))
        for u, v, w in arcs_tries:
            i, j = index_of[u], index_of[v]
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                pred[v] = [u]
                change = True
                if i > j:
                    break
            elif dist[u] + w == dist[v] and u not in pred[v]:
                pred[v].append(u)
        else:
            continue
        # break déclenché sur arc rétrograde → relance la boucle while

    # Détection de cycle absorbant (négatif)
    for u, v, w in arcs:
        if dist[u] + w < dist[v]:
            raise Exception("Cycle absorbant (négatif) détecté")

    return dist, _construire_chemins(cible, source, pred)


def ford_maximisation(vertices, arcs, source, cible, ordre=None):
    """
    Algorithme de Ford pour le plus long chemin (maximisation).

    Args:
        vertices: Liste des noms des sommets.
        arcs:     Liste de tuples (u, v, poids).
        source:   Sommet de départ.
        cible:    Sommet d'arrivée.
        ordre:    Ordre facultatif des sommets.

    Returns:
        dist:    Dictionnaire {sommet: valeur maximale depuis source}.
        chemins: Liste des chemins optimaux de source à cible.
    """
    if ordre is None:
        ordre = list(vertices)

    index_of = {v: i for i, v in enumerate(ordre)}

    # CORRECTION : -inf pour tous les sommets, 0 pour la source uniquement.
    # L'ancienne init à 0 pour tous donnait des valeurs incorrectes (0 au lieu
    # de -inf) pour les sommets non atteignables depuis la source.
    dist = {v: -math.inf for v in vertices}
    pred = defaultdict(list)
    dist[source] = 0

    change = True
    while change:
        change = False
        arcs_tries = sorted(arcs, key=lambda e: (index_of[e[0]], index_of[e[1]]))
        for u, v, w in arcs_tries:
            i, j = index_of[u], index_of[v]
            # Garde : on ne propage pas depuis un sommet non atteignable
            if dist[u] == -math.inf:
                continue
            if dist[u] + w > dist[v]:
                dist[v] = dist[u] + w
                pred[v] = [u]
                change = True
                if i > j:
                    break
            elif dist[u] + w == dist[v] and u not in pred[v]:
                pred[v].append(u)
        else:
            continue
        # break déclenché sur arc rétrograde → relance la boucle while

    # Détection de cycle absorbant (positif)
    for u, v, w in arcs:
        if dist[u] != -math.inf and dist[u] + w > dist[v]:
            raise Exception("Cycle absorbant (positif) détecté - pas de plus long chemin fini")

    return dist, _construire_chemins(cible, source, pred)


def cle_tri(v):
    """Tri des sommets par suffixe numérique si présent."""
    if isinstance(v, int):
        return v
    if isinstance(v, str):
        match = re.search(r'(\d+)$', v)
        if match:
            return int(match.group(1))
    return v


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ford.py graphe.json [--mode min|max]")
        sys.exit(1)

    nom_fichier = sys.argv[1]
    mode = "min"
    if len(sys.argv) >= 4 and sys.argv[2] == "--mode":
        mode = sys.argv[3] if sys.argv[3] in ("min", "max") else "min"

    with open(nom_fichier, 'r') as f:
        donnees = json.load(f)

    source = donnees["source"]
    cible  = donnees["target"]
    arcs   = [(a["from"], a["to"], a["weight"]) for a in donnees["arcs"]]

    sommets = set()
    for u, v, _ in arcs:
        sommets.add(u)
        sommets.add(v)
    sommets = list(sommets)

    if mode == "max":
        distances, chemins = ford_maximisation(sommets, arcs, source, cible)
        print("Valeurs maximales (plus long chemin) :")
    else:
        distances, chemins = ford_minimisation(sommets, arcs, source, cible)
        print("Distances minimales :")

    for v in sorted(sommets, key=cle_tri):
        d = distances[v]
        if d == math.inf:
            label = "∞"
        elif d == -math.inf:
            label = "-∞"
        else:
            label = str(d)
        print(f"{v}: {label}")

    print(f"\nChemin(s) optimal(aux) de {source} à {cible} (poids {distances[cible]}) :")
    for chemin in chemins:
        print(" -> ".join(chemin))
