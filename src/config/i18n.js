/**
 * ProFish i18n Configuration
 *
 * Initializes i18next with react-native-localize for automatic
 * device language detection. Supports 24 languages at launch.
 *
 * Quality tiers:
 *   Gold:   en, sv, no — Native-perfect (our languages)
 *   Silver: de, fr, es, pt-BR, ar, ja, ko — AI + Fiverr native review
 *   Bronze: fi, da, nl, it, pl, cs, tr, ru — AI + spot-check
 *   Copper: th, id, ms, vi, hi, fil — AI + community corrections
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

// ── Translation resources ────────────────────────────────
// Gold tier (perfect quality)
import en from '../locales/en.json';
import sv from '../locales/sv.json';
import no from '../locales/no.json';

// Silver tier (AI + Fiverr review)
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import ptBR from '../locales/pt-BR.json';
import ar from '../locales/ar.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';

// Bronze tier (AI + spot-check)
import fi from '../locales/fi.json';
import da from '../locales/da.json';
import nl from '../locales/nl.json';
import it from '../locales/it.json';
import pl from '../locales/pl.json';
import cs from '../locales/cs.json';
import tr from '../locales/tr.json';
import ru from '../locales/ru.json';

// Copper tier (AI + community corrections)
import th from '../locales/th.json';
import id from '../locales/id.json';
import ms from '../locales/ms.json';
import vi from '../locales/vi.json';
import hi from '../locales/hi.json';
import fil from '../locales/fil.json';

const resources = {
  // Gold
  en: { translation: en },
  sv: { translation: sv },
  no: { translation: no },
  // Silver
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  'pt-BR': { translation: ptBR },
  ar: { translation: ar },
  ja: { translation: ja },
  ko: { translation: ko },
  // Bronze
  fi: { translation: fi },
  da: { translation: da },
  nl: { translation: nl },
  it: { translation: it },
  pl: { translation: pl },
  cs: { translation: cs },
  tr: { translation: tr },
  ru: { translation: ru },
  // Copper
  th: { translation: th },
  id: { translation: id },
  ms: { translation: ms },
  vi: { translation: vi },
  hi: { translation: hi },
  fil: { translation: fil },
};

const SUPPORTED_LANGUAGES = Object.keys(resources);
const FALLBACK_LANGUAGE = 'en';

// Language quality tiers for telemetry & improvement tracking
export const LANGUAGE_TIERS = {
  gold: ['en', 'sv', 'no'],
  silver: ['de', 'fr', 'es', 'pt-BR', 'ar', 'ja', 'ko'],
  bronze: ['fi', 'da', 'nl', 'it', 'pl', 'cs', 'tr', 'ru'],
  copper: ['th', 'id', 'ms', 'vi', 'hi', 'fil'],
};

// RTL languages
const RTL_LANGUAGES = ['ar'];

/**
 * Detect the best language from device settings.
 * Falls back to English if no supported language is found.
 */
function getDeviceLanguage() {
  const locales = RNLocalize.getLocales();
  if (!locales || locales.length === 0) {
    return FALLBACK_LANGUAGE;
  }

  for (const locale of locales) {
    // Check for regional variants first (e.g. pt-BR)
    const regionCode = `${locale.languageCode}-${locale.countryCode}`;
    if (SUPPORTED_LANGUAGES.includes(regionCode)) {
      return regionCode;
    }
    // Fall back to language code
    if (SUPPORTED_LANGUAGES.includes(locale.languageCode)) {
      return locale.languageCode;
    }
  }

  return FALLBACK_LANGUAGE;
}

/**
 * Check if current language is RTL
 */
export function isRTL(lang) {
  return RTL_LANGUAGES.includes(lang || i18n.language);
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,

  interpolation: {
    escapeValue: false, // React already escapes
  },

  ns: ['translation'],
  defaultNS: 'translation',

  // Development: warn about missing keys
  saveMissing: __DEV__,
  missingKeyHandler: __DEV__
    ? (lngs, ns, key) => {
        console.warn(`[i18n] Missing key: "${key}" for ${lngs}`);
      }
    : undefined,

  react: {
    useSuspense: false,
  },
});

export default i18n;
export { SUPPORTED_LANGUAGES, FALLBACK_LANGUAGE, getDeviceLanguage };
