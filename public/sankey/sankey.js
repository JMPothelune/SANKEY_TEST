// Configuration
const margin = { top: 20, right: 40, bottom: 20, left: 0 };
let width = window.innerWidth - margin.left - margin.right;
let height =
  document.getElementById('sankey-container').offsetHeight -
  margin.top -
  margin.bottom;

// Variables globales pour stocker les valeurs courantes
window.currentDimension = 'format';
window.currentScenarioIdx = 0;
window.currentLotId = '';

// Fonction utilitaire pour lire les paramètres d'URL
function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    dimension: urlParams.get('dimension') || 'format',
    scenarioIdx: parseInt(urlParams.get('scenarioIdx') || '0', 10),
    lotId: urlParams.get('lotId') || '',
    isEditable: urlParams.get('isEditable') === 'yes',
  };
}

// Fonction pour mettre à jour les paramètres d'URL
function updateUrlParams(params) {
  const url = new URL(window.location);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, value);
    }
  });
  window.history.replaceState({}, '', url);
}

// Initialisation avec les paramètres d'URL
function initializeFromUrl() {
  const params = getUrlParams();
  window.currentDimension = params.dimension;
  window.currentScenarioIdx = params.scenarioIdx;
  window.currentLotId = params.lotId;
  window.isEditable = params.isEditable;

  console.log('Sankey initialisé avec:', params);

  // Si on a un lot et un scénario, lancer le Sankey
  if (
    window.lotType &&
    window.scenarios &&
    window.scenarios[window.currentScenarioIdx]
  ) {
    const scenario = window.scenarios[window.currentScenarioIdx].scenario;
    runSankey({
      lot: window.lotType,
      scenario,
      containerId: 'sankey-container',
      dimension: window.currentDimension,
    });
  }
}

// Création du SVG
const svg = d3
  .select('#sankey-container')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

// Ajout du pattern SVG pour le fond dashed (à faire UNE SEULE FOIS)
d3.select('#sankey-container svg').select('defs').remove(); // supprime un éventuel doublon
const defs = d3.select('#sankey-container svg').append('defs');
const pattern = defs
  .append('pattern')
  .attr('id', 'dashed-bg')
  .attr('patternUnits', 'userSpaceOnUse')
  .attr('width', 8)
  .attr('height', 8);
pattern
  .append('rect')
  .attr('width', 8)
  .attr('height', 8)
  .attr('fill', '#f5f5f5');
pattern
  .append('path')
  .attr('d', 'M0,0 l8,8')
  .attr('stroke', '#bbb')
  .attr('stroke-width', 2);

// Création du tooltip
const tooltip = d3
  .select('body')
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
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round((total * value) / 100)} kg`;
    },
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
              const typePct =
                typeObj.pourcentage * (formatObj.pourcentage / 100);
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
          values[k] = (values[k] / totalWithType) * 100;
        });
      }
      // Optionnel : indiquer la part sans type (rare, mais pour homogénéité)
      values._missing = 100 - (totalWithType > 0 ? 100 : 0);
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round((total * value) / 100)} kg`;
    },
  },
  matiere: {
    getStackValues: lot => {
      if (!lot.formats) return {};
      const values = {};
      Object.values(lot.formats).forEach(formatObj => {
        if (formatObj.types) {
          Object.values(formatObj.types).forEach(typeObj => {
            if (typeObj.matieres) {
              Object.entries(typeObj.matieres).forEach(
                ([matiere, matiereObj]) => {
                  // On accepte aussi les objets { pourcentage: ... } ou nombre direct
                  let pctMatiere =
                    typeof matiereObj === 'object' && matiereObj !== null
                      ? matiereObj.pourcentage !== undefined
                        ? matiereObj.pourcentage
                        : 0
                      : matiereObj;
                  let pctType =
                    typeof typeObj.pourcentage === 'number'
                      ? typeObj.pourcentage
                      : 100;
                  let pctFormat =
                    typeof formatObj.pourcentage === 'number'
                      ? formatObj.pourcentage
                      : 100;
                  // Pondération par le pourcentage du type et du format
                  const pct = pctMatiere * (pctType / 100) * (pctFormat / 100);
                  values[matiere] = (values[matiere] || 0) + pct;
                }
              );
            }
          });
        }
      });
      // Normalisation pour que la somme fasse 100%
      const sum = Object.values(values).reduce((a, b) => a + b, 0);
      if (sum > 0) {
        Object.keys(values).forEach(k => {
          values[k] = (values[k] / sum) * 100;
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
            if (
              typeObj.matieres &&
              typeObj.matieres[key] &&
              typeObj.matieres[key].fibres
            ) {
              Object.entries(typeObj.matieres[key].fibres).forEach(
                ([fibre, pct]) => {
                  let pctValue =
                    typeof pct === 'object' && pct !== null
                      ? pct.pourcentage !== undefined
                        ? pct.pourcentage
                        : 0
                      : pct;
                  fibresDistrib[fibre] = (fibresDistrib[fibre] || 0) + pctValue;
                }
              );
            }
          });
        }
      });
      // Normalisation (au cas où plusieurs types)
      const sumFibres = Object.values(fibresDistrib).reduce((a, b) => a + b, 0);
      if (sumFibres > 0) {
        Object.keys(fibresDistrib).forEach(f => {
          fibresDistrib[f] = (fibresDistrib[f] / sumFibres) * 100;
        });
      }
      let fibresStr = '';
      if (Object.keys(fibresDistrib).length > 0) {
        fibresStr =
          '<br/><em>Fibres :</em><br/>' +
          Object.entries(fibresDistrib)
            .map(([f, pct]) => `${f} : ${Number(pct).toFixed(1)}%`)
            .join('<br/>');
      }
      return `<strong>${key}</strong><br/>Pourcentage : ${Number(value).toFixed(1)}%<br/>Poids : ${Math.round((total * value) / 100)} kg${fibresStr}`;
    },
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
                    let pctFibre =
                      typeof val === 'object' && val !== null
                        ? val.pourcentage !== undefined
                          ? val.pourcentage
                          : val.masse !== undefined
                            ? val.masse
                            : 0
                        : val;
                    // Pondération par tous les pourcentages
                    const pct =
                      (pctFibre / 100) *
                      (matiereObj.pourcentage / 100) *
                      (typeObj.pourcentage / 100) *
                      (formatObj.pourcentage / 100) *
                      100;
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
          values[k] = (values[k] / sum) * 100;
        });
      }
      values._missing = 100 - (sum > 0 ? 100 : 0);
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round((total * value) / 100)} kg`;
    },
  },
  couleur: {
    getStackValues: lot => {
      if (!lot.formats) return {};
      const values = {};
      let totalLot = 0;
      let totalSansCouleur = 0;

      Object.values(lot.formats).forEach(formatObj => {
        const pctFormat =
          typeof formatObj.pourcentage === 'number'
            ? formatObj.pourcentage
            : 100;
        if (formatObj.types) {
          Object.values(formatObj.types).forEach(typeObj => {
            const pctType =
              typeof typeObj.pourcentage === 'number'
                ? typeObj.pourcentage
                : 100;
            const masseType = (pctFormat * pctType) / 100;
            totalLot += masseType;
            if (typeObj.couleurs && Object.keys(typeObj.couleurs).length > 0) {
              let sumCouleur = 0;
              Object.entries(typeObj.couleurs).forEach(
                ([couleur, couleurObj]) => {
                  let pct = 0;
                  if (
                    typeof couleurObj === 'object' &&
                    typeof couleurObj.pourcentage === 'number'
                  ) {
                    pct = couleurObj.pourcentage;
                  } else if (typeof couleurObj === 'number') {
                    pct = couleurObj;
                  }
                  values[couleur] =
                    (values[couleur] || 0) + (pct / 100) * masseType;
                  sumCouleur += (pct / 100) * masseType;
                }
              );
              // Si la somme des couleurs ne couvre pas toute la masse du type, le reste est inconnu
              if (sumCouleur < masseType) {
                totalSansCouleur += masseType - sumCouleur;
              }
            } else {
              // Pas de couleur renseignée pour ce type
              totalSansCouleur += masseType;
            }
          });
        }
      });

      // Normalisation sur la masse totale du lot
      if (totalLot > 0) {
        Object.keys(values).forEach(k => {
          values[k] = (values[k] / totalLot) * 100;
        });
      }
      if (totalSansCouleur > 0 && totalLot > 0) {
        values['inconnu'] = (totalSansCouleur / totalLot) * 100;
      }
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${Number(value).toFixed(1)}%<br/>Poids : ${Math.round((total * value) / 100)} kg`;
    },
  },
  qualite: {
    getStackValues: lot => {
      if (!lot.qualite) return {};
      const values = {};
      Object.entries(lot.qualite).forEach(([qual, pct]) => {
        // pct peut être un nombre ou un objet (selon la structure)
        values[qual] = typeof pct === 'number' ? pct : pct.pourcentage || 0;
      });
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round((total * value) / 100)} kg`;
    },
  },
  proprete: {
    getStackValues: lot => {
      if (!lot.proprete) return {};
      const values = {};
      Object.entries(lot.proprete).forEach(([prop, pct]) => {
        values[prop] = typeof pct === 'number' ? pct : pct.pourcentage || 0;
      });
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round((total * value) / 100)} kg`;
    },
  },
  perturbateurs: {
    getStackValues: lot => {
      // On cherche les perturbateurs dans chaque type de chaque format
      if (!lot.formats) return {};
      const values = {};
      let total = 0;
      let totalSansPerturbateur = 0;
      Object.values(lot.formats).forEach(formatObj => {
        if (formatObj.types) {
          Object.values(formatObj.types).forEach(typeObj => {
            const pctType =
              typeof typeObj.pourcentage === 'number'
                ? typeObj.pourcentage
                : 100;
            if (
              typeObj.perturbateurs &&
              Object.keys(typeObj.perturbateurs).length > 0
            ) {
              let sumPert = 0;
              Object.entries(typeObj.perturbateurs).forEach(
                ([pert, pertObj]) => {
                  let pct =
                    typeof pertObj === 'object' &&
                    pertObj.pourcentage !== undefined
                      ? pertObj.pourcentage
                      : typeof pertObj === 'number'
                        ? pertObj
                        : 0;
                  values[pert] = (values[pert] || 0) + pct * (pctType / 100);
                  sumPert += pct * (pctType / 100);
                }
              );
              total += sumPert;
              if (sumPert < pctType) {
                totalSansPerturbateur += pctType - sumPert;
              }
            } else {
              // Pas de perturbateur renseigné pour ce type
              totalSansPerturbateur += pctType;
            }
          });
        }
      });
      // Normalisation pour que la somme fasse 100%
      const sum = total + totalSansPerturbateur;
      if (sum > 0) {
        Object.keys(values).forEach(k => {
          values[k] = (values[k] / sum) * 100;
        });
        if (totalSansPerturbateur > 0) {
          values['inconnu'] = (totalSansPerturbateur / sum) * 100;
        }
      }
      return values;
    },
    getTooltipContent: (lot, key, value, total) => {
      return `<strong>${key}</strong><br/>Pourcentage : ${value.toFixed(1)}%<br/>Poids : ${Math.round((total * value) / 100)} kg`;
    },
  },
  // Ajoute ici d'autres dimensions si besoin
};

