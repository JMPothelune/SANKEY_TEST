export const availableLanguages = [
  { code: 'fr_fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en_gb', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'es_es', name: 'Español', flag: '🇪🇸' },
  { code: 'de_de', name: 'Deutsch', flag: '🇩🇪' },
] as const;

export type LanguageCode = (typeof availableLanguages)[number]['code'];
