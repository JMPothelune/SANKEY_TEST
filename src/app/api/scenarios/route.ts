import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createContext, runInContext } from 'vm';

export async function GET() {
  try {
    // Lire le fichier scenario-data.js
    const filePath = join(process.cwd(), 'public', 'data', 'scenario-data.js');
    const fileContent = readFileSync(filePath, 'utf-8');

    // Créer un contexte Node.js pour exécuter le fichier
    const context: { window: { scenarios?: unknown } } = { window: {} };
    createContext(context);

    // Exécuter le fichier dans le contexte
    runInContext(fileContent, context);

    const scenarios = context.window.scenarios;

    if (!scenarios) {
      return NextResponse.json(
        { error: 'Scénarios non trouvés' },
        { status: 404 }
      );
    }

    return NextResponse.json(scenarios);
  } catch (error) {
    console.error('Erreur lors du chargement des scénarios:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
