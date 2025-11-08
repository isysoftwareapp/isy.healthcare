// Supported locales
export const locales = ["en", "es", "fr", "ar"] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = "en";

// Get messages for a specific locale
export async function getMessages(locale: Locale) {
  try {
    return (await import(`./locales/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    return (await import(`./locales/${defaultLocale}.json`)).default;
  }
}
