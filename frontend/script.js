// ---------- État global ----------
let arcs = [];
let cy = null;
let currentPaths = [];

// ---------- Fonctions de mise à jour du tableau HTML ----------
function updateTable() {
    const tbody = document.getElementById('edges-body');
    tbody.innerHTML = '';
    arcs.forEach((arc, idx) => {
        const row = tbody.insertRow();
        row.insertCell(0).innerHTML = `<input type="text" value="${escapeHtml(arc.from)}" data-index="${idx}" data-field="from" class="edge-input">`;
        row.insertCell(1).innerHTML = `<input type="text" value="${escapeHtml(arc.to)}" data-index="${idx}" data-field="to" class="edge-input">`;
        row.insertCell(2).innerHTML = `<input type="number" value="${arc.weight}" data-index="${idx}" data-field="weight" step="any" class="edge-input">`;
        const delCell = row.insertCell(3);
        const delBtn = document.createElement('button');
        delBtn.textContent = '✖';
        delBtn.className = 'delete-edge-btn';
        delBtn.style.background = '#fee2e2';
        delBtn.style.border = 'none';
        delBtn.style.borderRadius = '20px';
        delBtn.style.padding = '4px 8px';
        delBtn.style.cursor = 'pointer';
        delBtn.onclick = () => {
            arcs.splice(idx, 1);
            updateTable();
            updateGraphVisualization();
        };
        delCell.appendChild(delBtn);
    });
    attachInputListeners();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function attachInputListeners() {
    document.querySelectorAll('#edges-body input').forEach(input => {
        input.removeEventListener('change', handleInputChange);
        input.addEventListener('change', handleInputChange);
    });
}

function handleInputChange(e) {
    const idx = parseInt(e.target.getAttribute('data-index'));
    const field = e.target.getAttribute('data-field');
    let value = e.target.value;
    if (field === 'weight') {
        value = parseFloat(value);
        if (isNaN(value)) value = 0;
    }
    arcs[idx][field] = value;
    updateGraphVisualization();
}

// ---------- Visualisation avec Cytoscape ----------
function initCytoscape() {
    const container = document.getElementById('cy');
    cy = cytoscape({
        container: container,
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#6c5ce7',
                    'label': 'data(label)',
                   'font-size': '14px',
                   'width': '40px',
                   'height': '40px',
                   'text-valign': 'center',
                   'text-halign': 'center',
                   'color': '#fff',
                   'font-weight': 'bold',
                   'border-width': 2,
                   'border-color': '#fff'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#94a3b8',
                    'target-arrow-color': '#94a3b8',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(weight)',
                   'font-size': '11px',
                   'text-rotation': 'autorotate',
                   'color': '#334155'
                }
            },
            {
                selector: 'node.source',
                style: {
                    'background-color': '#00b894',
                   'border-color': '#fff',
                   'border-width': 3
                }
            },
            {
                selector: 'node.target',
                style: {
                    'background-color': '#d63031',
                   'border-color': '#fff',
                   'border-width': 3
                }
            },
            {
                selector: 'edge.optimal',
                style: {
                    'line-color': '#fdcb6e',
                   'target-arrow-color': '#fdcb6e',
                   'width': 4,
                   'opacity': 1
                }
            }
        ],
        layout: {
            name: 'cose',
            animate: false,
            idealEdgeLength: 100,
            nodeRepulsion: 4000,
            gravity: 0.1
        }
    });
    return cy;
}

function updateGraphVisualization() {
    if (!cy) return;

    const nodesSet = new Set();
    arcs.forEach(arc => {
        if (arc.from && arc.from.trim() !== '') nodesSet.add(arc.from.trim());
        if (arc.to && arc.to.trim() !== '') nodesSet.add(arc.to.trim());
    });

        const sourceVal = document.getElementById('source').value.trim();
        const targetVal = document.getElementById('target').value.trim();

        const nodes = Array.from(nodesSet).map(id => {
            let classes = '';
            if (id === sourceVal) classes = 'source';
            if (id === targetVal) classes = 'target';
            return { data: { id: id, label: id }, classes: classes };
        });

        const edges = arcs.map((arc, idx) => {
            const fromId = arc.from.trim();
            const toId = arc.to.trim();
            if (fromId === '' || toId === '') return null;
            return { data: { id: `e${idx}`, source: fromId, target: toId, weight: arc.weight }, classes: '' };
        }).filter(e => e !== null);

        cy.elements().remove();
        cy.add(nodes);
        cy.add(edges);

        const layout = cy.layout({ name: 'cose', animate: false });
        layout.run();

        if (currentPaths.length > 0) {
            highlightPaths(currentPaths);
        }
}

