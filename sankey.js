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

const qualiteValues = data.dimensions.qualite.values;
const nQualite = qualiteValues.length;
const qualitePalette = Array.from({length: nQualite}, (_, i) => d3.interpolateOranges(0.2 + 0.6 * (i / (nQualite - 1))));

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
        .range(couleurPalette),
    qualite: d3.scaleOrdinal()
        .domain(qualiteValues)
        .range(qualitePalette)
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

// Components pour stackbars et tooltips selon la dimension
const stackbarComponents = {
  format: {
    getStackValues: lot => {
      if (!lot.format) return {};
      const values = {};
      Object.entries(lot.format).forEach(([key, obj]) => {
        if (typeof obj.pourcentage === 'number') values[key] = obj.pourcentage;
      });
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round(total * value / 100)} kg`;
    }
  },
  format_type: {
    getStackValues: lot => {
      // Concatène tous les types de tous les formats présents dans le lot
      if (!lot.format) return {};
      const values = {};
      Object.values(lot.format).forEach(formatObj => {
        if (formatObj.types) {
          Object.entries(formatObj.types).forEach(([type, typeObj]) => {
            if (typeof typeObj.pourcentage === 'number') {
              values[type] = (values[type] || 0) + typeObj.pourcentage * (formatObj.pourcentage / 100);
            }
          });
        }
      });
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round(total * value / 100)} kg`;
    }
  },
  matiere: {
    getStackValues: lot => {
      if (!lot.format) return {};
      const values = {};
      Object.values(lot.format).forEach(formatObj => {
        if (formatObj.types) {
          Object.values(formatObj.types).forEach(typeObj => {
            if (typeObj.matieres) {
              Object.entries(typeObj.matieres).forEach(([matiere, matiereObj]) => {
                if (typeof matiereObj.pourcentage === 'number') {
                  // Pondération par le pourcentage du type et du format
                  const pct = matiereObj.pourcentage * (typeObj.pourcentage / 100) * (formatObj.pourcentage / 100);
                  values[matiere] = (values[matiere] || 0) + pct;
                }
              });
            }
          });
        }
      });
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round(total * value / 100)} kg`;
    }
  },
  fibres: {
    getStackValues: lot => {
      if (!lot.format) return {};
      const values = {};
      Object.entries(lot.format).forEach(([formatName, formatObj]) => {
        if (formatObj.types) {
          Object.entries(formatObj.types).forEach(([typeName, typeObj]) => {
            if (typeObj.matieres) {
              Object.entries(typeObj.matieres).forEach(([matiereName, matiereObj]) => {
                if (matiereObj && matiereObj.fibres && typeof matiereObj.fibres === 'object') {
                  Object.entries(matiereObj.fibres).forEach(([fibre, pctFibre]) => {
                    // Pondération par le pourcentage de la matière, du type et du format
                    const pct = (pctFibre / 100) * (matiereObj.pourcentage / 100) * (typeObj.pourcentage / 100) * (formatObj.pourcentage / 100) * 100;
                    values[fibre] = (values[fibre] || 0) + pct;
                  });
                }
              });
            }
          });
        }
      });
      // Affichage debug
      console.log('Résultat fibres pour lot', lot, values);
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round(total * value / 100)} kg`;
    }
  },
  couleur: {
    getStackValues: lot => {
      if (!lot.format) return {};
      const values = {};
      Object.entries(lot.format).forEach(([formatName, formatObj]) => {
        if (formatObj.types) {
          Object.entries(formatObj.types).forEach(([typeName, typeObj]) => {
            if (typeObj.couleurs) {
              Object.entries(typeObj.couleurs).forEach(([couleur, couleurObj]) => {
                if (typeof couleurObj.pourcentage === 'number') {
                  // Correction ici :
                  const pct = (couleurObj.pourcentage / 100) * (typeObj.pourcentage / 100) * (formatObj.pourcentage / 100) * 100;
                  values[couleur] = (values[couleur] || 0) + pct;
                }
              });
            }
          });
        }
      });
      // Affichage debug
      // console.log('Résultat couleurs pour lot', lot, values);
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round(total * value / 100)} kg`;
    }
  },
  // Ajoute ici d'autres dimensions si besoin
};

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

    // Utilisation des données du scénario
    const sankeyData = {
        nodes: sankeyScenario.nodes,
        links: sankeyScenario.links.map(link => {
            const sourceNode = sankeyScenario.nodes.find(n => n.id === link.source);
            const targetNode = sankeyScenario.nodes.find(n => n.id === link.target);
            let dimensionData = {};
            
            if (dimension === 'format') {
                // Cas spécial pour les formats qui ont une structure à deux niveaux
                const formatData = sourceNode.lot.format;
                Object.entries(formatData).forEach(([key, value]) => {
                    dimensionData[key] = value.pourcentage;
                });
            } else {
                dimensionData = sourceNode.lot[dimension] || {};
            }

            return {
                source: sourceNode,
                target: targetNode,
                value: link.value,
                dimensionData: dimensionData
            };
        })
    };

    if (dimension === 'format_type') {
        isFormatType = true;
        // On va afficher la distribution des types de format, tous formats confondus
        const typeTotals = {};
        let total = 0;
        sankeyData.nodes.forEach(node => {
            const formatData = node.lot.format;
            Object.values(formatData).forEach(formatObj => {
                const parentPct = formatObj.pourcentage;
                Object.entries(formatObj.types).forEach(([type, pct]) => {
                    const val = parentPct * pct / 100;
                    typeTotals[type] = (typeTotals[type] || 0) + val;
                    total += val;
                });
            });
        });
        // On normalise pour que la somme fasse la masse réelle du lot courant
        const factor = sankeyData.nodes[0].lot.total / total;
        Object.keys(typeTotals).forEach(type => {
            typeTotals[type] = Math.round(typeTotals[type] * factor);
        });
        stackValues = typeTotals;
        typeKeys = Object.keys(typeTotals);
        // Palette dynamique pour les types
        const nTypes = typeKeys.length;
        palette = Array.from({length: nTypes}, (_, i) => d3.interpolatePlasma(0.15 + 0.7 * (i / (nTypes - 1))));
        colorAccessor = (key, idx) => palette[idx % palette.length];
    } else if (dimension === 'format') {
        // Cas spécial pour les formats qui ont une structure à deux niveaux
        colorAccessor = (key) => colorScales[dimension](key);
    } else if (dimension === 'fibres') {
        // Palette dynamique pour les fibres
        const component = stackbarComponents[dimension];
        const allFibres = new Set();
        sankeyData.nodes.forEach(d => {
          const vals = component.getStackValues(d.lot);
          Object.keys(vals).forEach(f => allFibres.add(f));
        });
        const fibreKeys = Array.from(allFibres);
        const nFibres = fibreKeys.length;
        const palette = Array.from({length: nFibres}, (_, i) => d3.interpolateViridis(0.15 + 0.7 * (i / (nFibres - 1))));
        colorAccessor = (key, idx) => palette[fibreKeys.indexOf(key) % palette.length];
    } else if (dimension === 'couleur') {
        // Palette dynamique pour les couleurs
        const component = stackbarComponents[dimension];
        const allCouleurs = new Set();
        sankeyData.nodes.forEach(d => {
          const vals = component.getStackValues(d.lot);
          Object.keys(vals).forEach(c => allCouleurs.add(c));
        });
        const couleurKeys = Array.from(allCouleurs);
        const nCouleurs = couleurKeys.length;
        // Utilise la palette définie ou une palette dynamique
        colorAccessor = (key, idx) => {
          // Harmonisation de la casse et mapping
          const keyNorm = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
          // Gestion des variantes connues
          const mapping = {
            "multicolore": "Multicolore",
            "autre": "Inconnu",
            "autres": "Inconnu",
            "gris": "Gris",
            "bleu": "Bleu",
            "noir": "Noir",
            "blanc": "Blanc",
            "marron": "Marron",
            "rouge": "Rouge",
            "vert": "Vert",
            "violet": "Violet",
            "orange": "Orange",
            "jaune": "Jaune"
          };
          const mappedKey = mapping[key.toLowerCase()] || keyNorm;
          return colorScales.couleur(mappedKey) || d3.interpolateRainbow(idx / nCouleurs);
        };
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
    const horizontalPadding = 20;
    const sankey = d3.sankey()
        .nodeWidth(stackbarWidth + extraBlockWidth)
        .nodePadding(10)
        .extent([[horizontalPadding, 0], [width - horizontalPadding, height]]);

    // Application du layout
    const { nodes, links } = sankey(sankeyData);

    // Calcul du nombre de colonnes (niveaux)
    const maxDepth = Math.max(...sankeyScenario.nodes.map(n => n.depth || 0));
    const minWidth = 300; // largeur minimale pour ne pas écraser
    const dynamicWidth = Math.max(minWidth, (stackbarWidth + extraBlockWidth) * (maxDepth + 1) + 40);
    svg.attr('width', Math.min(width + margin.left + margin.right, dynamicWidth));

    // Création des liens
    svg.append('g')
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('class', 'link')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke-width', d => Math.max(1, d.width))
        .style('stroke', '#000')
        .style('stroke-opacity', 0.5)
        .on('mouseover', function(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            let tooltipContent = `
                <strong>${d.source.name} → ${d.target.name}</strong><br/>
                Quantité: ${Math.round(d.value)} kg<br/>
                Pourcentage: ${(d.source.lot && d.source.lot.total ? (d.value / d.source.lot.total * 100).toFixed(1) : '0')}%<br/>
            `;
            if (data.dimensions[dimension]) {
                tooltipContent += `<br/><strong>Détails ${data.dimensions[dimension].name}:</strong><br/>`;
                if (d.dimensionData) {
                    Object.entries(d.dimensionData).forEach(([key, value]) => {
                        let val = value;
                        if (value && typeof value === 'object' && typeof value.pourcentage === 'number') {
                            val = Math.round(d.value * value.pourcentage / 100 * 10) / 10;
                        }
                        const percentage = d.value > 0 ? (val / d.value * 100).toFixed(1) : '0';
                        tooltipContent += `${key}: ${val} kg (${percentage}%)<br/>`;
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
        const component = stackbarComponents[dimension];
        const dimensionValues = component ? component.getStackValues(d.lot) : {};
        const sum = Object.values(dimensionValues).reduce((a, b) => a + b, 0);
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
                    let tooltipContent = component ? component.getTooltipContent(d.lot, key, value, d.lot.total) : '';
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
            .style('opacity', 0.7)
            .on('mouseover', function(event) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`
                    <strong>${d.name}</strong><br/>
                    Poids du lot : ${Math.round(d.lot.total)} kg
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Ajout des icônes SVG pour chaque lien sortant (sauf "Reste")
        const outgoingLinks = links.filter(l => l.source.id === d.id && !l.target.name.startsWith('Reste'));
        if (outgoingLinks.length > 0) {
            outgoingLinks.forEach((link, idx) => {
                const linkY = link.y0 - d.y0;
                // Ajout du fond carré arrondi avec tooltip
                const transfoName = link.target.name;
                nodeGroup.append('rect')
                    .attr('x', stackbarWidth + (extraBlockWidth - 24) / 2)
                    .attr('y', linkY - 12)
                    .attr('width', 24)
                    .attr('height', 24)
                    .attr('rx', 6)
                    .attr('ry', 6)
                    .style('fill', '#999')
                    .style('opacity', 1)
                    .on('mouseover', function(event) {
                        tooltip.transition()
                            .duration(200)
                            .style('opacity', .9);
                        tooltip.html(`<strong>${transfoName}</strong>`)
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 28) + 'px');
                    })
                    .on('mouseout', function() {
                        tooltip.transition()
                            .duration(500)
                            .style('opacity', 0);
                    });
                // Ajout de l'icône centrée dans le carré
                nodeGroup.append('image')
                    .attr('x', stackbarWidth + (extraBlockWidth - 20) / 2)
                    .attr('y', linkY - 10)
                    .attr('width', 20)
                    .attr('height', 20)
                    .attr('href', 'assets/svg/arrows-split.svg')
                    .style('pointer-events', 'none');
            });
        }
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
document.getElementById('dimension-selector').value = 'format';
updateSankey('format');

// Gestion du redimensionnement
window.addEventListener('resize', function() {
    width = document.getElementById('sankey-container').offsetWidth - margin.left - margin.right;
    height = document.getElementById('sankey-container').offsetHeight - margin.top - margin.bottom;
    
    svg.attr('width', width + margin.left + margin.right)
       .attr('height', height + margin.top + margin.bottom);
    
    updateSankey(document.getElementById('dimension-selector').value);
});

