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

// Palette stable pour les types (tous types de tous formats)
const allTypeValues = [];
formatValues.forEach(format => {
  const types = Object.keys(lotType.format[format]?.types || {});
  types.forEach(type => {
    if (!allTypeValues.includes(type)) allTypeValues.push(type);
  });
});
const nTypes = allTypeValues.length;
const typePalette = Array.from({length: nTypes}, (_, i) => d3.interpolatePlasma(0.15 + 0.7 * (i / (nTypes - 1))));

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
    type: d3.scaleOrdinal()
        .domain(allTypeValues)
        .range(typePalette),
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

// Ajout du pattern SVG pour le fond dashed (à faire UNE SEULE FOIS)
d3.select('#sankey-container svg').select('defs').remove(); // supprime un éventuel doublon
const defs = d3.select('#sankey-container svg').append('defs');
const pattern = defs.append('pattern')
    .attr('id', 'dashed-bg')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 8)
    .attr('height', 8);
pattern.append('rect')
    .attr('width', 8)
    .attr('height', 8)
    .attr('fill', '#f5f5f5');
pattern.append('path')
    .attr('d', 'M0,0 l8,8')
    .attr('stroke', '#bbb')
    .attr('stroke-width', 2);

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
      if (!lot.format) return {};
      const values = {};
      let totalWithType = 0;
      Object.values(lot.format).forEach(formatObj => {
        if (formatObj.types) {
          Object.entries(formatObj.types).forEach(([type, typeObj]) => {
            if (typeof typeObj.pourcentage === 'number') {
              // On ne prend en compte que les types qui ont une part > 0
              const typePct = typeObj.pourcentage * (formatObj.pourcentage / 100);
              if (typePct > 0) {
                values[type] = (values[type] || 0) + typePct;
                totalWithType += typePct;
              }
            }
          });
        }
      });
      // Normalisation pour que la somme fasse 100% de la part du lot qui a des types
      if (totalWithType > 0) {
        Object.keys(values).forEach(k => {
          values[k] = values[k] / totalWithType * 100;
        });
      }
      // Optionnel : indiquer la part sans type (rare, mais pour homogénéité)
      values._missing = 100 - (totalWithType > 0 ? 100 : 0);
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
                // On ignore les matières sans fibres
                if (matiereObj && matiereObj.fibres && Object.keys(matiereObj.fibres).length > 0) {
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
      // Normalisation pour que la somme fasse 100% de la part du lot qui a des fibres
      const sum = Object.values(values).reduce((a, b) => a + b, 0);
      if (sum > 0) {
        Object.keys(values).forEach(k => {
          values[k] = values[k] / sum * 100;
        });
      }
      // Optionnel : indiquer la part sans fibre
      values._missing = 100 - (sum > 0 ? 100 : 0);
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
      let totalWithCouleur = 0;
      Object.entries(lot.format).forEach(([formatName, formatObj]) => {
        if (formatObj.types) {
          Object.entries(formatObj.types).forEach(([typeName, typeObj]) => {
            if (typeObj.couleurs) {
              // Masse de ce type dans le lot
              const typePct = (typeObj.pourcentage / 100) * (formatObj.pourcentage / 100);
              totalWithCouleur += typePct;
              Object.entries(typeObj.couleurs).forEach(([couleur, couleurObj]) => {
                if (typeof couleurObj.pourcentage === 'number') {
                  // Pondération par la masse du type
                  const pct = (couleurObj.pourcentage / 100) * typePct * 100;
                  values[couleur] = (values[couleur] || 0) + pct;
                }
              });
            }
          });
        }
      });
      // Normalisation pour que la somme fasse 100% de la part du lot qui a des couleurs
      const sum = Object.values(values).reduce((a, b) => a + b, 0);
      if (sum > 0) {
        Object.keys(values).forEach(k => {
          values[k] = values[k] / sum * 100;
        });
      }
      values._missing = 100 - (sum > 0 ? 100 : 0); // Pour info, part sans couleur
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round(total * value / 100)} kg`;
    }
  },
  qualite: {
    getStackValues: lot => {
      if (!lot.qualite) return {};
      const values = {};
      Object.entries(lot.qualite).forEach(([qual, pct]) => {
        // pct peut être un nombre ou un objet (selon la structure)
        values[qual] = typeof pct === 'number' ? pct : (pct.pourcentage || 0);
      });
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
        colorAccessor = (key) => colorScales.type(key);
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
    } else if (dimension === 'qualite') {
        // Palette dynamique pour la qualité
        const component = stackbarComponents[dimension];
        const allQualites = new Set();
        sankeyData.nodes.forEach(d => {
          const vals = component.getStackValues(d.lot);
          Object.keys(vals).forEach(q => allQualites.add(q));
        });
        const qualiteKeys = Array.from(allQualites);
        const nQualites = qualiteKeys.length;
        colorAccessor = (key, idx) => colorScales.qualite(key) || d3.interpolateOranges(idx / nQualites);
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
        .style('stroke-opacity', 0.18)
        .on('mouseover', function(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);

            // Récupérer la position du SVG dans la page
            const svgRect = svg.node().ownerSVGElement.getBoundingClientRect();

            // Largeur d'un noeud (stackbar + extraBlock)
            const nodeWidth = 80 + 30; // stackbarWidth + extraBlockWidth

            // Coordonnées du point de départ du path (source), décalées à droite du noeud
            const x = d.source.x1 + 20; // x1 = bord droit du noeud source
            const y = d.y0 + 20 - (d.width ? d.width / 2 : 0); // remonter de la moitié de la largeur du path

            let tooltipContent = `
                <strong>${d.source.name} → ${d.target.name}</strong><br/>
                Quantité: ${Math.round(d.value)} kg<br/>
                Pourcentage: ${(d.source.lot && d.source.lot.total ? (d.value / d.source.lot.total * 100).toFixed(1) : '0')}%<br/>
            `;
            if (dimension === 'format' && d.dimensionData) {
                tooltipContent += `<br/><strong>Détails Format :</strong><br/>`;
                // Utiliser d.target.lot pour le détail
                if (d.target.lot && d.target.lot.format) {
                  Object.entries(d.target.lot.format).forEach(([key, obj]) => {
                    if (typeof obj.pourcentage === 'number') {
                      tooltipContent += `${key}: ${obj.pourcentage.toFixed(1)}%<br/>`;
                    }
                  });
                }
            } else if (dimension === 'format_type') {
                // Recalcule la distribution des types à la volée sur d.target.lot
                const values = {};
                let totalWithType = 0;
                if (d.target.lot && d.target.lot.format) {
                  Object.values(d.target.lot.format).forEach(formatObj => {
                    if (formatObj.types) {
                      Object.entries(formatObj.types).forEach(([type, typeObj]) => {
                        if (typeof typeObj.pourcentage === 'number') {
                          const typePct = typeObj.pourcentage * (formatObj.pourcentage / 100);
                          if (typePct > 0) {
                            values[type] = (values[type] || 0) + typePct;
                            totalWithType += typePct;
                          }
                        }
                      });
                    }
                  });
                }
                if (totalWithType > 0) {
                  Object.keys(values).forEach(k => {
                    values[k] = values[k] / totalWithType * 100;
                  });
                }
                tooltipContent += `<br/><strong>Détails Type :</strong><br/>`;
                Object.entries(values).forEach(([key, value]) => {
                  tooltipContent += `${key}: ${value.toFixed(1)}%<br/>`;
                });
            } else if (dimension === 'matiere') {
                // Recalcule la distribution des matières à la volée sur d.target.lot
                const values = {};
                if (d.target.lot && d.target.lot.format) {
                  Object.values(d.target.lot.format).forEach(formatObj => {
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
                }
                // Normalisation pour que la somme fasse 100
                const sum = Object.values(values).reduce((a, b) => a + b, 0);
                if (sum > 0) {
                  Object.keys(values).forEach(k => {
                    values[k] = values[k] / sum * 100;
                  });
                }
                tooltipContent += `<br/><strong>Détails Matière :</strong><br/>`;
                Object.entries(values).forEach(([key, value]) => {
                  tooltipContent += `${key}: ${value.toFixed(1)}%<br/>`;
                });
            } else if (dimension === 'fibres') {
                // Recalcule la distribution des fibres à la volée sur d.target.lot
                const values = {};
                if (d.target.lot && d.target.lot.format) {
                  Object.entries(d.target.lot.format).forEach(([formatName, formatObj]) => {
                    if (formatObj.types) {
                      Object.entries(formatObj.types).forEach(([typeName, typeObj]) => {
                        if (typeObj.matieres) {
                          Object.entries(typeObj.matieres).forEach(([matiereName, matiereObj]) => {
                            if (matiereObj && matiereObj.fibres && Object.keys(matiereObj.fibres).length > 0) {
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
                }
                // Normalisation pour que la somme fasse 100% de la part du lot qui a des fibres
                const sum = Object.values(values).reduce((a, b) => a + b, 0);
                if (sum > 0) {
                  Object.keys(values).forEach(k => {
                    values[k] = values[k] / sum * 100;
                  });
                }
                tooltipContent += `<br/><strong>Détails Fibres :</strong><br/>`;
                Object.entries(values).forEach(([key, value]) => {
                  tooltipContent += `${key}: ${value.toFixed(1)}%<br/>`;
                });
            } else if (dimension === 'couleur') {
                // Recalcule la distribution des couleurs à la volée sur d.target.lot
                const values = {};
                let totalWithCouleur = 0;
                if (d.target.lot && d.target.lot.format) {
                  Object.entries(d.target.lot.format).forEach(([formatName, formatObj]) => {
                    if (formatObj.types) {
                      Object.entries(formatObj.types).forEach(([typeName, typeObj]) => {
                        if (typeObj.couleurs) {
                          // Masse de ce type dans le lot
                          const typePct = (typeObj.pourcentage / 100) * (formatObj.pourcentage / 100);
                          totalWithCouleur += typePct;
                          Object.entries(typeObj.couleurs).forEach(([couleur, couleurObj]) => {
                            if (typeof couleurObj.pourcentage === 'number') {
                              // Pondération par la masse du type
                              const pct = (couleurObj.pourcentage / 100) * typePct * 100;
                              values[couleur] = (values[couleur] || 0) + pct;
                            }
                          });
                        }
                      });
                    }
                  });
                }
                // Normalisation pour que la somme fasse 100% de la part du lot qui a des couleurs
                const sum = Object.values(values).reduce((a, b) => a + b, 0);
                if (sum > 0) {
                  Object.keys(values).forEach(k => {
                    values[k] = values[k] / sum * 100;
                  });
                }
                tooltipContent += `<br/><strong>Détails Couleur :</strong><br/>`;
                Object.entries(values).forEach(([key, value]) => {
                  tooltipContent += `${key}: ${value.toFixed(1)}%<br/>`;
                });
            } else if (dimension === 'qualite') {
                // Recalcule la distribution des qualités à la volée sur d.target.lot
                const values = {};
                let totalQualite = 0;
                if (d.target.lot && d.target.lot.qualite) {
                  Object.entries(d.target.lot.qualite).forEach(([qual, pct]) => {
                    // pct peut être un nombre ou un objet (selon la structure)
                    const val = typeof pct === 'number' ? pct : (pct.pourcentage || 0);
                    values[qual] = val;
                    totalQualite += val;
                  });
                }
                // Normalisation pour que la somme fasse 100
                if (totalQualite > 0) {
                  Object.keys(values).forEach(k => {
                    values[k] = values[k] / totalQualite * 100;
                  });
                }
                tooltipContent += `<br/><strong>Détails Qualité :</strong><br/>`;
                Object.entries(values).forEach(([key, value]) => {
                  tooltipContent += `${key}: ${value.toFixed(1)}%<br/>`;
                });
            }
            tooltip.html(tooltipContent)
                .style('left', (svgRect.left + x) + 'px')
                .style('top', (svgRect.top + y) + 'px');
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
            .style('opacity', 0.6);

        // Stackbars pour la dimension sélectionnée
        let yOffset = 0;
        const component = stackbarComponents[dimension];
        const dimensionValues = component ? component.getStackValues(d.lot) : {};
        const sum = Object.values(dimensionValues).reduce((a, b) => a + b, 0);
        const sortedEntries = Object.entries(dimensionValues)
          .filter(([key]) => !key.startsWith('_'))
          .sort((a, b) => b[1] - a[1]);
        // Si la stackbar est vide, afficher un fond dashed
        if (sortedEntries.length === 0) {
            nodeGroup.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', nodeHeight)
                .attr('width', stackbarWidth)
                .attr('rx', 4)
                .attr('ry', 4)
                .style('fill', 'url(#dashed-bg)')
                .style('stroke', '#bbb')
                .style('stroke-width', '1px')
                .style('opacity', 1);
        }
        sortedEntries.forEach(([key, value], idx) => {
            const height = sum > 0 ? (value / sum) * nodeHeight : 0;
            const fillColor = d3.color(colorAccessor(key, idx));
            const fillColorStr = `rgba(${fillColor.r},${fillColor.g},${fillColor.b},0.6)`;
            const strokeColorStr = `rgba(${fillColor.r},${fillColor.g},${fillColor.b},1)`;
            nodeGroup.append('rect')
                .attr('x', 0)
                .attr('y', yOffset)
                .attr('height', height)
                .attr('width', stackbarWidth)
                .attr('rx', 4)
                .attr('ry', 4)
                .style('fill', fillColorStr)
                .style('stroke', strokeColorStr)
                .style('stroke-width', '1px')
                .style('opacity', 1)
                .on('mouseover', function(event) {
                    let tooltipContent = component ? component.getTooltipContent(d.lot, key, value, d.lot.total) : '';
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', .9);
                    // Positionner le tooltip au coin haut gauche de la stackbar
                    const svgRect = svg.node().ownerSVGElement.getBoundingClientRect();
                    // Position du rectangle dans le SVG
                    const rect = this.getBoundingClientRect();
                    // Décalage du SVG dans la page
                    const offsetX = rect.left - svgRect.left;
                    const offsetY = rect.top - svgRect.top;
                    tooltip.html(tooltipContent)
                        .style('left', (svgRect.left + offsetX) + 'px')
                        .style('top', (svgRect.top + offsetY) + 'px');
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
            .attr('rx', 4)
            .attr('ry', 4)
            .style('fill', 'rgba(204,204,204,0.6)') // gris clair, opacité 60%
            .style('stroke', 'rgba(204,204,204,1)') // bordure 100%
            .style('stroke-width', '1px')
            .style('opacity', 1)
            .on('mouseover', function(event) {
                const component = stackbarComponents[dimension];
                const dimensionValues = component ? component.getStackValues(d.lot) : {};
                const sumPct = Object.values(dimensionValues).reduce((a, b) => a + b, 0);
                const missingPct = dimensionValues._missing || 0;
                let missingInfo = '';
                if (missingPct > 0.1) {
                  missingInfo = `<br/><span style='font-size:12px;color:#c00;'>Donnée couleur manquante pour ${missingPct.toFixed(1)}%</span>`;
                }
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`
                    <strong>${d.name}</strong><br/>
                    Poids du lot : ${Math.round(d.lot.total)} kg<br/>
                    <span style='font-size:12px;color:#666;'>Somme des % stackbar : ${sumPct.toFixed(1)}%</span>
                    ${missingInfo}
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
            // Ajout de l'icône + sur le dernier path (celui qui correspond au 'reste')
            const resteLinks = links.filter(l => l.source.id === d.id && l.target.name.startsWith('Reste'));
            if (resteLinks.length > 0) {
                // On prend le dernier (s'il y en a plusieurs)
                const lastResteLink = resteLinks[resteLinks.length - 1];
                const linkY = lastResteLink.y0 - d.y0;
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
                        tooltip.html(`<strong>Ajouter une transformation</strong>`)
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 28) + 'px');
                    })
                    .on('mouseout', function() {
                        tooltip.transition()
                            .duration(500)
                            .style('opacity', 0);
                    });
                nodeGroup.append('image')
                    .attr('x', stackbarWidth + (extraBlockWidth - 20) / 2)
                    .attr('y', linkY - 10)
                    .attr('width', 20)
                    .attr('height', 20)
                    .attr('href', 'assets/svg/plus.svg')
                    .style('pointer-events', 'none');
            }
        }
        // Ajout de l'icône + sur les nœuds feuilles (aucun lien sortant sauf 'Reste')
        const outgoingNonReste = links.filter(l => l.source.id === d.id && !l.target.name.startsWith('Reste'));
        if (outgoingNonReste.length === 0) {
            // Position : en bas du bloc extraBlockWidth, centré
            const yPlus = nodeHeight / 2 - 12; // centré verticalement
            nodeGroup.append('rect')
                .attr('x', stackbarWidth + (extraBlockWidth - 24) / 2)
                .attr('y', yPlus)
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
                    tooltip.html(`<strong>Ajouter une transformation</strong>`)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });
            nodeGroup.append('image')
                .attr('x', stackbarWidth + (extraBlockWidth - 20) / 2)
                .attr('y', yPlus + 2)
                .attr('width', 20)
                .attr('height', 20)
                .attr('href', 'assets/svg/plus.svg')
                .style('pointer-events', 'none');
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

