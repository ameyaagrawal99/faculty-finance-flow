import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GlobalSettings, DEFAULT_SETTINGS, HRA_RATES } from "./types";

const STORAGE_KEY = "faculty-salary-settings";

interface SettingsContextType {
  settings: GlobalSettings;
  updateSettings: (partial: Partial<GlobalSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function loadSettings(): GlobalSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (partial: Partial<GlobalSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      // Sync HRA percent when city type changes
      if (partial.hraCityType) {
        next.hraPercent = HRA_RATES[partial.hraCityType] ?? prev.hraPercent;
      }
      return next;
    });
  };

  const resetSettings = () => setSettings({ ...DEFAULT_SETTINGS });

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
