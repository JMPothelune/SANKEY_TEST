import { translations } from '../src/lib/translations.js';
import fs from 'fs';

const i18nConfig = `
window.i18nConfig = {
  resources: ${JSON.stringify(translations, null, 2)},
  fallbackLng: 'fr_fr',
  debug: false,
  defaultNS: 'translation',
  ns: ['translation']
};
`;

fs.writeFileSync('public/i18n-config.js', i18nConfig);
console.log('✅ Traductions générées');
