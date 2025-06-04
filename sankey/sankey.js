// Configuration
const margin = { top: 20, right: 40, bottom: 20, left: 0 };
let width = window.innerWidth - margin.left - margin.right;
let height = document.getElementById('sankey-container').offsetHeight - margin.top - margin.bottom;

// Palette pour les couleurs (statique)
const couleurMap = {
    'noir': '#222',
    'blanc': '#f5f5f5',
    'bleu': '#2980b9',
    'gris': '#7f8c8d',
    'marron': '#8d5524',
    'rouge': '#e74c3c',
    'vert': '#27ae60',
    'violet': '#8e44ad',
    'orange': '#e67e22',
    'jaune': '#f1c40f',
    'inconnu': '#b2bec3',
    'multicolore': '#fd79a8'
};

// Palette de couleurs pour les dimensions
let colorScales = {};

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
      if (!lot.formats) return {};
      const values = {};
      Object.entries(lot.formats).forEach(([key, obj]) => {
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
      if (!lot.formats) return {};
      const values = {};
      let totalWithType = 0;
      Object.values(lot.formats).forEach(formatObj => {
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
      if (!lot.formats) return {};
      const values = {};
      Object.values(lot.formats).forEach(formatObj => {
        if (formatObj.types) {
          Object.values(formatObj.types).forEach(typeObj => {
            if (typeObj.matieres) {
              Object.entries(typeObj.matieres).forEach(([matiere, matiereObj]) => {
                // On accepte aussi les objets { pourcentage: ... } ou nombre direct
                let pctMatiere = typeof matiereObj === 'object' && matiereObj !== null
                  ? (matiereObj.pourcentage !== undefined ? matiereObj.pourcentage : 0)
                  : matiereObj;
                let pctType = typeof typeObj.pourcentage === 'number' ? typeObj.pourcentage : 100;
                let pctFormat = typeof formatObj.pourcentage === 'number' ? formatObj.pourcentage : 100;
                // Pondération par le pourcentage du type et du format
                const pct = pctMatiere * (pctType / 100) * (pctFormat / 100);
                values[matiere] = (values[matiere] || 0) + pct;
              });
            }
          });
        }
      });
      // Normalisation pour que la somme fasse 100%
      const sum = Object.values(values).reduce((a, b) => a + b, 0);
      if (sum > 0) {
        Object.keys(values).forEach(k => {
          values[k] = values[k] / sum * 100;
        });
      }
      values._missing = 100 - (sum > 0 ? 100 : 0);
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      // Trouver la matière dans le lot courant
      let fibresDistrib = {};
      Object.values(lot.formats).forEach(formatObj => {
        if (formatObj.types) {
          Object.values(formatObj.types).forEach(typeObj => {
            if (typeObj.matieres && typeObj.matieres[key] && typeObj.matieres[key].fibres) {
              Object.entries(typeObj.matieres[key].fibres).forEach(([fibre, pct]) => {
                fibresDistrib[fibre] = (fibresDistrib[fibre] || 0) + pct;
              });
            }
          });
        }
      });
      // Normalisation (au cas où plusieurs types)
      const sumFibres = Object.values(fibresDistrib).reduce((a, b) => a + b, 0);
      if (sumFibres > 0) {
        Object.keys(fibresDistrib).forEach(f => {
          fibresDistrib[f] = fibresDistrib[f] / sumFibres * 100;
        });
      }
      let fibresStr = '';
      if (Object.keys(fibresDistrib).length > 0) {
        fibresStr = '<br/><em>Fibres :</em><br/>' +
          Object.entries(fibresDistrib)
            .map(([f, pct]) => `${f} : ${pct.toFixed(1)}%`)
            .join('<br/>');
      }
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round(total * value / 100)} kg${fibresStr}`;
    }
  },
  fibres: {
    getStackValues: lot => {
      if (!lot.formats) return {};
      const values = {};
      Object.values(lot.formats).forEach(formatObj => {
        if (formatObj.types) {
          Object.values(formatObj.types).forEach(typeObj => {
            if (typeObj.matieres) {
              Object.values(typeObj.matieres).forEach(matiereObj => {
                if (matiereObj.fibres) {
                  Object.entries(matiereObj.fibres).forEach(([fibre, val]) => {
                    let pctFibre = typeof val === 'object' && val !== null
                      ? (val.pourcentage !== undefined ? val.pourcentage : val.masse !== undefined ? val.masse : 0)
                      : val;
                    // Pondération par tous les pourcentages
                    const pct = (pctFibre / 100) *
                                (matiereObj.pourcentage / 100) *
                                (typeObj.pourcentage / 100) *
                                (formatObj.pourcentage / 100) * 100;
                    values[fibre] = (values[fibre] || 0) + pct;
                  });
                }
              });
            }
          });
        }
      });
      // Normalisation pour que la somme fasse 100%
      const sum = Object.values(values).reduce((a, b) => a + b, 0);
      if (sum > 0) {
        Object.keys(values).forEach(k => {
          values[k] = values[k] / sum * 100;
        });
      }
      values._missing = 100 - (sum > 0 ? 100 : 0);
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round(total * value / 100)} kg`;
    }
  },
  couleur: {
    getStackValues: lot => {
      if (!lot.formats) return {};
      const values = {};
      Object.values(lot.formats).forEach(formatObj => {
        if (formatObj.types) {
          Object.values(formatObj.types).forEach(typeObj => {
            if (typeObj.couleurs) {
              const typePct = (typeObj.pourcentage / 100) * (formatObj.pourcentage / 100);
              Object.entries(typeObj.couleurs).forEach(([couleur, couleurObj]) => {
                let pct = 0;
                if (typeof couleurObj === 'object' && typeof couleurObj.pourcentage === 'number') {
                  pct = couleurObj.pourcentage;
                } else if (typeof couleurObj === 'number') {
                  pct = couleurObj;
                }
                values[couleur] = (values[couleur] || 0) + (pct / 100) * typePct * 100;
              });
            }
          });
        }
      });
      // **Normalisation finale**
      const sum = Object.values(values).reduce((a, b) => a + b, 0);
      if (sum > 0) {
        Object.keys(values).forEach(k => {
          values[k] = values[k] / sum * 100;
        });
      }
      values._missing = 100 - (sum > 0 ? 100 : 0);
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
  proprete: {
    getStackValues: lot => {
      if (!lot.proprete) return {};
      const values = {};
      Object.entries(lot.proprete).forEach(([prop, pct]) => {
        values[prop] = typeof pct === 'number' ? pct : (pct.pourcentage || 0);
      });
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round(total * value / 100)} kg`;
    }
  },
  // Ajoute ici d'autres dimensions si besoin
};

// --- Fonction utilitaire pour injecter les icônes Phosphor ---
function getIconSVG(name, className = '') {
  const iconMap = {
    'plus': 'ph-plus',
    'trash': 'ph-trash',
    'x': 'ph-x',
    'caret-left': 'ph-caret-left',
    'caret-right': 'ph-caret-right',
    'arrows-split': 'ph-arrows-split',
    'check-circle': 'ph-check-circle'
  };
  const iconClass = iconMap[name];
  if (!iconClass) return '';
  return `<i class="ph ${iconClass} ${className}"></i>`;
}

function updateSankey(dimension) {
    // Initialisation des palettes de couleurs
    const matiereSet = new Set();
    Object.values(window.lotType.formats).forEach(formatObj => {
        Object.values(formatObj.types).forEach(typeObj => {
            if (typeObj.matieres) {
                Object.keys(typeObj.matieres).forEach(matiere => matiereSet.add(matiere));
            }
        });
    });
    const matiereValues = Array.from(matiereSet);
    const nMatieres = matiereValues.length;
    let matierePalette = Array.from({length: nMatieres}, (_, i) => d3.interpolateCool(0.15 + 0.7 * (i / (nMatieres - 1))));
    matierePalette = d3.shuffle(matierePalette);

    const formatValues = [
        ...Object.keys(window.lotType.formats),
        ...(window.moreFormats || [])
    ].filter((v, i, arr) => arr.indexOf(v) === i);
    const nFormats = formatValues.length;
    const formatPalette = Array.from({length: nFormats}, (_, i) => d3.interpolateYlGn(0.2 + 0.6 * (i / (nFormats - 1))));

    const allTypeValues = [];
    formatValues.forEach(format => {
        const types = Object.keys(window.lotType.formats[format]?.types || {});
        types.forEach(type => {
            if (!allTypeValues.includes(type)) allTypeValues.push(type);
        });
    });
    if (window.moreTypes) {
        window.moreTypes.forEach(type => {
            if (!allTypeValues.includes(type)) allTypeValues.push(type);
        });
    }
    const nTypes = allTypeValues.length;
    const typePalette = Array.from({length: nTypes}, (_, i) => d3.interpolatePlasma(0.15 + 0.7 * (i / (nTypes - 1))));

    const fibreSet = new Set();
    Object.values(window.lotType.formats).forEach(formatObj => {
        Object.values(formatObj.types).forEach(typeObj => {
            if (typeObj.matieres) {
                Object.values(typeObj.matieres).forEach(matiereObj => {
                    if (matiereObj.fibres) {
                        Object.keys(matiereObj.fibres).forEach(fibre => fibreSet.add(fibre));
                    }
                });
            }
        });
    });
    const fibreValues = Array.from(fibreSet);
    const nFibres = fibreValues.length;
    const fibrePalette = Array.from({length: nFibres}, (_, i) => d3.interpolateViridis(0.15 + 0.7 * (i / (nFibres - 1))));

    const qualiteValues = Object.keys(window.lotType.qualite || {});
    const nQualite = qualiteValues.length;
    const qualitePalette = Array.from({length: nQualite}, (_, i) => d3.interpolateOranges(0.2 + 0.6 * (i / (nQualite - 1))));

    const propreteValues = Object.keys(window.lotType.proprete || {});
    const nProprete = propreteValues.length;
    const propretePalette = Array.from({length: nProprete}, (_, i) => d3.interpolateBlues(0.2 + 0.6 * (i / (nProprete - 1))));

    // Mise à jour des échelles de couleurs
    colorScales = {
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
            .domain(Object.keys(couleurMap))
            .range(Object.values(couleurMap)),
        qualite: d3.scaleOrdinal()
            .domain(qualiteValues)
            .range(qualitePalette),
        proprete: d3.scaleOrdinal()
            .domain(propreteValues)
            .range(propretePalette),
        fibre: d3.scaleOrdinal()
            .domain(fibreValues)
            .range(fibrePalette)
    };

    // Nettoyer le SVG
    svg.selectAll('*').remove();

    // Récupérer les nœuds et liens du scénario
    let nodes = window.sankeyScenario.nodes.map(n => ({ ...n, id: String(n.id) }));
    let links = window.sankeyScenario.links.map(l => ({
        ...l,
        source: String(l.source),
        target: String(l.target)
    }));

    // 1. Identifier les nœuds feuilles avec un target
    const leafNodesWithTarget = nodes.filter(n =>
        n.lot && n.lot.target &&
        !links.some(l => l.source === n.id)
    );

    // 2. Lister tous les targets uniques
    const uniqueTargets = [...new Set(leafNodesWithTarget.map(n => n.lot.target))];

    // 3. Créer un nœud destination pour chaque target
    const maxNodeDepth = Math.max(...nodes.map(n => n.depth || 0));
    const targetNodes = uniqueTargets.map(target => {
        // Récupérer tous les lots qui arrivent sur ce target
        const lotsToMerge = leafNodesWithTarget
            .filter(n => n.lot.target === target)
            .map(n => n.lot);
        
        return {
            id: 'target_' + target,
            name: target,
            isTarget: true,
            lot: mergeLots(lotsToMerge), // On merge les lots ici
            depth: maxNodeDepth + 1
        };
    });

    // 4. Pour chaque feuille avec target, créer un lien vers le nœud destination
    const newLinks = [];
    leafNodesWithTarget.forEach(leaf => {
        newLinks.push({
            source: String(leaf.id),
            target: 'target_' + leaf.lot.target,
            value: leaf.lot.total
        });
    });

    // 5. Ajouter ces nœuds et liens à la structure
    nodes = [...nodes, ...targetNodes];
    links = [
        ...links.filter(l => !leafNodesWithTarget.some(n => n.id === l.source)), // on retire les liens sortants des feuilles valorisées
        ...newLinks
    ];

    // Création du layout Sankey
    const stackbarWidth = 80;
    const extraBlockWidth = 30;
    const horizontalPadding = 20;

    // Préserver l'ordre des liens
    const linkOrder = new Map();
    links.forEach((link, i) => {
        const sourceId = String(link.source);
        if (!linkOrder.has(sourceId)) {
            linkOrder.set(sourceId, []);
        }
        linkOrder.get(sourceId).push(i);
    });

    const sankey = d3.sankey()
        .nodeWidth(stackbarWidth + extraBlockWidth)
        .nodePadding(10)
        .extent([[horizontalPadding, 0], [width - horizontalPadding, height]])
        .nodeId(d => d.id)
        .linkSort((a, b) => {
            const sourceOrder = linkOrder.get(String(a.source.id));
            if (sourceOrder) {
                return sourceOrder.indexOf(a.index) - sourceOrder.indexOf(b.index);
            }
            return 0;
        });

    // Application du layout
    const { nodes: sankeyNodes, links: sankeyLinks } = sankey({ nodes, links });

    // Calcul du nombre de colonnes (niveaux)
    const maxDepth = Math.max(...nodes.map(n => n.depth || 0));
    const minWidth = width; // On utilise la largeur de la fenêtre comme minimum
    const dynamicWidth = Math.max(minWidth, (stackbarWidth + extraBlockWidth) * (maxDepth + 1) + 40);
    svg.attr('width', dynamicWidth);

    // Calcul des totaux par target
    const targetTotals = {};
    nodes.forEach(node => {
        if (node.lot && node.lot.target) {
            targetTotals[node.lot.target] = (targetTotals[node.lot.target] || 0) + node.lot.total;
        }
    });

    // Choix de la palette de couleurs selon la dimension
    if (!colorScales.format || typeof colorScales.format !== 'function') {
      console.warn('colorScales.format non initialisé, palettes manquantes');
      // Optionnel : forcer une réinitialisation ici
    }
    let colorAccessor = d => '#bbb';
    if (dimension === 'qualite') {
        colorAccessor = d => colorScales.qualite(d);
    } else if (dimension === 'proprete') {
        colorAccessor = d => colorScales.proprete(d);
    } else if (dimension === 'matiere') {
        colorAccessor = d => colorScales.matiere(d);
    } else if (dimension === 'format') {
        colorAccessor = d => colorScales.format(d);
    } else if (dimension === 'type' || dimension === 'format_type') {
        colorAccessor = d => colorScales.type(d);
    } else if (dimension === 'fibres') {
        colorAccessor = d => colorScales.fibre(d);
    } else if (dimension === 'couleur') {
        colorAccessor = d => colorScales.couleur(d);
    }

    // Création des liens
    svg.append('g')
        .selectAll('path')
        .data(sankeyLinks)
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
            if (dimension === 'format') {
                tooltipContent += `<br/><strong>Détails Format :</strong><br/>`;
                if (d.target.lot && d.target.lot.formats && typeof d.target.lot.formats === 'object') {
                  Object.entries(d.target.lot.formats).forEach(([key, obj]) => {
                    // Gestion des cas où obj est un nombre (parfois structure simplifiée)
                    const pct = typeof obj === 'number'
                      ? obj
                      : (typeof obj.pourcentage === 'number' ? obj.pourcentage : null);
                    if (pct !== null) {
                      tooltipContent += `${key}: ${pct.toFixed(1)}%<br/>`;
                    }
                  });
                }
            } else if (dimension === 'format_type') {
                // Recalcule la distribution des types à la volée sur d.target.lot
                const values = {};
                let totalWithType = 0;
                if (d.target.lot && d.target.lot.formats) {
                  Object.values(d.target.lot.formats).forEach(formatObj => {
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
                if (d.target.lot && d.target.lot.formats) {
                  Object.values(d.target.lot.formats).forEach(formatObj => {
                    if (formatObj.types) {
                      Object.entries(formatObj.types).forEach(([matiere, matiereObj]) => {
                        if (typeof matiereObj.pourcentage === 'number') {
                          // Pondération par le pourcentage du type et du format
                          const pct = matiereObj.pourcentage * (typeObj.pourcentage / 100) * (formatObj.pourcentage / 100);
                          values[matiere] = (values[matiere] || 0) + pct;
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
                if (d.target.lot && d.target.lot.formats) {
                  Object.entries(d.target.lot.formats).forEach(([formatName, formatObj]) => {
                    if (formatObj.types) {
                      Object.entries(formatObj.types).forEach(([typeName, typeObj]) => {
                        if (typeObj.matieres) {
                          Object.entries(typeObj.matieres).forEach(([matiereName, matiereObj]) => {
                            if (matiereObj && matiereObj.fibres && Object.keys(matiereObj.fibres).length > 0) {
                              Object.entries(matiereObj.fibres).forEach(([fibre, val]) => {
                                let pctFibre = typeof val === 'object' && val !== null
                                  ? (val.pourcentage !== undefined ? val.pourcentage : val.masse !== undefined ? val.masse : 0)
                                  : val;
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
                if (d.target.lot && d.target.lot.formats) {
                  Object.entries(d.target.lot.formats).forEach(([formatName, formatObj]) => {
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
            } else if (dimension === 'proprete') {
                // Recalcule la distribution des propretés à la volée sur d.target.lot
                const values = {};
                let totalProprete = 0;
                if (d.target.lot && d.target.lot.proprete) {
                  Object.entries(d.target.lot.proprete).forEach(([prop, pct]) => {
                    // pct peut être un nombre ou un objet (selon la structure)
                    const val = typeof pct === 'number' ? pct : (pct.pourcentage || 0);
                    values[prop] = val;
                    totalProprete += val;
                  });
                }
                // Normalisation pour que la somme fasse 100
                if (totalProprete > 0) {
                  Object.keys(values).forEach(k => {
                    values[k] = values[k] / totalProprete * 100;
                  });
                }
                tooltipContent += `<br/><strong>Détails Propreté :</strong><br/>`;
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
        .data(sankeyNodes)
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
        
        // On affiche les stackbars pour tous les nœuds, y compris les targets
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

        sortedEntries.forEach(([key, value]) => {
            const height = sum > 0 ? (value / sum) * nodeHeight : 0;
            const fillColor = d3.color(colorAccessor(key));
            const fillColorStr = `rgba(${fillColor.r},${fillColor.g},${fillColor.b},0.6)`;
            const strokeColorStr = `rgba(${fillColor.r},${fillColor.g},${fillColor.b},1)`;
            const isUnknown = key.toLowerCase() === 'inconnu' || key.toLowerCase() === 'autre';
            
            nodeGroup.append('rect')
                .attr('x', 0)
                .attr('y', yOffset)
                .attr('height', height)
                .attr('width', stackbarWidth)
                .attr('rx', 4)
                .attr('ry', 4)
                .attr('class', 'stackbar-segment')
                .attr('data-key', key)
                .attr('data-dimension', dimension)
                .style('fill', isUnknown ? 'url(#dashed-bg)' : fillColorStr)
                .style('stroke', isUnknown ? '#999' : strokeColorStr)
                .style('stroke-width', '1px')
                .style('opacity', 1)
                .on('mouseover', function(event) {
                    let tooltipContent = component ? component.getTooltipContent(d.lot, key, value, d.lot.total) : '';
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', .9);
                    const svgRect = svg.node().ownerSVGElement.getBoundingClientRect();
                    const rect = this.getBoundingClientRect();
                    const offsetX = rect.left - svgRect.left;
                    const offsetY = rect.top - svgRect.top;
                    tooltip.html(tooltipContent)
                        .style('left', (svgRect.left + offsetX) + 'px')
                        .style('top', (svgRect.top + offsetY) + 'px');
                    // Highlight links
                    svg.selectAll('.link')
                        .transition().duration(100)
                        .style('stroke-opacity', l => {
                            // Si le target est un nœud merged (isTarget), on regarde le lot source
                            const isMergedTarget = l.target.isTarget;
                            const lotToCheck = isMergedTarget ? (l.source.lot || {}) : (l.target.lot || {});
                            if (dimension === 'format') {
                                return (lotToCheck.formats && Object.keys(lotToCheck.formats).includes(key)) ? 0.7 : 0.18;
                            }
                            if (dimension === 'format_type' || dimension === 'type') {
                                const hasType = lot => Object.values(lot.formats || {}).some(f =>
                                    f.types && Object.keys(f.types).includes(key)
                                );
                                return hasType(lotToCheck) ? 0.7 : 0.18;
                            }
                            if (dimension === 'matiere') {
                                const hasMatiere = lot => Object.values(lot.formats || {}).some(f =>
                                    f.types && Object.values(f.types).some(t =>
                                        t.matieres && Object.keys(t.matieres).includes(key)
                                    )
                                );
                                return hasMatiere(lotToCheck) ? 0.7 : 0.18;
                            }
                            if (dimension === 'fibres') {
                                const hasFibre = lot => Object.values(lot.formats || {}).some(f =>
                                    f.types && Object.values(f.types).some(t =>
                                        t.matieres && Object.values(t.matieres).some(m =>
                                            m.fibres && Object.keys(m.fibres).includes(key)
                                        )
                                    )
                                );
                                return hasFibre(lotToCheck) ? 0.7 : 0.18;
                            }
                            if (dimension === 'couleur') {
                                const hasCouleur = lot => Object.values(lot.formats || {}).some(f =>
                                    f.types && Object.values(f.types).some(t =>
                                        t.couleurs && Object.keys(t.couleurs).includes(key)
                                    )
                                );
                                return hasCouleur(lotToCheck) ? 0.7 : 0.18;
                            }
                            if (dimension === 'qualite') {
                                return (lotToCheck.qualite && Object.keys(lotToCheck.qualite).includes(key)) ? 0.7 : 0.18;
                            }
                            if (dimension === 'proprete') {
                                return (lotToCheck.proprete && Object.keys(lotToCheck.proprete).includes(key)) ? 0.7 : 0.18;
                            }
                            return 0.18;
                        });
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                    // Reset links
                    svg.selectAll('.link')
                        .transition().duration(100)
                        .style('stroke-opacity', 0.18);
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
                // Vérifier si c'est un nœud target
                if (d.isTarget) {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', .9);
                    tooltip.html(`
                        <strong>${d.name}</strong><br/>
                        <span style='font-size:12px;color:#666;'>Nœud destination</span>
                    `)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                } else {
                    const dimensionValues = component ? component.getStackValues(d.lot) : {};
                    const sumPct = Object.values(dimensionValues).reduce((a, b) => a + b, 0);
                    const missingPct = dimensionValues._missing || 0;
                    let missingInfo = '';
                    if (missingPct > 0.1) {
                        missingInfo = `<br/><span style='font-size:12px;color:#c00;'>Donnée couleur manquante pour ${missingPct.toFixed(1)}%</span>`;
                    }
                    
                    // Ajout des informations sur la target
                    let targetInfo = '';
                    if (d.lot && d.lot.target) {
                        targetInfo = `
                            <br/>
                            <div style='margin-top:8px;padding-top:8px;border-top:1px solid #ddd;'>
                                <strong style='color:#4CAF50;'>✓ Destination validée</strong><br/>
                                <span style='font-size:12px;'>Target: ${d.lot.target}</span>
                            </div>
                        `;
                    }
                    
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', .9);
                    tooltip.html(`
                        <strong>${d.name}</strong><br/>
                        Poids du lot : ${Math.round(d.lot.total)} kg<br/>
                        <span style='font-size:12px;color:#666;'>Somme des % stackbar : ${sumPct.toFixed(1)}%</span>
                        ${missingInfo}
                        ${targetInfo}
                    `)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                }
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // 1. Icônes pour les liens sortants (fork)
        const outgoingLinks = sankeyLinks.filter(l => l.source.id === d.id && !l.target.name.startsWith('Reste'));
        if (!(d.lot && d.lot.target) && !d.isTarget) {
            outgoingLinks.forEach((link, idx) => {
                const linkY = link.y0 - d.y0;
                const fo = nodeGroup.append('foreignObject')
                    .attr('x', stackbarWidth + (extraBlockWidth - 28) / 2)
                    .attr('y', linkY - 14)
                    .attr('width', 28)
                    .attr('height', 28);
                const div = document.createElement('div');
                div.className = 'w-7 h-7 p-[3px] flex items-center justify-center rounded bg-gray-300 hover:bg-gray-400 border border-gray-400 cursor-pointer';
                div.innerHTML = getIconSVG('arrows-split', 'w-7 h-7 text-[1.3rem] flex items-center justify-center');
                fo.node().appendChild(div);
                div.addEventListener('mouseover', function(event) {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', .9);

                    const d = link;
                    const chemin = `${d.source.name} → ${d.target.name}`;
                    const parties = chemin.split('→').map(s => s.trim());
                    let transformation = '';
                    if (parties.length === 3) {
                        transformation = parties[1];
                    } else if (parties.length === 2) {
                        transformation = parties[1];
                    } else {
                        transformation = d.target.name;
                    }

                    tooltip.html(`<strong>${transformation}</strong>`)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                });
                div.addEventListener('mouseout', function() {
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });
            });
        }

        // 2. Icône + sur le lien "Reste" (coproduit)
        const resteLinks = sankeyLinks.filter(l => l.source.id === d.id && l.target.name.startsWith('Reste'));
        resteLinks.forEach((link, idx) => {
            const linkY = link.y0 - d.y0;
            const fo = nodeGroup.append('foreignObject')
                .attr('x', stackbarWidth + (extraBlockWidth - 28) / 2)
                .attr('y', linkY - 14)
                .attr('width', 28)
                .attr('height', 28);
            const div = document.createElement('div');
            div.className = 'w-7 h-7 p-[3px] flex items-center justify-center rounded bg-gray-300 hover:bg-gray-400 border border-gray-400 cursor-pointer';
            div.innerHTML = getIconSVG('plus', 'w-7 h-7 text-[1.3rem] flex items-center justify-center');
            fo.node().appendChild(div);
            div.addEventListener('mouseover', function(event) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html('<strong>Ajouter une transformation</strong>')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            });
            div.addEventListener('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        });

        // 3. Icône + sur les nœuds feuilles sans target (aucun lien sortant)
        const hasOutgoing = sankeyLinks.some(l => l.source.id === d.id);
        if (!hasOutgoing && !(d.lot && d.lot.target) && !d.isTarget) {
            const yPlus = nodeHeight / 2 - 14;
            const fo = nodeGroup.append('foreignObject')
                .attr('x', stackbarWidth + (extraBlockWidth - 28) / 2)
                .attr('y', yPlus)
                .attr('width', 28)
                .attr('height', 28);
            const div = document.createElement('div');
            div.className = 'w-7 h-7 p-[3px] flex items-center justify-center rounded bg-gray-300 hover:bg-gray-400 border border-gray-400 cursor-pointer';
            div.innerHTML = getIconSVG('plus', 'w-7 h-7 text-[1.3rem] flex items-center justify-center');
            fo.node().appendChild(div);
            div.addEventListener('mouseover', function(event) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html('<strong>Ajouter une transformation</strong>')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            });
            div.addEventListener('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        }

        // 4. Icône check sur les nœuds valorisés ou agglomérés (isTarget)
        if ((d.lot && d.lot.target) || d.isTarget) {
            const yCheck = nodeHeight / 2 - 14;
            const fo = nodeGroup.append('foreignObject')
                .attr('x', stackbarWidth + (extraBlockWidth - 28) / 2)
                .attr('y', yCheck)
                .attr('width', 28)
                .attr('height', 28);
            const div = document.createElement('div');
            div.className = 'w-7 h-7 p-[3px] flex items-center justify-center rounded bg-green-100 hover:bg-green-200 border border-green-400 cursor-pointer';
            div.innerHTML = getIconSVG('check-circle', 'w-7 h-7 text-[1.3rem] flex items-center justify-center text-green-600');
            fo.node().appendChild(div);
            div.addEventListener('mouseover', function(event) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                // Tooltip riche comme avant
                let distributionHtml = '';
                const component = stackbarComponents[dimension];
                if (component && d.lot) {
                    const dist = component.getStackValues(d.lot);
                    const sum = Object.values(dist).reduce((a, b) => a + b, 0);
                    if (Object.keys(dist).length > 0 && sum > 0) {
                        distributionHtml += `<div style='margin-top:8px;padding-top:8px;border-top:1px solid #ddd;'><strong>Distribution ${dimension} :</strong><br/>`;
                        Object.entries(dist)
                            .filter(([key]) => !key.startsWith('_'))
                            .sort((a, b) => b[1] - a[1])
                            .forEach(([key, value]) => {
                                const poids = d.lot.total ? Math.round(d.lot.total * value / 100) : 0;
                                distributionHtml += `${key} : ${value.toFixed(1)}% (${poids} kg)<br/>`;
                            });
                        distributionHtml += '</div>';
                    }
                }
                tooltip.html(`
                    <strong>Destination validée</strong><br/>
                    Target: ${(d.lot && d.lot.target) ? d.lot.target : d.name}<br/>
                    <span style='font-size:12px;color:#666;'>Poids du lot: ${d.lot ? Math.round(d.lot.total) : ''} kg</span>
                    ${distributionHtml}
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            });
            div.addEventListener('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        }
    });

    // Ajout d'un calque dédié pour les titres, après tous les nœuds
    svg.selectAll('.titles-layer').remove();
    const titlesLayer = svg.append('g').attr('class', 'titles-layer');
    sankeyNodes.forEach(d => {
        titlesLayer.append('text')
            .attr('class', 'lot-title')
            .attr('x', (d.x0 + d.x1) / 2 - extraBlockWidth / 2)
            .attr('y', d.y0 - 8)
            .attr('text-anchor', 'middle')
            .text(
                d.lot && d.lot.title ? d.lot.title : d.name
            )
            .style('font-size', '11px')
            .style('fill', '#666')
            .style('pointer-events', 'none');
    });

    // Trier les nœuds par depth puis par order
    nodes.sort((a, b) => (a.depth - b.depth) || (a.order - b.order));
}

// Gestion du changement de dimension
document.getElementById('dimension-selector').addEventListener('change', function(e) {
    updateSankey(e.target.value);
});

// Initialisation avec la première dimension
document.getElementById('dimension-selector').value = 'format';

// Gestion du redimensionnement
window.addEventListener('resize', function() {
    width = window.innerWidth - margin.left - margin.right;
    height = document.getElementById('sankey-container').offsetHeight - margin.top - margin.bottom;
    svg.attr('width', width + margin.left + margin.right)
       .attr('height', height + margin.top + margin.bottom);
    updateSankey(document.getElementById('dimension-selector').value);
});

// Fonction principale pour lancer le Sankey depuis le HTML
function runSankey({ lot, scenario, containerId = 'sankey-container', dimension = 'format' }) {
  // Appliquer le scénario au lot
  const sankeyScenario = applyScenario(lot, scenario);

  // Stocker dans le global pour compatibilité temporaire
  window.sankeyScenario = sankeyScenario;

  // Mettre à jour le Sankey
  if (typeof updateSankey === 'function') {
    updateSankey(dimension);
  } else {
    console.error('updateSankey non défini');
  }
}