// --- Fonction utilitaire pour injecter les icônes Phosphor ---
function getIconSVG(name, className = '') {
  const iconMap = {
    plus: 'ph-plus',
    trash: 'ph-trash',
    x: 'ph-x',
    'caret-left': 'ph-caret-left',
    'caret-right': 'ph-caret-right',
    'arrows-split': 'ph-arrows-split',
    'check-circle': 'ph-check-circle',
    'pencil-simple': 'ph-pencil-simple',
    'arrow-up': 'ph-arrow-up',
    'arrow-down': 'ph-arrow-down',
  };
  const iconClass = iconMap[name];
  if (!iconClass) return '';
  return `<i class="ph ${iconClass} ${className}"></i>`;
}

function updateSankey(dimension) {
  // Nettoyer le SVG
  svg.selectAll('*').remove();

  // Récupérer les nœuds et liens du scénario
  let nodes = window.sankeyScenario.nodes.map(n => ({
    ...n,
    id: String(n.id),
  }));
  let links = window.sankeyScenario.links.map(l => ({
    ...l,
    source: String(l.source),
    target: String(l.target),
  }));

  // Cas spécial : Sankey vide (aucune transformation appliquée, que des nœuds target ou Reste sans transformation)
  const onlyInitialAndTargets =
    nodes.length > 1 &&
    nodes
      .slice(1)
      .every(n => n.isTarget || (n.name && n.name.startsWith('Reste'))) &&
    links.every(l => !l.transformation);

  if (onlyInitialAndTargets) {
    // On ne garde que le lot initial, sans liens ni nœuds target/reste
    nodes = [nodes[0]];
    links = [];
    // Cas spécial : un seul nœud => affichage manuel
    // (on saute la logique D3 Sankey)
    if (nodes.length === 1) {
      const stackbarWidth = 80;
      const extraBlockWidth = 30;
      const horizontalPadding = 20;
      const nodeHeight = Math.max(100, height * 0.8);
      const x = horizontalPadding;
      const y = 40;
      const d = nodes[0];
      const nodeGroup = svg
        .append('g')
        .attr('transform', `translate(${x},${y})`);

      // Stackbar (fond)
      nodeGroup
        .append('rect')
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
        nodeGroup
          .append('rect')
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

      // Affichage des segments stackbar avec couleur du JSON
      sortedEntries.forEach(([key, value]) => {
        const heightSeg = sum > 0 ? (value / sum) * nodeHeight : 0;
        let color = '#bbb';
        if (
          dimension === 'format' &&
          d.lot.formats &&
          d.lot.formats[key] &&
          d.lot.formats[key].color
        ) {
          color = d.lot.formats[key].color;
        } else if (
          (dimension === 'type' || dimension === 'format_type') &&
          d.lot.formats
        ) {
          Object.values(d.lot.formats).forEach(formatObj => {
            if (
              formatObj.types &&
              formatObj.types[key] &&
              formatObj.types[key].color
            ) {
              color = formatObj.types[key].color;
            }
          });
        } else if (dimension === 'matiere' && d.lot.formats) {
          Object.values(d.lot.formats).forEach(formatObj => {
            if (formatObj.types) {
              Object.values(formatObj.types).forEach(typeObj => {
                if (
                  typeObj.matieres &&
                  typeObj.matieres[key] &&
                  typeObj.matieres[key].color
                ) {
                  color = typeObj.matieres[key].color;
                }
              });
            }
          });
        } else if (dimension === 'fibres' && d.lot.formats) {
          Object.values(d.lot.formats).forEach(formatObj => {
            if (formatObj.types) {
              Object.values(formatObj.types).forEach(typeObj => {
                if (typeObj.matieres) {
                  Object.values(typeObj.matieres).forEach(matiereObj => {
                    if (
                      matiereObj.fibres &&
                      matiereObj.fibres[key] &&
                      matiereObj.fibres[key].color
                    ) {
                      color = matiereObj.fibres[key].color;
                    }
                  });
                }
              });
            }
          });
        } else if (dimension === 'couleur' && d.lot.formats) {
          Object.values(d.lot.formats).forEach(formatObj => {
            if (formatObj.types) {
              Object.values(formatObj.types).forEach(typeObj => {
                if (
                  typeObj.couleurs &&
                  typeObj.couleurs[key] &&
                  typeObj.couleurs[key].color
                ) {
                  color = typeObj.couleurs[key].color;
                }
              });
            }
          });
        } else if (
          dimension === 'qualite' &&
          d.lot.qualite &&
          d.lot.qualite[key] &&
          d.lot.qualite[key].color
        ) {
          color = d.lot.qualite[key].color;
        } else if (
          dimension === 'proprete' &&
          d.lot.proprete &&
          d.lot.proprete[key] &&
          d.lot.proprete[key].color
        ) {
          color = d.lot.proprete[key].color;
        } else if (dimension === 'perturbateurs' && d.lot.formats) {
          Object.values(d.lot.formats).forEach(formatObj => {
            if (formatObj.types) {
              Object.values(formatObj.types).forEach(typeObj => {
                if (
                  typeObj.perturbateurs &&
                  typeObj.perturbateurs[key] &&
                  typeObj.perturbateurs[key].color
                ) {
                  color = typeObj.perturbateurs[key].color;
                }
              });
            }
          });
        }
        const fillColorStr = color + (color.length === 7 ? '99' : ''); // Opacité 60% si hex, sinon rgba déjà
        const strokeColorStr = color;
        const isUnknown =
          key.toLowerCase() === 'inconnu' || key.toLowerCase() === 'autre';
        nodeGroup
          .append('rect')
          .attr('x', 0)
          .attr('y', yOffset)
          .attr('height', heightSeg)
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
          .on('mouseover', function (event) {
            let tooltipContent = component
              ? component.getTooltipContent(d.lot, key, value, d.lot.total)
              : '';
            tooltip.transition().duration(200).style('opacity', 0.9);
            tooltip
              .html(tooltipContent)
              .style('left', event.pageX + 10 + 'px')
              .style('top', event.pageY - 28 + 'px');
          })
          .on('mouseout', function () {
            tooltip.transition().duration(500).style('opacity', 0);
          });
        yOffset += heightSeg;
      });

      // Bloc à droite de la stackbar
      nodeGroup
        .append('rect')
        .attr('x', stackbarWidth)
        .attr('y', 0)
        .attr('width', extraBlockWidth)
        .attr('height', nodeHeight)
        .attr('rx', 4)
        .attr('ry', 4)
        .style('fill', 'rgba(204,204,204,0.6)') // gris clair, opacité 60%
        .style('stroke', 'rgba(204,204,204,1)') // bordure 100%
        .style('stroke-width', '1px')
        .style('opacity', 1);

      // Titre du lot
      nodeGroup
        .append('text')
        .attr('class', 'lot-title')
        .attr('x', (stackbarWidth + extraBlockWidth) / 2)
        .attr('y', -8)
        .attr('text-anchor', 'middle')
        .text(d.lot && d.lot.title ? d.lot.title : d.name)
        .style('font-size', '11px')
        .style('fill', '#666');

      // Bouton + pour ajouter une transformation (même logique que dans la boucle node.each)
      const yPlus = nodeHeight / 2 - 14;
      const fo = nodeGroup
        .append('foreignObject')
        .attr('x', stackbarWidth + (extraBlockWidth - 28) / 2)
        .attr('y', yPlus)
        .attr('width', 28)
        .attr('height', 28);
      const div = document.createElement('div');
      div.className =
        'w-7 h-7 p-[3px] flex items-center justify-center rounded bg-gray-300 hover:bg-gray-400 border border-gray-400 cursor-pointer';
      div.innerHTML = getIconSVG(
        'plus',
        'w-7 h-7 text-[1.3rem] flex items-center justify-center'
      );
      fo.node().appendChild(div);
      div.addEventListener('mouseover', function (event) {
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip
          .html('<strong>Ajouter une transformation</strong>')
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      });
      div.addEventListener('mouseout', function () {
        tooltip.transition().duration(500).style('opacity', 0);
      });
      div.addEventListener('click', function (event) {
        event.stopPropagation();

        // Construire le path selon notre logique
        let path = ['main', 'transformations']; // fallback racine

        // Si le nœud a des transformations appliquées, prendre la dernière (transformation parente)
        if (
          d.transformations_appliquees &&
          d.transformations_appliquees.length > 0
        ) {
          const lastTransfo =
            d.transformations_appliquees[
              d.transformations_appliquees.length - 1
            ];
          if (
            lastTransfo &&
            lastTransfo._path &&
            typeof lastTransfo._index === 'number'
          ) {
            // Si c'est un coproduit (nom commence par "Reste"), pointer vers le coproduit
            if (d.name && d.name.startsWith('Reste')) {
              path = [
                ...lastTransfo._path,
                lastTransfo._index,
                'scenario',
                'coproduct_scenario',
                'transformations',
              ];
            } else {
              // Sinon, pointer vers le sous-scénario
              path = [
                ...lastTransfo._path,
                lastTransfo._index,
                'scenario',
                'transformations',
              ];
            }
          }
        }

        const ref = {
          nodeId: d.id,
          dimension: dimension,
          path: path,
        };
        if (window.afficherPopupTransfo)
          window.afficherPopupTransfo(ref, 'add');
      });

      return; // On ne fait rien d'autre
    }
  }

  // 1. Identifier les nœuds feuilles avec un target
  const leafNodesWithTarget = nodes.filter(
    n => n.lot && n.lot.target && !links.some(l => l.source === n.id)
  );

  // 2. Lister tous les targets uniques
  const uniqueTargets = [
    ...new Set(leafNodesWithTarget.map(n => n.lot.target)),
  ];

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
      depth: maxNodeDepth + 1,
    };
  });

  // 4. Pour chaque feuille avec target, créer un lien vers le nœud destination
  const newLinks = [];
  leafNodesWithTarget.forEach(leaf => {
    newLinks.push({
      source: String(leaf.id),
      target: 'target_' + leaf.lot.target,
      value: leaf.lot.total,
    });
  });

  // 5. Ajouter ces nœuds et liens à la structure
  nodes = [...nodes, ...targetNodes];
  links = [
    ...links.filter(l => !leafNodesWithTarget.some(n => n.id === l.source)), // on retire les liens sortants des feuilles valorisées
    ...newLinks,
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

  const sankey = d3
    .sankey()
    .nodeWidth(stackbarWidth + extraBlockWidth)
    .nodePadding(10)
    .extent([
      [horizontalPadding, 0],
      [width - horizontalPadding, height],
    ])
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
  const dynamicWidth = Math.max(
    minWidth,
    (stackbarWidth + extraBlockWidth) * (maxDepth + 1) + 40
  );
  svg.attr('width', dynamicWidth);

  // Calcul des totaux par target
  const targetTotals = {};
  nodes.forEach(node => {
    if (node.lot && node.lot.target) {
      targetTotals[node.lot.target] =
        (targetTotals[node.lot.target] || 0) + node.lot.total;
    }
  });

  // Création des liens
  svg
    .append('g')
    .selectAll('path')
    .data(sankeyLinks)
    .join('path')
    .attr('class', 'link')
    .attr('d', d3.sankeyLinkHorizontal())
    .attr('stroke-width', d => Math.max(1, d.width))
    .style('stroke', '#000')
    .style('stroke-opacity', 0.18);

  // Création des nœuds
  const node = svg
    .append('g')
    .selectAll('g')
    .data(sankeyNodes)
    .join('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);

  // Ajout des rectangles pour les nœuds avec stackbars
  node.each(function (d) {
    const nodeGroup = d3.select(this);
    const nodeHeight = d.y1 - d.y0;

    // Stackbar (à gauche du nœud)
    nodeGroup
      .append('rect')
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
      nodeGroup
        .append('rect')
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

    // Affichage des segments stackbar avec couleur du JSON
    sortedEntries.forEach(([key, value]) => {
      const height = sum > 0 ? (value / sum) * nodeHeight : 0;
      // Chercher la couleur dans le JSON du lot
      let color = '#bbb';
      if (
        dimension === 'format' &&
        d.lot.formats &&
        d.lot.formats[key] &&
        d.lot.formats[key].color
      ) {
        color = d.lot.formats[key].color;
      } else if (
        (dimension === 'type' || dimension === 'format_type') &&
        d.lot.formats
      ) {
        // Trouver le type dans chaque format
        Object.values(d.lot.formats).forEach(formatObj => {
          if (
            formatObj.types &&
            formatObj.types[key] &&
            formatObj.types[key].color
          ) {
            color = formatObj.types[key].color;
          }
        });
      } else if (dimension === 'matiere' && d.lot.formats) {
        Object.values(d.lot.formats).forEach(formatObj => {
          if (formatObj.types) {
            Object.values(formatObj.types).forEach(typeObj => {
              if (
                typeObj.matieres &&
                typeObj.matieres[key] &&
                typeObj.matieres[key].color
              ) {
                color = typeObj.matieres[key].color;
              }
            });
          }
        });
      } else if (dimension === 'fibres' && d.lot.formats) {
        Object.values(d.lot.formats).forEach(formatObj => {
          if (formatObj.types) {
            Object.values(formatObj.types).forEach(typeObj => {
              if (typeObj.matieres) {
                Object.values(typeObj.matieres).forEach(matiereObj => {
                  if (
                    matiereObj.fibres &&
                    matiereObj.fibres[key] &&
                    matiereObj.fibres[key].color
                  ) {
                    color = matiereObj.fibres[key].color;
                  }
                });
              }
            });
          }
        });
      } else if (dimension === 'couleur' && d.lot.formats) {
        Object.values(d.lot.formats).forEach(formatObj => {
          if (formatObj.types) {
            Object.values(formatObj.types).forEach(typeObj => {
              if (
                typeObj.couleurs &&
                typeObj.couleurs[key] &&
                typeObj.couleurs[key].color
              ) {
                color = typeObj.couleurs[key].color;
              }
            });
          }
        });
      } else if (
        dimension === 'qualite' &&
        d.lot.qualite &&
        d.lot.qualite[key] &&
        d.lot.qualite[key].color
      ) {
        color = d.lot.qualite[key].color;
      } else if (
        dimension === 'proprete' &&
        d.lot.proprete &&
        d.lot.proprete[key] &&
        d.lot.proprete[key].color
      ) {
        color = d.lot.proprete[key].color;
      } else if (dimension === 'perturbateurs' && d.lot.formats) {
        Object.values(d.lot.formats).forEach(formatObj => {
          if (formatObj.types) {
            Object.values(formatObj.types).forEach(typeObj => {
              if (
                typeObj.perturbateurs &&
                typeObj.perturbateurs[key] &&
                typeObj.perturbateurs[key].color
              ) {
                color = typeObj.perturbateurs[key].color;
              }
            });
          }
        });
      }
      const fillColorStr = color + (color.length === 7 ? '99' : ''); // Opacité 60% si hex, sinon rgba déjà
      const strokeColorStr = color;
      const isUnknown =
        key.toLowerCase() === 'inconnu' || key.toLowerCase() === 'autre';
      nodeGroup
        .append('rect')
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
        .on('mouseover', function () {
          let tooltipContent = component
            ? component.getTooltipContent(d.lot, key, value, d.lot.total)
            : '';
          tooltip.transition().duration(200).style('opacity', 0.9);
          const svgRect = svg.node().ownerSVGElement.getBoundingClientRect();
          const rect = this.getBoundingClientRect();
          const offsetX = rect.left - svgRect.left;
          const offsetY = rect.top - svgRect.top;
          tooltip
            .html(tooltipContent)
            .style('left', svgRect.left + offsetX + 'px')
            .style('top', svgRect.top + offsetY + 'px');
          // Highlight links
          svg
            .selectAll('.link')
            .transition()
            .duration(100)
            .style('stroke-opacity', l => {
              // Si le target est un nœud merged (isTarget), on regarde le lot source
              const isMergedTarget = l.target.isTarget;
              const lotToCheck = isMergedTarget
                ? l.source.lot || {}
                : l.target.lot || {};
              if (dimension === 'format') {
                return lotToCheck.formats &&
                  Object.keys(lotToCheck.formats).includes(key)
                  ? 0.7
                  : 0.18;
              }
              if (dimension === 'format_type' || dimension === 'type') {
                const hasType = lot =>
                  Object.values(lot.formats || {}).some(
                    f => f.types && Object.keys(f.types).includes(key)
                  );
                return hasType(lotToCheck) ? 0.7 : 0.18;
              }
              if (dimension === 'matiere') {
                const hasMatiere = lot =>
                  Object.values(lot.formats || {}).some(
                    f =>
                      f.types &&
                      Object.values(f.types).some(
                        t => t.matieres && Object.keys(t.matieres).includes(key)
                      )
                  );
                return hasMatiere(lotToCheck) ? 0.7 : 0.18;
              }
              if (dimension === 'fibres') {
                const hasFibre = lot =>
                  Object.values(lot.formats || {}).some(
                    f =>
                      f.types &&
                      Object.values(f.types).some(
                        t =>
                          t.matieres &&
                          Object.values(t.matieres).some(
                            m => m.fibres && Object.keys(m.fibres).includes(key)
                          )
                      )
                  );
                return hasFibre(lotToCheck) ? 0.7 : 0.18;
              }
              if (dimension === 'couleur') {
                const hasCouleur = lot =>
                  Object.values(lot.formats || {}).some(
                    f =>
                      f.types &&
                      Object.values(f.types).some(
                        t => t.couleurs && Object.keys(t.couleurs).includes(key)
                      )
                  );
                return hasCouleur(lotToCheck) ? 0.7 : 0.18;
              }
              if (dimension === 'qualite') {
                return lotToCheck.qualite &&
                  Object.keys(lotToCheck.qualite).includes(key)
                  ? 0.7
                  : 0.18;
              }
              if (dimension === 'proprete') {
                return lotToCheck.proprete &&
                  Object.keys(lotToCheck.proprete).includes(key)
                  ? 0.7
                  : 0.18;
              }
              if (dimension === 'perturbateurs') {
                const hasPerturbateur = lot =>
                  Object.values(lot.formats || {}).some(
                    f =>
                      f.types &&
                      Object.values(f.types).some(
                        t =>
                          t.perturbateurs &&
                          Object.keys(t.perturbateurs).includes(key)
                      )
                  );
                return hasPerturbateur(lotToCheck) ? 0.7 : 0.18;
              }
              return 0.18;
            });
        })
        .on('mouseout', function () {
          tooltip.transition().duration(500).style('opacity', 0);
          // Reset links
          svg
            .selectAll('.link')
            .transition()
            .duration(100)
            .style('stroke-opacity', 0.18);
        });
      yOffset += height;
    });

    // Bloc à droite de la stackbar
    nodeGroup
      .append('rect')
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
      .on('mouseover', function (event) {
        const component = stackbarComponents[dimension];
        // Vérifier si c'est un nœud target
        if (d.isTarget) {
          tooltip.transition().duration(200).style('opacity', 0.9);
          tooltip
            .html(
              `
                        <strong>${d.name}</strong><br/>
                        <span style='font-size:12px;color:#666;'>Nœud destination</span>
                    `
            )
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 28 + 'px');
        } else {
          const dimensionValues = component
            ? component.getStackValues(d.lot)
            : {};
          const sumPct = Object.values(dimensionValues).reduce(
            (a, b) => a + b,
            0
          );
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

          tooltip.transition().duration(200).style('opacity', 0.9);
          tooltip
            .html(
              `
                        <strong>${d.name}</strong><br/>
                        Poids du lot : ${Math.round(d.lot.total)} kg<br/>
                        <span style='font-size:12px;color:#666;'>Somme des % stackbar : ${sumPct.toFixed(1)}%</span>
                        ${missingInfo}
                        ${targetInfo}
                    `
            )
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 28 + 'px');
        }
      })
      .on('mouseout', function () {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // 1. Icônes pour les liens sortants (fork)
    const outgoingLinks = sankeyLinks.filter(
      l => l.source.id === d.id && !l.target.name.startsWith('Reste')
    );
    if (!(d.lot && d.lot.target) && !d.isTarget) {
      outgoingLinks.forEach(link => {
        const linkY = link.y0 - d.y0;
        const fo = nodeGroup
          .append('foreignObject')
          .attr('x', stackbarWidth + (extraBlockWidth - 28) / 2)
          .attr('y', linkY - 14)
          .attr('width', 28)
          .attr('height', 28);
        const div = document.createElement('div');
        const isFork = !!link.transformation; // La transformation est sur le lien sortant
        div.className =
          'w-7 h-7 p-[3px] flex items-center justify-center rounded bg-gray-300 hover:bg-gray-400 border border-gray-400 cursor-pointer';
        div.innerHTML = getIconSVG(
          isFork ? 'arrows-split' : 'plus',
          'w-7 h-7 text-[1.3rem] flex items-center justify-center'
        );
        fo.node().appendChild(div);

        // Dropdown menu state
        let dropdownMenu = null;
        let dropdownOpen = false;
        let closeDropdown = () => {
          if (dropdownMenu) {
            dropdownMenu.remove();
            dropdownMenu = null;
            dropdownOpen = false;
          }
          document.removeEventListener('mousedown', onClickOutside);
        };
        let onClickOutside = e => {
          if (
            dropdownMenu &&
            !dropdownMenu.contains(e.target) &&
            e.target !== div
          ) {
            closeDropdown();
          }
        };

        div.addEventListener('mouseover', function (event) {
          tooltip.transition().duration(200).style('opacity', 0.9);
          let tooltipContent = '';
          if (isFork && link.transformation) {
            // Utilise la transformation du lien sortant
            const transfo = link.transformation;
            const type = Array.isArray(transfo.type)
              ? transfo.type[0]
              : transfo.type;
            const label =
              transfo.title ||
              (window.transformationUtils
                ? window.transformationUtils.getTransformationLabel(type)
                : type);
            const typeLabel = window.transformationUtils
              ? window.transformationUtils.getTransformationLabel(type)
              : type;
            let params = '';
            if (transfo.keys && transfo.keys.length && transfo.keys[0].length) {
              params += `<div>Clés : <span class='font-mono text-xs'>${transfo.keys[0].join(', ')}</span></div>`;
            }
            if (transfo.scenario && transfo.scenario.target) {
              params += `<div>Cible : <span class='font-mono text-xs'>${transfo.scenario.target}</span></div>`;
            }
            tooltipContent = `<strong>${label}</strong><div class='text-xs text-gray-500 mb-1'>${typeLabel}</div>${params ? '<br/>' + params : ''}`;
          } else {
            tooltipContent = '<strong>Ajouter une transformation</strong>';
          }
          tooltip
            .html(tooltipContent)
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 28 + 'px');
        });
        div.addEventListener('mouseout', function () {
          tooltip.transition().duration(500).style('opacity', 0);
        });
        div.addEventListener('click', function (event) {
          event.stopPropagation();
          if (!isFork) {
            // Comportement + classique
            const chemin = `${d.name} → ${link.target.name}`;
            const ref = {
              nodeId: d.id,
              dimension: dimension,
              lot: {
                ...d.lot,
                transformations_appliquees: d.transformations_appliquees,
              },
              chemin: chemin,
              link: {
                ...link,
                target: {
                  ...link.target,
                  name: link.target.name.split('→')[0].trim(),
                },
              },
              transformation: link.transformation || null,
            };
            if (window.afficherPopupTransfo)
              window.afficherPopupTransfo(ref, 'add');
            return;
          }
          // Toggle dropdown
          if (dropdownOpen) {
            closeDropdown();
            return;
          }
          // Créer le menu dropdown
          dropdownMenu = document.createElement('div');
          dropdownMenu.className =
            'absolute z-50 mt-2 right-0 bg-white rounded-xl shadow-xl py-2 flex flex-col gap-1 border border-gray-200'; // min-w supprimé
          dropdownMenu.style.width = '170px'; // Largeur fixe, lisible, style shadcn/ui
          dropdownMenu.style.position = 'absolute';
          dropdownMenu.style.padding = '0';
          dropdownMenu.style.overflow = 'hidden'; // Empêche tout débordement
          const rect = div.getBoundingClientRect();
          dropdownMenu.style.top = rect.bottom + window.scrollY + 'px';
          dropdownMenu.style.left = rect.right - stackbarWidth - 28 + 'px';
          // Génération dynamique du menu avec désactivation Monter/Descendre
          const isFirst = outgoingLinks.indexOf(link) === 0;
          const isLast =
            outgoingLinks.indexOf(link) === outgoingLinks.length - 1;
          dropdownMenu.innerHTML = `
            <button class="dropdown-btn" data-action="edit">
              <i class="ph ph-pencil-simple" style="font-size:1.1em;display:flex;align-items:center;"></i> Modifier
            </button>
            <button class="dropdown-btn" data-action="up" ${isFirst ? 'disabled' : ''}>
              <i class="ph ph-arrow-up" style="font-size:1.1em;display:flex;align-items:center;"></i> Monter
            </button>
            <button class="dropdown-btn" data-action="down" ${isLast ? 'disabled' : ''}>
              <i class="ph ph-arrow-down" style="font-size:1.1em;display:flex;align-items:center;"></i> Descendre
            </button>
            <button class="dropdown-btn" data-action="delete">
              <i class="ph ph-trash" style="font-size:1.1em;display:flex;align-items:center;"></i> Effacer
            </button>
          `;
          // Appliquer le style inline sur chaque bouton
          dropdownMenu.querySelectorAll('.dropdown-btn').forEach(btn => {
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'flex-start';
            btn.style.gap = '0.7em';
            btn.style.width = '100%';
            btn.style.boxSizing = 'border-box';
            btn.style.background = 'none';
            btn.style.border = 'none';
            btn.style.outline = 'none';
            btn.style.fontSize = '1rem';
            btn.style.fontWeight = '500';
            btn.style.padding = '0.65em 0.8em'; // padding horizontal réduit
            btn.style.borderRadius = '0.7em';
            btn.style.transition =
              'background 0.13s, color 0.13s, box-shadow 0.13s';
            btn.style.cursor = btn.disabled ? 'not-allowed' : 'pointer';
            btn.style.color = '#23272f';
            if (btn.dataset.action === 'delete') {
              btn.style.color = '#dc2626';
            }
            btn.onmouseover = function () {
              if (btn.disabled) return;
              if (btn.dataset.action === 'delete') {
                btn.style.background = '#fff1f2';
                btn.style.color = '#b91c1c';
              } else {
                btn.style.background = '#eaf3ff';
                btn.style.color = '#1d4ed8';
              }
            };
            btn.onmouseout = function () {
              btn.style.background = 'none';
              btn.style.color =
                btn.dataset.action === 'delete' ? '#dc2626' : '#23272f';
            };
            btn.onfocus = btn.onmouseover;
            btn.onblur = btn.onmouseout;
          });
          document.body.appendChild(dropdownMenu);
          dropdownOpen = true;
          // Handler pour Modifier
          dropdownMenu.querySelector('[data-action="edit"]').onclick =
            function (e) {
              e.stopPropagation();
              closeDropdown();
              const chemin = `${d.name} → ${link.target.name}`;
              const ref = {
                nodeId: d.id,
                dimension: dimension,
                lot: {
                  ...d.lot,
                  transformations_appliquees: d.transformations_appliquees,
                },
                chemin: chemin,
                link: {
                  ...link,
                  target: {
                    ...link.target,
                    name: link.target.name.split('→')[0].trim(),
                  },
                },
                transformation: link.transformation || null,
              };
              if (window.afficherPopupTransfo)
                window.afficherPopupTransfo(ref, 'edit');
            };
          // Handler pour Effacer
          dropdownMenu.querySelector('[data-action="delete"]').onclick =
            function (e) {
              e.stopPropagation();
              closeDropdown();
              // Suppression immédiate, sans confirm
              // Trouver le scénario courant
              const scenarioIdx = window.currentScenarioIdx;
              const scenario = window.scenarios[scenarioIdx]?.scenario;
              // Trouver le path et l'index de la transformation à supprimer
              let path = link.transformation && link.transformation._path;
              let index = link.transformation && link.transformation._index;
              if (!path || typeof index !== 'number') {
                const lastTransfo =
                  d.transformations_appliquees &&
                  d.transformations_appliquees.length
                    ? d.transformations_appliquees[
                        d.transformations_appliquees.length - 1
                      ]
                    : null;
                if (
                  lastTransfo &&
                  lastTransfo._path &&
                  typeof lastTransfo._index === 'number'
                ) {
                  path = lastTransfo._path;
                  index = lastTransfo._index;
                } else {
                  alert(
                    'Impossible de retrouver la position de la transformation à supprimer.'
                  );
                  return;
                }
              }
              if (!scenario || !path || typeof index !== 'number') {
                alert(
                  'Erreur lors de la suppression : informations manquantes.'
                );
                return;
              }
              if (typeof window.removeTransformation === 'function') {
                window.removeTransformation(scenario, path, index);
              } else if (typeof removeTransformation === 'function') {
                removeTransformation(scenario, path, index);
              } else {
                alert('Fonction removeTransformation non trouvée.');
                return;
              }
              // Relancer le Sankey
              const lot = window.lotType;
              const dimension = window.currentDimension;
              if (typeof runSankey === 'function' && lot && scenario) {
                runSankey({
                  lot,
                  scenario,
                  containerId: 'sankey-container',
                  dimension,
                });
              }
            };
          // Handler pour Monter
          dropdownMenu.querySelector('[data-action="up"]').onclick = function (
            e
          ) {
            e.stopPropagation();
            closeDropdown();
            if (typeof window.onTransformationMoveUp === 'function') {
              window.onTransformationMoveUp(d.id, link.transformation);
            }
          };
          // Handler pour Descendre
          dropdownMenu.querySelector('[data-action="down"]').onclick =
            function (e) {
              e.stopPropagation();
              closeDropdown();
              if (typeof window.onTransformationMoveDown === 'function') {
                window.onTransformationMoveDown(d.id, link.transformation);
              }
            };
          // Fermer si on clique ailleurs
          setTimeout(() => {
            document.addEventListener('mousedown', onClickOutside);
          }, 0);
        });
      });
    }

    // 2. Icône + sur le lien "Reste" (coproduit)
    const resteLinks = sankeyLinks.filter(
      l => l.source.id === d.id && l.target.name.startsWith('Reste')
    );
    resteLinks.forEach(link => {
      const linkY = link.y0 - d.y0;
      const fo = nodeGroup
        .append('foreignObject')
        .attr('x', stackbarWidth + (extraBlockWidth - 28) / 2)
        .attr('y', linkY - 14)
        .attr('width', 28)
        .attr('height', 28);
      const div = document.createElement('div');
      div.className =
        'w-7 h-7 p-[3px] flex items-center justify-center rounded bg-gray-300 hover:bg-gray-400 border border-gray-400 cursor-pointer';
      div.innerHTML = getIconSVG(
        'plus',
        'w-7 h-7 text-[1.3rem] flex items-center justify-center'
      );
      fo.node().appendChild(div);
      div.addEventListener('mouseover', function (event) {
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip
          .html('<strong>Ajouter une transformation</strong>')
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      });
      div.addEventListener('mouseout', function () {
        tooltip.transition().duration(500).style('opacity', 0);
      });
      div.addEventListener('click', function (event) {
        event.stopPropagation();

        // Construire le path selon notre logique
        let path = ['main', 'transformations']; // fallback racine

        // Si le nœud a des transformations appliquées, prendre la dernière (transformation parente)
        if (
          d.transformations_appliquees &&
          d.transformations_appliquees.length > 0
        ) {
          const lastTransfo =
            d.transformations_appliquees[
              d.transformations_appliquees.length - 1
            ];
          if (
            lastTransfo &&
            lastTransfo._path &&
            typeof lastTransfo._index === 'number'
          ) {
            // Si c'est un coproduit (nom commence par "Reste"), pointer vers le coproduit
            if (d.name && d.name.startsWith('Reste')) {
              path = [
                ...lastTransfo._path,
                lastTransfo._index,
                'scenario',
                'coproduct_scenario',
                'transformations',
              ];
            } else {
              // Sinon, pointer vers le sous-scénario
              path = [
                ...lastTransfo._path,
                lastTransfo._index,
                'scenario',
                'transformations',
              ];
            }
          }
        }

        const ref = {
          nodeId: d.id,
          dimension: dimension,
          path: path,
        };
        if (window.afficherPopupTransfo)
          window.afficherPopupTransfo(ref, 'add');
      });
    });

    // 3. Icône + sur les nœuds feuilles sans target (aucun lien sortant)
    const hasOutgoing = sankeyLinks.some(l => l.source.id === d.id);
    if (!hasOutgoing && !(d.lot && d.lot.target) && !d.isTarget) {
      const yPlus = nodeHeight / 2 - 14;
      const fo = nodeGroup
        .append('foreignObject')
        .attr('x', stackbarWidth + (extraBlockWidth - 28) / 2)
        .attr('y', yPlus)
        .attr('width', 28)
        .attr('height', 28);
      const div = document.createElement('div');
      div.className =
        'w-7 h-7 p-[3px] flex items-center justify-center rounded bg-gray-300 hover:bg-gray-400 border border-gray-400 cursor-pointer';
      div.innerHTML = getIconSVG(
        'plus',
        'w-7 h-7 text-[1.3rem] flex items-center justify-center'
      );
      fo.node().appendChild(div);
      div.addEventListener('mouseover', function (event) {
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip
          .html('<strong>Ajouter une transformation</strong>')
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      });
      div.addEventListener('mouseout', function () {
        tooltip.transition().duration(500).style('opacity', 0);
      });
      div.addEventListener('click', function (event) {
        event.stopPropagation();

        // Construire le path selon notre logique
        let path = ['main', 'transformations']; // fallback racine

        // Si le nœud a des transformations appliquées, prendre la dernière (transformation parente)
        if (
          d.transformations_appliquees &&
          d.transformations_appliquees.length > 0
        ) {
          const lastTransfo =
            d.transformations_appliquees[
              d.transformations_appliquees.length - 1
            ];
          if (
            lastTransfo &&
            lastTransfo._path &&
            typeof lastTransfo._index === 'number'
          ) {
            // Si c'est un coproduit (nom commence par "Reste"), pointer vers le coproduit
            if (d.name && d.name.startsWith('Reste')) {
              path = [
                ...lastTransfo._path,
                lastTransfo._index,
                'scenario',
                'coproduct_scenario',
                'transformations',
              ];
            } else {
              // Sinon, pointer vers le sous-scénario
              path = [
                ...lastTransfo._path,
                lastTransfo._index,
                'scenario',
                'transformations',
              ];
            }
          }
        }

        const ref = {
          nodeId: d.id,
          dimension: dimension,
          path: path,
        };
        if (window.afficherPopupTransfo)
          window.afficherPopupTransfo(ref, 'add');
      });
    }

    // 4. Icône check sur les nœuds valorisés ou agglomérés (isTarget)
    if ((d.lot && d.lot.target) || d.isTarget) {
      const yCheck = nodeHeight / 2 - 14;
      const fo = nodeGroup
        .append('foreignObject')
        .attr('x', stackbarWidth + (extraBlockWidth - 28) / 2)
        .attr('y', yCheck)
        .attr('width', 28)
        .attr('height', 28);
      const div = document.createElement('div');
      div.className =
        'w-7 h-7 p-[3px] flex items-center justify-center rounded bg-green-100 hover:bg-green-200 border border-green-400 cursor-pointer';
      div.innerHTML = getIconSVG(
        'check-circle',
        'w-7 h-7 text-[1.3rem] flex items-center justify-center text-green-600'
      );
      fo.node().appendChild(div);
      div.addEventListener('mouseover', function (event) {
        tooltip.transition().duration(200).style('opacity', 0.9);
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
                const poids = d.lot.total
                  ? Math.round((d.lot.total * value) / 100)
                  : 0;
                distributionHtml += `${key} : ${value.toFixed(1)}% (${poids} kg)<br/>`;
              });
            distributionHtml += '</div>';
          }
        }
        tooltip
          .html(
            `
                        <strong>Destination validée</strong><br/>
                        Target: ${d.lot && d.lot.target ? d.lot.target : d.name}<br/>
                        <span style='font-size:12px;color:#666;'>Poids du lot: ${d.lot ? Math.round(d.lot.total) : ''} kg</span>
                        ${distributionHtml}
                    `
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      });
      div.addEventListener('mouseout', function () {
        tooltip.transition().duration(500).style('opacity', 0);
      });
    }
  });

  // Ajout d'un calque dédié pour les titres, après tous les nœuds
  svg.selectAll('.titles-layer').remove();
  const titlesLayer = svg.append('g').attr('class', 'titles-layer');
  sankeyNodes.forEach(d => {
    titlesLayer
      .append('text')
      .attr('class', 'lot-title')
      .attr('x', (d.x0 + d.x1) / 2 - extraBlockWidth / 2)
      .attr('y', d.y0 - 8)
      .attr('text-anchor', 'middle')
      .text(d.lot && d.lot.title ? d.lot.title : d.name)
      .style('font-size', '11px')
      .style('fill', '#666')
      .style('pointer-events', 'none');
  });
}

