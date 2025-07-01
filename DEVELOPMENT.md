# Guide de Développement

## 🛠️ Outils de Qualité de Code

Ce projet utilise plusieurs outils pour maintenir la qualité du code :

### **ESLint** - Analyse statique du code

```bash
# Vérifier le code
npm run lint

# Corriger automatiquement les erreurs
npm run lint:fix
```

### **TypeScript** - Vérification des types

```bash
# Vérifier les types sans compiler
npm run type-check
```

### **Prettier** - Formatage automatique

```bash
# Formater tous les fichiers
npx prettier --write .

# Vérifier le formatage
npx prettier --check .
```

## 🔄 Hooks Git (Pre-commit)

Des vérifications automatiques sont lancées avant chaque commit :

1. **Linting** des fichiers modifiés (ESLint)
2. **Formatage** automatique (Prettier)
3. **Vérification des types** (TypeScript)

### **Si un commit échoue :**

- Corrige les erreurs ESLint : `npm run lint:fix`
- Vérifie les types : `npm run type-check`
- Recommence le commit

## 📋 Scripts Disponibles

```bash
# Développement
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production

# Qualité de code
npm run lint         # Vérifier le code
npm run lint:fix     # Corriger automatiquement
npm run type-check   # Vérifier les types
npm run check        # Lint + Type-check
npm run prebuild     # Vérifications avant build
```

## 🚀 Workflow Recommandé

1. **Avant de commencer** :

   ```bash
   npm run check
   ```

2. **Pendant le développement** :

   ```bash
   npm run dev
   ```

3. **Avant de commiter** :

   ```bash
   npm run lint:fix
   npm run type-check
   git add .
   git commit -m "feat: description"
   ```

4. **Avant de pousser** :
   ```bash
   npm run build
   ```

## ⚠️ Erreurs Courantes

### **ESLint Errors**

- `Unexpected any` → Typer explicitement les variables
- `'variable' is defined but never used` → Supprimer ou utiliser la variable
- `Missing parameter` → Ajouter les paramètres requis

### **TypeScript Errors**

- `Type 'X' is not assignable to type 'Y'` → Vérifier les types
- `Property 'X' does not exist` → Ajouter les propriétés manquantes

## 🎯 Bonnes Pratiques

1. **Toujours typer** les variables et fonctions
2. **Utiliser ESLint** pour détecter les problèmes
3. **Formater le code** avec Prettier
4. **Tester avant de commiter** avec `npm run check`
5. **Documenter** les fonctions complexes

## 🔧 Configuration

- **ESLint** : `.eslintrc.json`
- **Prettier** : `.prettierrc`
- **TypeScript** : `tsconfig.json`
- **Husky** : `.husky/pre-commit`
- **Lint-staged** : `package.json` → `lint-staged`
