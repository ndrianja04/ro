import json
import sys
import math
import re
from collections import defaultdict

def ford_minimisation(vertices, arcs, source, cible, ordre=None):
    """
    Algorithme de Ford pour le plus court chemin (minimisation).

    Args:
        vertices: Liste des noms des sommets.
        arcs: Liste de tuples (u, v, poids).
        source: Sommet de départ.
        cible: Sommet d'arrivée (utilisé pour la reconstruction).
        ordre: Ordre facultatif des sommets. Par défaut, utilise l'ordre de la liste vertices.

    Returns:
        dist: Dictionnaire {sommet: distance} depuis la source.
        chemins: Liste des chemins optimaux de la source à la cible.
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
                    # Recommencer à partir de j selon la règle de Ford
                    break
            elif dist[u] + w == dist[v] and u not in pred[v]:
                pred[v].append(u)
        else:
            continue
        # break déclenché, on relance la boucle while

    # Détection de cycle absorbant
    for u, v, w in arcs:
        if dist[u] + w < dist[v]:
            raise Exception("Cycle absorbant détecté")

    def construire_chemins(courant):
        if courant == source:
            return [[source]]
        if courant not in pred or not pred[courant]:
            return []
        chemins = []
        for p in pred[courant]:
            for sous_chemin in construire_chemins(p):
                chemins.append(sous_chemin + [courant])
        return chemins

    tous_chemins = construire_chemins(cible)
    return dist, tous_chemins

def cle_tri(v):
    """Fonction de tri des sommets par suffixe numérique si présent."""
    if isinstance(v, int):
        return v
    if isinstance(v, str):
        match = re.search(r'(\d+)$', v)
        if match:
            return int(match.group(1))
    return v

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ford.py graphe.json")
        sys.exit(1)

    nom_fichier = sys.argv[1]
    with open(nom_fichier, 'r') as f:
        donnees = json.load(f)

    source = donnees["source"]
    cible = donnees["target"]
    arcs = [(a["from"], a["to"], a["weight"]) for a in donnees["arcs"]]

    sommets = set()
    for u, v, _ in arcs:
        sommets.add(u)
        sommets.add(v)
    sommets = list(sommets)

    distances, chemins = ford_minimisation(sommets, arcs, source, cible)

    print("Distances minimales :")
    for v in sorted(sommets, key=cle_tri):
        print(f"{v}: {distances[v]}")
    print(f"\nChemin(s) optimal(aux) de {source} à {cible} (poids {distances[cible]}) :")
    for chemin in chemins:
        print(" -> ".join(chemin))