// Gestion du changement de dimension
// SUPPRIMÉ: document.getElementById('dimension-selector').addEventListener('change', function(e) {
//     updateSankey(e.target.value);
// });

// Initialisation avec la première dimension
// SUPPRIMÉ: document.getElementById('dimension-selector').value = 'format';

// Gestion du redimensionnement
window.addEventListener('resize', function () {
  width = window.innerWidth - margin.left - margin.right;
  height =
    document.getElementById('sankey-container').offsetHeight -
    margin.top -
    margin.bottom;
  svg
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
  updateSankey(window.currentDimension);
});

// Fonction principale pour lancer le Sankey depuis le HTML
function runSankey({ lot, scenario, dimension = 'format' }) {
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

// Callback global pour la sauvegarde des transformations
window.onTransformationSave = (nodeId, transformation) => {
  console.log('onTransformationSave called:', { nodeId, transformation });

  // Trouver le scénario courant
  const scenarioIdx = window.currentScenarioIdx;
  const scenario = window.scenarios[scenarioIdx]?.scenario;
  if (!scenario) {
    console.error('No scenario found');
    return;
  }

  // Trouver le nœud et mettre à jour sa transformation
  let path = null;
  let index = null;

  // Parcourir les transformations pour trouver le bon nœud
  const findTransformation = (
    transformations,
    currentPath = ['main', 'transformations']
  ) => {
    if (!transformations) return false;
    for (let i = 0; i < transformations.length; i++) {
      const t = transformations[i];

      // Si on trouve le nœud, on met à jour la transformation
      if (t._nodeId === nodeId) {
        path = currentPath;
        index = i;
        return true;
      }

      // Sinon on cherche dans les sous-scénarios
      if (t.scenario?.transformations) {
        if (
          findTransformation(t.scenario.transformations, [
            ...currentPath,
            i,
            'scenario',
            'transformations',
          ])
        ) {
          return true;
        }
      }
    }
    return false;
  };

  findTransformation(scenario.transformations);

  console.log('Found path and index:', { path, index });

  if (path && typeof index === 'number') {
    // Mettre à jour la transformation en gardant les métadonnées
    window.updateTransformation(scenario, path, index, {
      ...transformation,
      _nodeId: nodeId, // Garder le nodeId
    });

    // Relancer le Sankey
    const lot = window.lotType;
    const dimension = window.currentDimension;
    if (typeof runSankey === 'function' && lot && scenario) {
      runSankey({ lot, scenario, containerId: 'sankey-container', dimension });
    }
  } else {
    console.error('Could not find transformation to update');
  }
};

// Callback global pour l'ajout de transformations
window.onTransformationAdd = (nodeId, transformation) => {
  console.log('onTransformationAdd called:', { nodeId, transformation });

  // Trouver le scénario courant
  const scenarioIdx = window.currentScenarioIdx;
  const scenario = window.scenarios[scenarioIdx]?.scenario;
  if (!scenario) {
    console.error('No scenario found');
    return;
  }

  // Utiliser le path fourni dans la transformation ou le path par défaut
  const path = transformation._path || ['main', 'transformations'];
  console.log('Using path:', path);

  // Ajouter la transformation
  window.addTransformation(scenario, path, {
    ...transformation,
    _nodeId: nodeId,
  });

  // Relancer le Sankey
  const lot = window.lotType;
  const dimension = window.currentDimension;
  if (typeof runSankey === 'function' && lot && scenario) {
    runSankey({ lot, scenario, containerId: 'sankey-container', dimension });
  }
};

// Callback global pour monter une transformation
window.onTransformationMoveUp = (nodeId, transformation) => {
  console.log('onTransformationMoveUp called:', { nodeId, transformation });

  // Trouver le scénario courant
  const scenarioIdx = window.currentScenarioIdx;
  const scenario = window.scenarios[scenarioIdx]?.scenario;
  if (!scenario) {
    console.error('No scenario found');
    return;
  }

  // Utiliser le path et l'index de la transformation
  const path = transformation._path;
  const index = transformation._index;

  if (!path || typeof index !== 'number') {
    console.error('Invalid path or index for move up');
    return;
  }

  // Déplacer la transformation
  window.moveTransformationUp(scenario, path, index);

  // Relancer le Sankey
  const lot = window.lotType;
  const dimension = window.currentDimension;
  if (typeof runSankey === 'function' && lot && scenario) {
    runSankey({ lot, scenario, containerId: 'sankey-container', dimension });
  }
};

// Callback global pour descendre une transformation
window.onTransformationMoveDown = (nodeId, transformation) => {
  console.log('onTransformationMoveDown called:', { nodeId, transformation });

  // Trouver le scénario courant
  const scenarioIdx = window.currentScenarioIdx;
  const scenario = window.scenarios[scenarioIdx]?.scenario;
  if (!scenario) {
    console.error('No scenario found');
    return;
  }

  // Utiliser le path et l'index de la transformation
  const path = transformation._path;
  const index = transformation._index;

  if (!path || typeof index !== 'number') {
    console.error('Invalid path or index for move down');
    return;
  }

  // Déplacer la transformation
  window.moveTransformationDown(scenario, path, index);

  // Relancer le Sankey
  const lot = window.lotType;
  const dimension = window.currentDimension;
  if (typeof runSankey === 'function' && lot && scenario) {
    runSankey({ lot, scenario, containerId: 'sankey-container', dimension });
  }
};

// Initialisation automatique quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function () {
  initializeFromUrl();
});