function highlightPaths(paths) {
    if (!cy) return;
    cy.edges().removeClass('optimal');
    for (const path of paths) {
        for (let i = 0; i < path.length - 1; i++) {
            const fromNode = path[i];
            const toNode = path[i+1];
            const edge = cy.edges().filter(e => e.data('source') === fromNode && e.data('target') === toNode);
            edge.addClass('optimal');
        }
    }
}

// ---------- Appel API ----------
async function solve() {
    const source = document.getElementById('source').value.trim();
    const target = document.getElementById('target').value.trim();
    if (!source || !target) {
        alert("Veuillez renseigner les sommets de départ et d'arrivée.");
        return;
    }
    if (arcs.length === 0) {
        alert("Ajoutez au moins un arc.");
        return;
    }
    const validArcs = arcs.filter(a => a.from && a.to && a.weight !== undefined && a.from.trim() !== '' && a.to.trim() !== '');
    if (validArcs.length === 0) {
        alert("Aucun arc valide.");
        return;
    }

    const payload = { source, target, arcs: validArcs };
    try {
        const response = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.error) {
            document.getElementById('result').innerText = `Erreur : ${data.error}`;
            return;
        }

        const distances = data.distances;

        let resultText = `Distances minimales depuis ${source} :\n`;
        const sortedKeys = Object.keys(distances).sort((a, b) => {
            const numA = parseInt(a.match(/\d+$/)?.[0] || a);
            const numB = parseInt(b.match(/\d+$/)?.[0] || b);
            if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
                return numA - numB;
            }
            return a.localeCompare(b);
        });
        for (const v of sortedKeys) {
            const d = distances[v];
            resultText += `${v} : ${d === null ? '∞' : d}\n`;
        }
        resultText += `\nChemin(s) optimal(aux) de ${source} à ${target} (poids ${distances[target]}) :\n`;
        data.paths.forEach(path => {
            resultText += path.join(" → ") + "\n";
        });
        document.getElementById('result').innerText = resultText;

        currentPaths = data.paths;
        highlightPaths(currentPaths);
        cy.nodes().removeClass('source target');
        if (cy.$id(source)) cy.$id(source).addClass('source');
        if (cy.$id(target)) cy.$id(target).addClass('target');

    } catch (err) {
        console.error(err);
        document.getElementById('result').innerText = "Erreur de connexion au serveur.";
    }
}

// ---------- Export Excel ----------
function exportToExcel() {
    const source = document.getElementById('source').value.trim();
    const target = document.getElementById('target').value.trim();
    const validArcs = arcs.filter(a => a.from && a.to && a.weight !== undefined && a.from.trim() !== '' && a.to.trim() !== '');

    if (validArcs.length === 0) {
        alert("Aucun arc valide à exporter. Veuillez ajouter des arcs avant d'exporter.");
        return;
    }

    const data = [];
    data.push(["Départ", source]);
    data.push(["Arrivée", target]);
    data.push([]);
    data.push(["De", "Vers", "Poids"]);
    validArcs.forEach(arc => {
        data.push([arc.from.trim(), arc.to.trim(), arc.weight]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Graphe");
    XLSX.writeFile(wb, "graphe.xlsx");
}

// ---------- Import Excel ----------
function importFromExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });

        let source = null;
        let target = null;
        const arcsData = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 2) continue;
            const firstCell = (row[0] || "").toString().trim();
            if (firstCell === "Départ") {
                source = (row[1] || "").toString().trim();
            } else if (firstCell === "Arrivée") {
                target = (row[1] || "").toString().trim();
            } else if (firstCell === "De") {
                for (let j = i+1; j < rows.length; j++) {
                    const arcRow = rows[j];
                    if (!arcRow || arcRow.length < 3) continue;
                    const from = (arcRow[0] || "").toString().trim();
                    const to = (arcRow[1] || "").toString().trim();
                    const weight = parseFloat(arcRow[2]);
                    if (from !== "" && to !== "" && !isNaN(weight)) {
                        arcsData.push({ from, to, weight });
                    }
                }
                break;
            }
        }

        if (source) document.getElementById('source').value = source;
        if (target) document.getElementById('target').value = target;
        if (arcsData.length > 0) {
            arcs = arcsData;
            updateTable();
            updateGraphVisualization();
            document.getElementById('result').innerText = 'Graphe importé. Cliquez sur "Calculer le chemin".';
            currentPaths = [];
        } else {
            alert("Aucun arc valide trouvé dans le fichier Excel.");
        }
    };
    reader.readAsArrayBuffer(file);
}

