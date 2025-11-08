"use client";

import { SessionProvider, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import EncryptionKeyManager from "@/lib/encryption";
import { NextIntlClientProvider } from "next-intl";
import { defaultLocale, getMessages, type Locale } from "@/i18n";

function EncryptionInitializer({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Initialize encryption key when user is authenticated
    if (status === "authenticated" && session?.user) {
      // In a real production app, derive key from user's password during login
      // For now, we'll use a placeholder initialization
      // This should be done in the login process where the password is available
      const initKey = async () => {
        try {
          // Check if key already exists
          const existingKey = await EncryptionKeyManager.getKey();
          if (!existingKey) {
            // Initialize with user email as placeholder (NOT SECURE - use actual password)
            await EncryptionKeyManager.initializeFromPassword(
              session.user.email || "default-encryption-key"
            );
          }
        } catch (error) {
          console.error("Failed to initialize encryption:", error);
        }
      };
      initKey();
    } else if (status === "unauthenticated") {
      // Clear encryption key on logout
      EncryptionKeyManager.clearKey();
    }
  }, [status, session]);

  return <>{children}</>;
}

function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load locale from localStorage or user preference
    const loadLocale = async () => {
      try {
        const savedLocale = localStorage.getItem("locale") as Locale;
        const userLocale = savedLocale || defaultLocale;
        const msgs = await getMessages(userLocale);
        setLocale(userLocale);
        setMessages(msgs);
      } catch (error) {
        console.error("Failed to load locale:", error);
        const msgs = await getMessages(defaultLocale);
        setMessages(msgs);
      } finally {
        setLoading(false);
      }
    };
    loadLocale();
  }, []);

  // Listen for locale changes
  useEffect(() => {
    const handleLocaleChange = async (event: CustomEvent) => {
      const newLocale = event.detail.locale as Locale;
      const msgs = await getMessages(newLocale);
      setLocale(newLocale);
      setMessages(msgs);
      localStorage.setItem("locale", newLocale);
    };

    window.addEventListener("localeChange" as any, handleLocaleChange);
    return () => {
      window.removeEventListener("localeChange" as any, handleLocaleChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <EncryptionInitializer>{children}</EncryptionInitializer>
      </I18nProvider>
    </SessionProvider>
  );
}