// Écouter les changements d'URL pour recharger le Sankey
window.addEventListener('popstate', function () {
  initializeFromUrl();
});

// Fonction pour mettre à jour le Sankey depuis l'extérieur (React)
window.updateSankeyFromParams = function (params) {
  updateUrlParams(params);
  initializeFromUrl();
};

function mergeLots(lots) {
  // 1. Première passe : calculer les masses totales
  const masses = {
    total: 0,
    formats: {},
    types: {},
    matieres: {},
    couleurs: {},
    fibres: {},
    perturbateurs: {},
    qualites: {},
    propres: {},
  };

  lots.forEach(lot => {
    masses.total += lot.total;
    Object.entries(lot.formats).forEach(([format, formatObj]) => {
      masses.formats[format] =
        (masses.formats[format] || 0) +
        lot.total * (formatObj.pourcentage / 100);
      Object.entries(formatObj.types).forEach(([type, typeObj]) => {
        masses.types[type] =
          (masses.types[type] || 0) +
          lot.total *
            (formatObj.pourcentage / 100) *
            (typeObj.pourcentage / 100);
        // Matières
        Object.entries(typeObj.matieres || {}).forEach(
          ([matiere, matiereObj]) => {
            masses.matieres[matiere] =
              (masses.matieres[matiere] || 0) +
              lot.total *
                (formatObj.pourcentage / 100) *
                (typeObj.pourcentage / 100) *
                (matiereObj.pourcentage / 100);
            // Fibres
            Object.entries(matiereObj.fibres || {}).forEach(
              ([fibre, fibreObj]) => {
                masses.fibres[fibre] =
                  (masses.fibres[fibre] || 0) +
                  lot.total *
                    (formatObj.pourcentage / 100) *
                    (typeObj.pourcentage / 100) *
                    (matiereObj.pourcentage / 100) *
                    (fibreObj.pourcentage / 100);
              }
            );
          }
        );
        // Couleurs
        Object.entries(typeObj.couleurs || {}).forEach(
          ([couleur, couleurObj]) => {
            masses.couleurs[couleur] =
              (masses.couleurs[couleur] || 0) +
              lot.total *
                (formatObj.pourcentage / 100) *
                (typeObj.pourcentage / 100) *
                (couleurObj.pourcentage / 100);
          }
        );
        // Perturbateurs
        Object.entries(typeObj.perturbateurs || {}).forEach(
          ([perturbateur, perturbateurObj]) => {
            masses.perturbateurs[perturbateur] =
              (masses.perturbateurs[perturbateur] || 0) +
              lot.total *
                (formatObj.pourcentage / 100) *
                (typeObj.pourcentage / 100) *
                (perturbateurObj.pourcentage / 100);
          }
        );
        // Qualités
        Object.entries(typeObj.qualites || {}).forEach(
          ([qualite, qualiteObj]) => {
            masses.qualites[qualite] =
              (masses.qualites[qualite] || 0) +
              lot.total *
                (formatObj.pourcentage / 100) *
                (typeObj.pourcentage / 100) *
                (qualiteObj.pourcentage / 100);
          }
        );
        // Propres
        Object.entries(typeObj.propres || {}).forEach(([propre, propreObj]) => {
          masses.propres[propre] =
            (masses.propres[propre] || 0) +
            lot.total *
              (formatObj.pourcentage / 100) *
              (typeObj.pourcentage / 100) *
              (propreObj.pourcentage / 100);
        });
      });
    });
  });

  const total = masses.total;

  // 2. Deuxième passe : reconstruire la structure avec les pourcentages calculés
  const result = {
    total,
    formats: {},
  };

  // Formats
  Object.entries(masses.formats).forEach(([format, masse]) => {
    // Chercher la couleur dans les lots fusionnés
    let formatColor = null;
    lots.forEach(lot => {
      if (lot.formats && lot.formats[format] && lot.formats[format].color)
        formatColor = lot.formats[format].color;
    });
    result.formats[format] = {
      pourcentage: (masse / total) * 100,
      types: {},
    };
    if (formatColor) result.formats[format].color = formatColor;

    // Types pour ce format
    const typesInFormat = new Set();
    lots.forEach(lot => {
      if (lot.formats && lot.formats[format] && lot.formats[format].types) {
        Object.keys(lot.formats[format].types).forEach(type =>
          typesInFormat.add(type)
        );
      }
    });

    typesInFormat.forEach(type => {
      if (!masses.types[type]) return;
      // Chercher la couleur dans les lots fusionnés
      let typeColor = null;
      lots.forEach(lot => {
        if (
          lot.formats &&
          lot.formats[format] &&
          lot.formats[format].types[type] &&
          lot.formats[format].types[type].color
        )
          typeColor = lot.formats[format].types[type].color;
      });
      result.formats[format].types[type] = {
        pourcentage: (masses.types[type] / masse) * 100,
        matieres: {},
        couleurs: {},
        perturbateurs: {},
        qualites: {},
        propres: {},
      };
      if (typeColor) result.formats[format].types[type].color = typeColor;

      // Matières pour ce type
      const matieresInType = new Set();
      lots.forEach(lot => {
        if (
          lot.formats &&
          lot.formats[format] &&
          lot.formats[format].types[type] &&
          lot.formats[format].types[type].matieres
        ) {
          Object.keys(lot.formats[format].types[type].matieres).forEach(
            matiere => matieresInType.add(matiere)
          );
        }
      });

      matieresInType.forEach(matiere => {
        if (!masses.matieres[matiere]) return;
        // Chercher la couleur dans les lots fusionnés
        let matiereColor = null;
        lots.forEach(lot => {
          if (
            lot.formats &&
            lot.formats[format] &&
            lot.formats[format].types[type] &&
            lot.formats[format].types[type].matieres[matiere] &&
            lot.formats[format].types[type].matieres[matiere].color
          )
            matiereColor =
              lot.formats[format].types[type].matieres[matiere].color;
        });

        // Calculer la distribution des fibres
        const fibresAgg = {};
        let fibresSum = 0;
        lots.forEach(lot => {
          if (
            lot.formats &&
            lot.formats[format] &&
            lot.formats[format].types[type] &&
            lot.formats[format].types[type].matieres[matiere] &&
            lot.formats[format].types[type].matieres[matiere].fibres
          ) {
            const matiereObj =
              lot.formats[format].types[type].matieres[matiere];
            const pctMatiere =
              typeof matiereObj.pourcentage === 'number'
                ? matiereObj.pourcentage
                : 100;
            const pctType =
              typeof lot.formats[format].types[type].pourcentage === 'number'
                ? lot.formats[format].types[type].pourcentage
                : 100;
            const pctFormat =
              typeof lot.formats[format].pourcentage === 'number'
                ? lot.formats[format].pourcentage
                : 100;
            Object.entries(matiereObj.fibres).forEach(([fibre, fibreObj]) => {
              const pctFibre =
                typeof fibreObj === 'object' && fibreObj !== null
                  ? fibreObj.pourcentage !== undefined
                    ? fibreObj.pourcentage
                    : fibreObj
                  : fibreObj;
              const pct =
                (pctFibre / 100) *
                (pctMatiere / 100) *
                (pctType / 100) *
                (pctFormat / 100) *
                100;
              fibresAgg[fibre] = (fibresAgg[fibre] || 0) + pct;
              fibresSum += pct;
            });
          }
        });

        // Normaliser les fibres
        const fibresObj = {};
        if (fibresSum > 0) {
          Object.entries(fibresAgg).forEach(([fibre, pct]) => {
            fibresObj[fibre] = {
              pourcentage: (pct / fibresSum) * 100,
            };
            // Chercher la couleur de la fibre dans les lots fusionnés
            lots.forEach(lot => {
              if (
                lot.formats &&
                lot.formats[format] &&
                lot.formats[format].types[type] &&
                lot.formats[format].types[type].matieres[matiere] &&
                lot.formats[format].types[type].matieres[matiere].fibres[
                  fibre
                ] &&
                lot.formats[format].types[type].matieres[matiere].fibres[fibre]
                  .color
              ) {
                fibresObj[fibre].color =
                  lot.formats[format].types[type].matieres[matiere].fibres[
                    fibre
                  ].color;
              }
            });
          });
        }

        result.formats[format].types[type].matieres[matiere] = {
          pourcentage: (masses.matieres[matiere] / masses.types[type]) * 100,
          fibres: fibresObj,
        };
        if (matiereColor)
          result.formats[format].types[type].matieres[matiere].color =
            matiereColor;
      });

      // Couleurs pour ce type
      const couleursInType = new Set();
      lots.forEach(lot => {
        if (
          lot.formats &&
          lot.formats[format] &&
          lot.formats[format].types[type] &&
          lot.formats[format].types[type].couleurs
        ) {
          Object.keys(lot.formats[format].types[type].couleurs).forEach(
            couleur => couleursInType.add(couleur)
          );
        }
      });

      couleursInType.forEach(couleur => {
        if (!masses.couleurs[couleur]) return;
        // Chercher la couleur dans les lots fusionnés
        let couleurColor = null;
        lots.forEach(lot => {
          if (
            lot.formats &&
            lot.formats[format] &&
            lot.formats[format].types[type] &&
            lot.formats[format].types[type].couleurs[couleur] &&
            lot.formats[format].types[type].couleurs[couleur].color
          ) {
            couleurColor =
              lot.formats[format].types[type].couleurs[couleur].color;
          }
        });

        result.formats[format].types[type].couleurs[couleur] = {
          pourcentage: (masses.couleurs[couleur] / masses.types[type]) * 100,
        };
        if (couleurColor)
          result.formats[format].types[type].couleurs[couleur].color =
            couleurColor;
      });

      // Perturbateurs pour ce type
      const perturbateursInType = new Set();
      lots.forEach(lot => {
        if (
          lot.formats &&
          lot.formats[format] &&
          lot.formats[format].types[type] &&
          lot.formats[format].types[type].perturbateurs
        ) {
          Object.keys(lot.formats[format].types[type].perturbateurs).forEach(
            perturbateur => perturbateursInType.add(perturbateur)
          );
        }
      });

      perturbateursInType.forEach(perturbateur => {
        if (!masses.perturbateurs[perturbateur]) return;
        // Chercher la couleur dans les lots fusionnés
        let perturbateurColor = null;
        lots.forEach(lot => {
          if (
            lot.formats &&
            lot.formats[format] &&
            lot.formats[format].types[type] &&
            lot.formats[format].types[type].perturbateurs[perturbateur] &&
            lot.formats[format].types[type].perturbateurs[perturbateur].color
          ) {
            perturbateurColor =
              lot.formats[format].types[type].perturbateurs[perturbateur].color;
          }
        });

        result.formats[format].types[type].perturbateurs[perturbateur] = {
          pourcentage:
            (masses.perturbateurs[perturbateur] / masses.types[type]) * 100,
        };
        if (perturbateurColor)
          result.formats[format].types[type].perturbateurs[perturbateur].color =
            perturbateurColor;
      });

      // Qualités pour ce type
      const qualitesInType = new Set();
      lots.forEach(lot => {
        if (
          lot.formats &&
          lot.formats[format] &&
          lot.formats[format].types[type] &&
          lot.formats[format].types[type].qualites
        ) {
          Object.keys(lot.formats[format].types[type].qualites).forEach(
            qualite => qualitesInType.add(qualite)
          );
        }
      });

      qualitesInType.forEach(qualite => {
        if (!masses.qualites[qualite]) return;
        // Chercher la couleur dans les lots fusionnés
        let qualiteColor = null;
        lots.forEach(lot => {
          if (
            lot.formats &&
            lot.formats[format] &&
            lot.formats[format].types[type] &&
            lot.formats[format].types[type].qualites[qualite] &&
            lot.formats[format].types[type].qualites[qualite].color
          ) {
            qualiteColor =
              lot.formats[format].types[type].qualites[qualite].color;
          }
        });

        result.formats[format].types[type].qualites[qualite] = {
          pourcentage: (masses.qualites[qualite] / masses.types[type]) * 100,
        };
        if (qualiteColor)
          result.formats[format].types[type].qualites[qualite].color =
            qualiteColor;
      });

      // Propres pour ce type
      const propresInType = new Set();
      lots.forEach(lot => {
        if (
          lot.formats &&
          lot.formats[format] &&
          lot.formats[format].types[type] &&
          lot.formats[format].types[type].propres
        ) {
          Object.keys(lot.formats[format].types[type].propres).forEach(propre =>
            propresInType.add(propre)
          );
        }
      });

      propresInType.forEach(propre => {
        if (!masses.propres[propre]) return;
        // Chercher la couleur dans les lots fusionnés
        let propreColor = null;
        lots.forEach(lot => {
          if (
            lot.formats &&
            lot.formats[format] &&
            lot.formats[format].types[type] &&
            lot.formats[format].types[type].propres[propre] &&
            lot.formats[format].types[type].propres[propre].color
          ) {
            propreColor = lot.formats[format].types[type].propres[propre].color;
          }
        });

        result.formats[format].types[type].propres[propre] = {
          pourcentage: (masses.propres[propre] / masses.types[type]) * 100,
        };
        if (propreColor)
          result.formats[format].types[type].propres[propre].color =
            propreColor;
      });
    });
  });

  // Après la fusion des formats/types, fusionner la propreté et la qualité au niveau racine
  // Propreté
  const allPropretes = Array.from(
    new Set(
      lots.flatMap(lot => (lot.proprete ? Object.keys(lot.proprete) : []))
    )
  );
  result.proprete = {};
  allPropretes.forEach(prop => {
    let sum = 0;
    let color = null;
    lots.forEach(lot => {
      if (lot.proprete && lot.proprete[prop]) {
        const val =
          typeof lot.proprete[prop] === 'number'
            ? lot.proprete[prop]
            : lot.proprete[prop].pourcentage || 0;
        sum += (lot.total * val) / 100;
        if (lot.proprete[prop].color) color = lot.proprete[prop].color;
      }
    });
    result.proprete[prop] = {
      pourcentage: (sum / total) * 100,
    };
    if (color) result.proprete[prop].color = color;
  });
  // Qualité
  const allQualites = Array.from(
    new Set(lots.flatMap(lot => (lot.qualite ? Object.keys(lot.qualite) : [])))
  );
  result.qualite = {};
  allQualites.forEach(qual => {
    let sum = 0;
    let color = null;
    lots.forEach(lot => {
      if (lot.qualite && lot.qualite[qual]) {
        const val =
          typeof lot.qualite[qual] === 'number'
            ? lot.qualite[qual]
            : lot.qualite[qual].pourcentage || 0;
        sum += (lot.total * val) / 100;
        if (lot.qualite[qual].color) color = lot.qualite[qual].color;
      }
    });
    result.qualite[qual] = {
      pourcentage: (sum / total) * 100,
    };
    if (color) result.qualite[qual].color = color;
  });

  return result;
}
window.mergeLots = mergeLots;

