import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';

import {
  translations,
  LanguageCode,
  TranslationKeys,
} from './translations';

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKeys) => string;
};

const LanguageContext = createContext<
  LanguageContextType | undefined
>(undefined);

type Props = {
  children: ReactNode;
};

export function LanguageProvider({ children }: Props) {
  const [language, setLanguageState] =
    useState<LanguageCode>('en');

  const setLanguage = (newLanguage: LanguageCode) => {
    setLanguageState(newLanguage);
  };

  const t = (key: TranslationKeys): string => {
    return translations[language][key] ?? translations.en[key];
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider'
    );
  }

  return context;
}