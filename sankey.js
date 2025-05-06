// Configuration
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
let width = document.getElementById('sankey-container').offsetWidth - margin.left - margin.right;
let height = document.getElementById('sankey-container').offsetHeight - margin.top - margin.bottom;

// Palette harmonieuse pour les matières (dégradé, plage centrale, ordre mélangé)
const matiereValues = data.dimensions.matiere.values;
const nMatieres = matiereValues.length;
// Générer la palette sur une plage centrale (0.15 à 0.85)
let matierePalette = Array.from({length: nMatieres}, (_, i) => d3.interpolateCool(0.15 + 0.7 * (i / (nMatieres - 1))));
// Mélanger l'ordre des couleurs
matierePalette = d3.shuffle(matierePalette);

const formatValues = data.dimensions.format.values;
const nFormats = formatValues.length;
const formatPalette = Array.from({length: nFormats}, (_, i) => d3.interpolateYlGn(0.2 + 0.6 * (i / (nFormats - 1))));

const couleurValues = data.dimensions.couleur.values;
const couleurPalette = [
    '#222',      // Noir
    '#f5f5f5',  // Blanc
    '#2980b9',  // Bleu
    '#7f8c8d',  // Gris
    '#8d5524',  // Marron
    '#e74c3c',  // Rouge
    '#27ae60',  // Vert
    '#8e44ad',  // Violet
    '#e67e22',  // Orange
    '#f1c40f',  // Jaune
    '#b2bec3',  // Inconnu
    '#fd79a8'   // Multicolore
];

// Palette de couleurs pour les dimensions
const colorScales = {
    matiere: d3.scaleOrdinal()
        .domain(matiereValues)
        .range(matierePalette),
    format: d3.scaleOrdinal()
        .domain(formatValues)
        .range(formatPalette),
    couleur: d3.scaleOrdinal()
        .domain(couleurValues)
        .range(couleurPalette)
};

// Création du SVG
const svg = d3.select('#sankey-container')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Création du tooltip
const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

