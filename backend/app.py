from flask import Flask, request, jsonify
from ford import ford_minimisation

app = Flask(__name__)

@app.route('/solve', methods=['POST'])
def solve():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Données JSON invalides'}), 400

    source = data.get('source')
    target = data.get('target')
    arcs = data.get('arcs', [])

    if not source or not target:
        return jsonify({'error': 'Source et cible requises'}), 400
    if not isinstance(arcs, list) or len(arcs) == 0:
        return jsonify({'error': 'Au moins un arc requis'}), 400

    # Validation simple des arcs
    for a in arcs:
        if not all(k in a for k in ('from', 'to', 'weight')):
            return jsonify({'error': 'Arc mal formé'}), 400
        if not isinstance(a['weight'], (int, float)):
            return jsonify({'error': 'Le poids doit être un nombre'}), 400

    vertices = set()
    for a in arcs:
        vertices.add(a['from'])
        vertices.add(a['to'])
    vertices = list(vertices)
    edges = [(a['from'], a['to'], a['weight']) for a in arcs]

    try:
        dist, paths = ford_minimisation(vertices, edges, source, target)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    # Convertir les distances en valeurs JSON (math.inf -> null)
    dist_json = {v: (None if d == float('inf') else d) for v, d in dist.items()}
    return jsonify({'distances': dist_json, 'paths': paths})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
