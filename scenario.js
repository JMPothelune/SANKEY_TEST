// Lot de départ générique (exemple sur 1000 kg)
const lotInitial = {
    total: 1000,
    format: Object.fromEntries(Object.entries(formats_types).map(([format, obj]) => [
        format,
        {
            pourcentage: obj.pourcentage,
            sous: obj.types ? Object.fromEntries(Object.entries(obj.types).map(([type, pct]) => [type, { pourcentage: pct }])) : undefined
        }
    ])),
    matiere: Object.fromEntries(Object.entries(matieres_fibres).map(([mat, obj]) => [
        mat,
        {
            pourcentage: obj.pourcentage,
            sous: obj.fibres ? Object.fromEntries(Object.entries(obj.fibres).map(([fibre, pct]) => [fibre, { pourcentage: pct }])) : undefined
        }
    ])),
    couleur: Object.fromEntries(Object.entries(couleurDistrib).map(([coul, pct]) => [coul, { pourcentage: pct } ])),
    qualite: Object.fromEntries(Object.entries(qualiteDistrib).map(([qual, pct]) => [qual, { pourcentage: pct } ])),
};

// Fonction de transformation générique : sélectionne des éléments de premier niveau dans une dimension
function selectFirstLevel(lot, dimension, selectedKeys) {
    const newLot = JSON.parse(JSON.stringify(lot)); // deep copy
    const dist = lot[dimension];
    let newDist = {};
    let newTotal = 0;
    let restDist = {};
    let restTotal = 0;

    if (dimension === 'format') {
        // Cas spécial pour les formats qui ont une structure à deux niveaux
        Object.entries(dist).forEach(([key, value]) => {
            if (selectedKeys.includes(key)) {
                newDist[key] = {
                    pourcentage: value.pourcentage,
                    types: value.types
                };
                newTotal += value.pourcentage;
            } else {
                restDist[key] = {
                    pourcentage: value.pourcentage,
                    types: value.types
                };
                restTotal += value.pourcentage;
            }
        });
        // Recalcul des pourcentages dans la dimension concernée
        Object.keys(newDist).forEach(key => {
            newDist[key].pourcentage = Math.round((newDist[key].pourcentage / newTotal) * 100 * 10) / 10;
        });
        Object.keys(restDist).forEach(key => {
            restDist[key].pourcentage = Math.round((restDist[key].pourcentage / restTotal) * 100 * 10) / 10;
        });
    } else {
        // Cas standard pour les autres dimensions
        Object.entries(dist).forEach(([key, value]) => {
            if (selectedKeys.includes(key)) {
                newDist[key] = value;
                newTotal += value;
            } else {
                restDist[key] = value;
                restTotal += value;
            }
        });
        // Recalcul des pourcentages dans la dimension concernée
        Object.keys(newDist).forEach(key => {
            newDist[key] = Math.round((newDist[key] / newTotal) * lot.total * 10) / 10;
        });
        Object.keys(restDist).forEach(key => {
            restDist[key] = Math.round((restDist[key] / restTotal) * lot.total * 10) / 10;
        });
    }

    // Création des deux lots
    const targetLot = {
        ...newLot,
        [dimension]: newDist,
        total: newTotal
    };

    const coProductLot = {
        ...newLot,
        [dimension]: restDist,
        total: restTotal
    };

    return { targetLot, coProductLot };
}

// Moteur de scénario/arbre
function applyScenario(lotInitial, scenario) {
    const lots = { '0': lotInitial };
    const nodes = [{ id: '0', name: 'Lot initial', lot: lotInitial }];
    const links = [];
    scenario.forEach(step => {
        const parentId = step.from || '0';
        const parentLot = lots[parentId];
        let result = null;
        if (step.transform.type === 'selectFirstLevel') {
            result = selectFirstLevel(parentLot, step.transform.dimension, step.transform.keys);
        }
        // Ajout des deux lots et des liens
        const targetId = step.id;
        const coProductId = `${step.id}_coProduct`;
        lots[targetId] = result.targetLot;
        lots[coProductId] = result.coProductLot;
        nodes.push(
            { id: targetId, name: step.transform.keys.join(' + '), lot: result.targetLot },
            { id: coProductId, name: 'Reste', lot: result.coProductLot }
        );
        links.push(
            { source: parentId, target: targetId, value: result.targetLot.total },
            { source: parentId, target: coProductId, value: result.coProductLot.total }
        );
    });
    return { nodes, links };
}

// Exemple de scénario (séparation en deux lots)
const scenario = [
    { 
        id: '1', 
        from: '0', 
        transform: { 
            type: 'selectFirstLevel', 
            dimension: 'format', 
            keys: ['Chaussures et bottes']  // On ne spécifie que ce qu'on veut sélectionner
        } 
    }
];

// Générer les données pour le Sankey
const sankeyScenario = applyScenario(lotInitial, scenario);
// sankeyScenario.nodes et sankeyScenario.links sont à utiliser dans sankey.js 