// Fonction pour mettre à jour la visualisation
function updateSankey(dimension) {
    // Nettoyage du SVG
    svg.selectAll('*').remove();

    // Gestion spéciale pour les sous-catégories
    let isFormatType = false;
    let isMatiereFibres = false;
    let stackValues = null;
    let typeKeys = null;
    let palette = null;
    let colorAccessor = null;
    if (dimension === 'format_type') {
        isFormatType = true;
        // On va afficher la distribution des types de format, tous formats confondus
        // On additionne les types de tous les formats pondérés par leur pourcentage
        const typeTotals = {};
        let total = 0;
        Object.values(formats_types).forEach(formatObj => {
            const parentPct = formatObj.pourcentage;
            Object.entries(formatObj.types).forEach(([type, pct]) => {
                const val = parentPct * pct / 100;
                typeTotals[type] = (typeTotals[type] || 0) + val;
                total += val;
            });
        });
        // On normalise pour que la somme fasse 1000kg
        const factor = 1000 / total;
        Object.keys(typeTotals).forEach(type => {
            typeTotals[type] = Math.round(typeTotals[type] * factor);
        });
        stackValues = typeTotals;
        typeKeys = Object.keys(typeTotals);
        // Palette dynamique pour les types
        const nTypes = typeKeys.length;
        palette = Array.from({length: nTypes}, (_, i) => d3.interpolatePlasma(0.15 + 0.7 * (i / (nTypes - 1))));
        colorAccessor = (key, idx) => palette[idx % palette.length];
    } else if (dimension === 'matiere_fibres') {
        isMatiereFibres = true;
        // On va afficher la distribution des fibres, tous types de matières confondus, pondérée par leur pourcentage
        const fibreTotals = {};
        let total = 0;
        Object.values(matieres_fibres).forEach(matiereObj => {
            const parentPct = matiereObj.pourcentage;
            Object.entries(matiereObj.fibres).forEach(([fibre, pct]) => {
                const val = parentPct * pct / 100;
                fibreTotals[fibre] = (fibreTotals[fibre] || 0) + val;
                total += val;
            });
        });
        // On normalise pour que la somme fasse 1000kg
        const factor = 1000 / total;
        Object.keys(fibreTotals).forEach(fibre => {
            fibreTotals[fibre] = Math.round(fibreTotals[fibre] * factor);
        });
        stackValues = fibreTotals;
        typeKeys = Object.keys(fibreTotals);
        // Palette dynamique pour les fibres
        const nFibres = typeKeys.length;
        palette = Array.from({length: nFibres}, (_, i) => d3.interpolateViridis(0.15 + 0.7 * (i / (nFibres - 1))));
        colorAccessor = (key, idx) => palette[idx % palette.length];
    } else if (data.dimensions[dimension]) {
        // Palette classique
        colorAccessor = (key) => colorScales[dimension](key);
    } else {
        // fallback : couleur grise
        colorAccessor = () => '#bbb';
    }

    // Création du layout Sankey
    const stackbarWidth = 80;
    const extraBlockWidth = 30;
    const sankey = d3.sankey()
        .nodeWidth(stackbarWidth + extraBlockWidth)
        .nodePadding(10)
        .extent([[0, 0], [width, height]]);

    // Transformation des données pour la dimension sélectionnée
    const sankeyData = {
        nodes: data.nodes,
        links: data.links.map(link => {
            const sourceNode = data.nodes.find(n => n.id === link.source);
            const targetNode = data.nodes.find(n => n.id === link.target);
            return {
                source: sourceNode,
                target: targetNode,
                value: link.value,
                dimensionData: (isFormatType || isMatiereFibres) ? stackValues : (link.dimensions[dimension] || {})
            };
        })
    };

    // Application du layout
    const { nodes, links } = sankey(sankeyData);

    // Création des liens
    svg.append('g')
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('class', 'link')
        .attr('d', function(d) {
            // Path entrant : entrée au début du nœud (target.x0)
            // Path sortant : sortie après le bloc (source.x1 + extraBlockWidth)
            const linkGen = d3.sankeyLinkHorizontal();
            const dCopy = { ...d, source: { ...d.source }, target: { ...d.target } };
            dCopy.source.x1 = d.source.x1;
            dCopy.target.x0 = d.target.x0;
            return linkGen(dCopy);
        })
        .attr('stroke-width', d => Math.max(1, d.width))
        .style('stroke', '#000')
        .on('mouseover', function(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            let tooltipContent = `
                <strong>${d.source.name} → ${d.target.name}</strong><br/>
                Quantité: ${d.value} kg<br/>
                Pourcentage: ${(d.value / 1000 * 100).toFixed(1)}%<br/>
            `;
            if (data.dimensions[dimension]) {
                tooltipContent += `<br/><strong>Détails ${data.dimensions[dimension].name}:</strong><br/>`;
                if (d.dimensionData) {
                    Object.entries(d.dimensionData).forEach(([key, value]) => {
                        const percentage = (value / d.value * 100).toFixed(1);
                        tooltipContent += `${key}: ${value} kg (${percentage}%)<br/>`;
                    });
                }
            }
            tooltip.html(tooltipContent)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });

    // Création des nœuds
    const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    // Ajout des rectangles pour les nœuds avec stackbars
    node.each(function(d) {
        const nodeGroup = d3.select(this);
        const nodeHeight = d.y1 - d.y0;
        const nodeWidth = d.x1 - d.x0;

        // Stackbar (à gauche du nœud)
        nodeGroup.append('rect')
            .attr('x', 0)
            .attr('height', nodeHeight)
            .attr('width', stackbarWidth)
            .style('fill', '#e0e0e0')
            .style('opacity', 0.8);

        // Stackbars pour la dimension sélectionnée
        let yOffset = 0;
        let dimensionValues = {};
        if (isFormatType || isMatiereFibres) {
            dimensionValues = stackValues;
        } else {
            links.forEach(link => {
                if (link.source === d || link.target === d) {
                    Object.entries(link.dimensionData).forEach(([key, value]) => {
                        dimensionValues[key] = (dimensionValues[key] || 0) + value;
                    });
                }
            });
        }
        const sum = Object.values(dimensionValues).reduce((a, b) => a + b, 0);
        // Création des stackbars triées
        const sortedEntries = Object.entries(dimensionValues).sort((a, b) => b[1] - a[1]);
        sortedEntries.forEach(([key, value], idx) => {
            const height = sum > 0 ? (value / sum) * nodeHeight : 0;
            nodeGroup.append('rect')
                .attr('x', 0)
                .attr('y', yOffset)
                .attr('height', height)
                .attr('width', stackbarWidth)
                .style('fill', colorAccessor(key, idx))
                .style('opacity', 0.8)
                .on('mouseover', function(event) {
                    const percent = sum > 0 ? (value / sum * 100).toFixed(1) : 0;
                    let tooltipContent = `<strong>${key}</strong><br/>Quantité : ${value} kg<br/>Pourcentage : ${percent}%`;
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', .9);
                    tooltip.html(tooltipContent)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });
            yOffset += height;
        });

        // Bloc à droite de la stackbar
        nodeGroup.append('rect')
            .attr('x', stackbarWidth)
            .attr('y', 0)
            .attr('width', extraBlockWidth)
            .attr('height', nodeHeight)
            .style('fill', '#cccccc')
            .style('opacity', 0.7);
    });

    // Ajout des labels
    node.append('text')
        .attr('x', d => (d.x1 - d.x0) / 2)
        .attr('y', d => (d.y1 - d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(d => d.name)
        .style('font-size', '12px')
        .style('fill', '#333')
        .style('pointer-events', 'none');
}

// Gestion du changement de dimension
document.getElementById('dimension-selector').addEventListener('change', function(e) {
    updateSankey(e.target.value);
});

// Initialisation avec la première dimension
updateSankey('matiere');

// Gestion du redimensionnement
window.addEventListener('resize', function() {
    width = document.getElementById('sankey-container').offsetWidth - margin.left - margin.right;
    height = document.getElementById('sankey-container').offsetHeight - margin.top - margin.bottom;
    
    svg.attr('width', width + margin.left + margin.right)
       .attr('height', height + margin.top + margin.bottom);
    
    updateSankey(document.getElementById('dimension-selector').value);
}); 