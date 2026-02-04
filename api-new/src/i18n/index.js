/**
 * i18next Configuration
 * Internationalization setup for the API
 */

const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');

// Initialize i18next
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    // Default and fallback language
    fallbackLng: 'bg',
    
    // Supported languages
    supportedLngs: ['bg', 'en'],
    
    // Preload languages
    preload: ['bg', 'en'],
    
    // Namespaces
    defaultNS: 'common',
    ns: ['common', 'errors', 'emails'],
    
    // Backend options (file-based)
    backend: {
      loadPath: path.join(__dirname, '{{lng}}/{{ns}}.json')
    },
    
    // Language detection options
    detection: {
      order: ['header', 'querystring'],
      lookupHeader: 'accept-language',
      lookupQuerystring: 'lang',
      caches: false
    },
    
    // Interpolation options
    interpolation: {
      escapeValue: false
    },
    
    // Debug mode (only in development)
    debug: process.env.NODE_ENV === 'development'
  });

// Export middleware and i18next instance
module.exports = {
  i18next,
  i18nMiddleware: middleware.handle(i18next)
};