// ---------- Exemples prédéfinis ----------
function loadExample(exampleName) {
    let graphData;
    if (exampleName === 'graph1') {
        graphData = {
            source: "X1",
            target: "X16",
            arcs: [
                {"from": "X1", "to": "X2", "weight": 10},
                {"from": "X2", "to": "X3", "weight": 15},
                {"from": "X2", "to": "X4", "weight": 8},
                {"from": "X3", "to": "X6", "weight": 1},
                {"from": "X3", "to": "X11", "weight": 16},
                {"from": "X4", "to": "X5", "weight": 6},
                {"from": "X5", "to": "X9", "weight": 1},
                {"from": "X6", "to": "X7", "weight": 4},
                {"from": "X7", "to": "X8", "weight": 1},
                {"from": "X7", "to": "X11", "weight": 8},
                {"from": "X8", "to": "X10", "weight": 2},
                {"from": "X9", "to": "X8", "weight": 3},
                {"from": "X9", "to": "X10", "weight": 4},
                {"from": "X10", "to": "X12", "weight": 7},
                {"from": "X11", "to": "X13", "weight": 12},
                {"from": "X12", "to": "X15", "weight": 9},
                {"from": "X13", "to": "X14", "weight": 3},
                {"from": "X14", "to": "X16", "weight": 3},
                {"from": "X15", "to": "X14", "weight": 5},
                {"from": "X15", "to": "X16", "weight": 6}
            ]
        };
    } else if (exampleName === 'graph2') {
        graphData = {
            source: "A",
            target: "D",
            arcs: [
                {"from": "A", "to": "B", "weight": 5},
                {"from": "A", "to": "C", "weight": 2},
                {"from": "B", "to": "D", "weight": 1},
                {"from": "C", "to": "B", "weight": 1},
                {"from": "C", "to": "D", "weight": 4}
            ]
        };
    } else {
        return;
    }
    document.getElementById('source').value = graphData.source;
    document.getElementById('target').value = graphData.target;
    arcs = graphData.arcs.map(a => ({ from: a.from, to: a.to, weight: a.weight }));
    updateTable();
    updateGraphVisualization();
    document.getElementById('result').innerText = `Exemple ${exampleName === 'graph1' ? '1' : '2'} chargé. Cliquez sur "Calculer le chemin".`;
    currentPaths = [];
}

// ---------- Utilitaires ----------
function clearAll() {
    arcs = [];
    currentPaths = [];
    updateTable();
    if (cy) {
        cy.elements().remove();
    }
    document.getElementById('source').value = '';
    document.getElementById('target').value = '';
    document.getElementById('result').innerText = 'Aucun calcul effectué.';
}

function copyResult() {
    const resultText = document.getElementById('result').innerText;
    navigator.clipboard.writeText(resultText).then(() => {
        const btn = document.getElementById('copy-result');
        const original = btn.innerHTML;
        btn.innerHTML = '✓';
        setTimeout(() => btn.innerHTML = original, 1000);
    });
}

// ---------- Initialisation ----------
document.addEventListener('DOMContentLoaded', () => {
    initCytoscape();
    updateTable();
    updateGraphVisualization();

    document.getElementById('add-edge').onclick = () => {
        arcs.push({ from: '', to: '', weight: 1 });
        updateTable();
        updateGraphVisualization();
    };
    document.getElementById('solve-btn').onclick = solve;
    document.getElementById('clear-graph').onclick = clearAll;
    document.getElementById('fit-graph').onclick = () => cy && cy.fit();
    document.getElementById('reset-layout').onclick = () => {
        if (cy) {
            const layout = cy.layout({ name: 'cose', animate: true });
            layout.run();
        }
    };
    document.getElementById('copy-result').onclick = copyResult;

    document.getElementById('source').addEventListener('change', () => updateGraphVisualization());
    document.getElementById('target').addEventListener('change', () => updateGraphVisualization());

    // Excel import/export
    document.getElementById('export-excel').onclick = exportToExcel;
    document.getElementById('import-excel').onchange = (e) => {
        if (e.target.files.length > 0) importFromExcel(e.target.files[0]);
        e.target.value = '';
    };
    document.getElementById('load-graph1').onclick = () => loadExample('graph1');
    document.getElementById('load-graph2').onclick = () => loadExample('graph2');
});
