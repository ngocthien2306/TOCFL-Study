/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useState } from 'react';

const SESSION_KEY = '_tsx_s';
const LOCAL_KEY = '_tsx_l';

interface StoredKey {
  key: string;
  persisted: boolean;
}

function loadStoredKey(): StoredKey {
  try {
    const sessionKey = sessionStorage.getItem(SESSION_KEY);
    if (sessionKey) return { key: sessionKey, persisted: false };

    const localKey = localStorage.getItem(LOCAL_KEY);
    if (localKey) {
      sessionStorage.setItem(SESSION_KEY, localKey);
      return { key: localKey, persisted: true };
    }
  } catch {
    // Storage can be unavailable in private browsing.
  }
  return { key: '', persisted: false };
}

interface SonioxKeyContextValue {
  sonioxKey: string;
  hasSonioxKey: boolean;
  persisted: boolean;
  setSonioxKey: (key: string, persist: boolean) => void;
  clearSonioxKey: () => void;
}

const SonioxKeyContext = createContext<SonioxKeyContextValue>({
  sonioxKey: '',
  hasSonioxKey: false,
  persisted: false,
  setSonioxKey: () => {},
  clearSonioxKey: () => {},
});

export const SonioxKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = loadStoredKey();
  const [sonioxKey, setKey] = useState(initial.key);
  const [persisted, setPersisted] = useState(initial.persisted);

  const setSonioxKey = useCallback((key: string, persist: boolean) => {
    const trimmed = key.trim();
    setKey(trimmed);
    setPersisted(persist);
    try {
      if (!trimmed) {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(LOCAL_KEY);
        return;
      }
      sessionStorage.setItem(SESSION_KEY, trimmed);
      if (persist) localStorage.setItem(LOCAL_KEY, trimmed);
      else localStorage.removeItem(LOCAL_KEY);
    } catch {
      // Keep the key in React state when storage is blocked.
    }
  }, []);

  const clearSonioxKey = useCallback(() => {
    setKey('');
    setPersisted(false);
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LOCAL_KEY);
    } catch {
      // Storage can be unavailable in private browsing.
    }
  }, []);

  return (
    <SonioxKeyContext.Provider value={{
      sonioxKey,
      hasSonioxKey: Boolean(sonioxKey),
      persisted,
      setSonioxKey,
      clearSonioxKey,
    }}>
      {children}
    </SonioxKeyContext.Provider>
  );
};

export function useSonioxKey(): SonioxKeyContextValue {
  return useContext(SonioxKeyContext);
}