function applyScenario(
  lot,
  scenario,
  parentNodeId = '0',
  nodes = null,
  links = null,
  idGenObj = null,
  isRoot = true,
  transformations_appliquees = [],
  depth = 0,
  pathNum = '1',
  pathArr = ['main', 'transformations']
) {
  if (!nodes) {
    const lotInit = JSON.parse(JSON.stringify(lot));
    lotInit.titre = 'lot Type';
    nodes = [
      {
        id: parentNodeId,
        name: 'Lot initial',
        lot: lotInit,
        transformations_appliquees: [],
        _path: ['main', 'transformations'],
      },
    ];
  }
  if (!links) links = [];
  if (!idGenObj) idGenObj = { id: 1 };

  let resteLot = JSON.parse(JSON.stringify(lot));
  const parentTotal = lot.total;
  let totalChildren = 0;

  (scenario.transformations || []).forEach((transfo, idx) => {
    let result;
    // Support nouvelle structure : type et keys sont des tableaux
    const type = Array.isArray(transfo.type) ? transfo.type[0] : transfo.type;
    const keys = Array.isArray(transfo.keys) ? transfo.keys[0] : transfo.keys;

    // --- Marquage du path et de l'index sur la transformation ---
    if (!transfo._path) transfo._path = [...pathArr];
    if (typeof transfo._index !== 'number') transfo._index = idx;

    // Log temporaire pour vérifier le marquage
    if (window.DEBUG_TRANSFO_PATH) {
      console.log('TRANSFO PATH/INDEX', transfo._path, transfo._index, transfo);
    }

    if (type === 'selectByFormat') {
      result = window.processes['selectByFormat'](resteLot, keys);
    } else if (type === 'selectByType') {
      result = window.processes['selectByType'](resteLot, keys);
    } else if (type === 'selectByMatiere') {
      result = window.processes['selectByMatiere'](resteLot, keys);
    } else if (type === 'selectByQualite') {
      result = window.processes['selectByQualite'](resteLot, keys);
    } else if (type === 'selectByCouleur') {
      result = window.processes['selectByCouleur'](resteLot, keys);
    } else if (type === 'selectByFibre') {
      if ('threshold' in transfo && 'condition' in transfo) {
        result = window.processes['selectByFibre'](
          resteLot,
          keys,
          transfo.threshold,
          transfo.condition
        );
      } else {
        result = window.processes['selectByFibre'](resteLot, keys);
      }
    } else if (type === 'selectByProprete') {
      result = window.processes['selectByProprete'](resteLot, keys);
    } else if (type === 'selectByPerturbateur') {
      result = window.processes['selectByPerturbateur'](resteLot, keys);
    } else if (window.processes && window.processes[type]) {
      const params = { yield: transfo.yield };
      const { targetLot, coProductLot } = window.processes[type](
        resteLot,
        keys,
        params
      );
      result = { targetLot, coProductLot };
    } else {
      throw new Error('Type de transformation non géré : ' + type);
    }
    const { targetLot, coProductLot } = result;
    if (!targetLot) return;

    // Ajout de la target au lot si elle existe dans le scénario
    if (transfo.scenario && transfo.scenario.target) {
      targetLot.target = transfo.scenario.target;
    }

    // Utiliser le title de la transformation s'il existe, sinon générer un titre unique
    const titre = transfo.title || `${pathNum}.${idx + 1}`;
    if (!targetLot.title) targetLot.title = titre;
    const nodeId = `${idGenObj.id++}`;
    // On pousse la référence réelle (pas de clone)
    const newTransformations = [...transformations_appliquees, transfo];
    const nodeName = targetLot.target
      ? `${type}: ${keys.join(' + ')} → ${targetLot.target}`
      : `${type}: ${keys.join(' + ')}`;
    targetLot.id = nodeId;

    // On crée d'abord le nœud
    transfo._nodeId = nodeId;
    console.log('applyScenario - pathArr:', pathArr, 'idx:', idx, 'nodePath:', [
      ...pathArr,
      idx,
    ]);
    const nodePath = [...pathArr, idx];
    nodes.push({
      id: nodeId,
      name: nodeName,
      lot: targetLot,
      transformations_appliquees: newTransformations,
      _path: nodePath, // Ajout explicite du path unique pour ce node
    });

    // Puis le lien qui part du parent vers ce nœud
    links.push({
      source: parentNodeId,
      target: nodeId,
      value: targetLot.total,
      transformation: transfo, // La transformation qui part du parent vers ce nœud (annotée)
    });
    totalChildren += targetLot.total;

    // Sous-scenario récursif (sur le lot sélectionné, relié à ce nœud)
    if (
      transfo.scenario &&
      transfo.scenario.transformations &&
      transfo.scenario.transformations.length > 0
    ) {
      // On passe le path étendu pour le sous-scenario
      const subPath = [...pathArr, idx, 'scenario', 'transformations'];
      applyScenario(
        targetLot,
        transfo.scenario,
        nodeId,
        nodes,
        links,
        idGenObj,
        false,
        newTransformations,
        depth + 1,
        titre,
        subPath
      );
    }
    // On retire cette part du reste global
    resteLot = coProductLot;
  });

  // Gestion du coproduit (reste)
  if (resteLot && resteLot.total > 0.1) {
    const titre =
      scenario.coproduct_scenario?.title ||
      `${pathNum}.${(scenario.transformations || []).length + 1}`;
    if (!resteLot.title) resteLot.title = titre;
    if (scenario.coproduct_scenario && scenario.coproduct_scenario.target) {
      resteLot.target = scenario.coproduct_scenario.target;
    }
    const coproductNodeId = `${idGenObj.id++}`;
    let coproductPath;
    if (
      pathArr.length >= 2 &&
      pathArr[pathArr.length - 2] === 'transformations' &&
      typeof pathArr[pathArr.length - 1] === 'number'
    ) {
      // On est dans une transformation du scénario principal ou d'un sous-scenario
      coproductPath = [
        ...pathArr,
        'scenario',
        'coproduct_scenario',
        'transformations',
      ];
    } else if (isRoot) {
      // Vrai coproduit racine
      coproductPath = ['main', 'coproduct_scenario', 'transformations'];
    } else {
      // Fallback (devrait être rare)
      coproductPath = [...pathArr, 'coproduct_scenario', 'transformations'];
    }
    resteLot.id = coproductNodeId;
    resteLot._path = coproductPath;
    const nodeName = resteLot.target ? `Reste → ${resteLot.target}` : 'Reste';
    nodes.push({
      id: coproductNodeId,
      name: nodeName,
      lot: resteLot,
      transformations_appliquees: transformations_appliquees,
      _path: coproductPath, // Ajouté ici aussi pour accès direct côté Sankey
    });
    // On annote la première transformation du coproduit si elle existe
    if (
      scenario.coproduct_scenario &&
      scenario.coproduct_scenario.transformations &&
      scenario.coproduct_scenario.transformations.length > 0
    ) {
      scenario.coproduct_scenario.transformations.forEach(
        (coproTransfo, cidx) => {
          if (!coproTransfo._path) coproTransfo._path = [...coproductPath];
          if (typeof coproTransfo._index !== 'number')
            coproTransfo._index = cidx;
        }
      );
    }
    links.push({
      source: parentNodeId,
      target: coproductNodeId,
      value: resteLot.total,
      transformation: scenario.coproduct_scenario?.transformations?.[0] || null, // La transformation du coproduit si elle existe (annotée)
    });
    totalChildren += resteLot.total;
    if (
      scenario.coproduct_scenario &&
      scenario.coproduct_scenario.transformations &&
      scenario.coproduct_scenario.transformations.length > 0
    ) {
      const coproPath = [...pathArr, 'coproduct_scenario', 'transformations'];
      applyScenario(
        resteLot,
        scenario.coproduct_scenario,
        coproductNodeId,
        nodes,
        links,
        idGenObj,
        false,
        transformations_appliquees,
        depth + 1,
        titre,
        coproPath
      );
    }
  }

  // Correction des proportions
  if (
    !isRoot &&
    Math.abs(totalChildren - parentTotal) > 0.1 &&
    nodes.length > 1
  ) {
    const lastNode = nodes[nodes.length - 1];
    const diff = parentTotal - totalChildren;
    lastNode.lot.total += diff;
    const lastLink = links[links.length - 1];
    lastLink.value += diff;
  }

  return { nodes, links };
}
window.applyScenario = applyScenario;
