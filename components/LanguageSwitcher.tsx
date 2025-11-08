"use client";

import { useLocale } from "next-intl";
import { locales } from "@/i18n";

const languageNames: Record<string, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  ar: "العربية",
};

export default function LanguageSwitcher() {
  const locale = useLocale();

  const handleLanguageChange = async (newLocale: string) => {
    // Update user preference in database
    try {
      await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLocale }),
      });
    } catch (error) {
      console.error("Failed to update language preference:", error);
    }

    // Dispatch custom event to trigger locale change
    const event = new CustomEvent("localeChange", {
      detail: { locale: newLocale },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="relative inline-block">
      <select
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Select language"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {languageNames[loc]}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg
          className="fill-current h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}

